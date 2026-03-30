import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import asistenciasService from "../../services/asistenciasService";
import servicioService from "../../services/servicioService";
import { gradoService } from "../../services/gradoService";
import auditoriaService from "../../services/auditoriaService";
import planificacionMenuService from "../../services/planificacionMenuService";
import recetaService from "../../services/recetaService";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const ListaAsistenciasService = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [asistencias, setAsistencias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [filtros, setFiltros] = useState({
    fecha: new Date().toISOString().split("T")[0],
    idServicio: "",
    idGrado: "",
  });
  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    totalPresentes: 0,
    porcentajeAsistencia: 0,
  });
  const [asistenciaPorServicio, setAsistenciaPorServicio] = useState({});
  const [serviciosCompletados, setServiciosCompletados] = useState({});
  const [procesandoAutomatico, setProcesandoAutomatico] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (filtros.fecha) {
      cargarAsistencias();
    }
  }, [filtros]);

  // useEffect para monitorear asistencias completadas al 100%
  useEffect(() => {
    const intervalo = setInterval(() => {
      verificarAsistenciasCompletas();
    }, 5000); // Verificar cada 5 segundos

    return () => clearInterval(intervalo);
  }, [filtros.fecha, filtros.idServicio]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [serviciosData, gradosData] = await Promise.all([
        servicioService.getAll(),
        gradoService.getAll(),
      ]);

      setServicios(serviciosData || []);
      setGrados(gradosData || []);
    } catch (error) {
      // console.error("Error al cargar datos iniciales:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los datos iniciales. Por favor, intente nuevamente más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filtros.fecha) params.append("fecha", filtros.fecha);
      if (filtros.idServicio) params.append("idServicio", filtros.idServicio);
      if (filtros.idGrado) params.append("idGrado", filtros.idGrado);

      const queryString = params.toString();
      const response =
        await asistenciasService.obtenerRegistrosAsistenciasServicio(
          queryString
        );

      if (response.success) {
        setAsistencias(response.data || []);
        calcularEstadisticas(response.data || []);
      } else {
        //console.error("Error:", response.message);
        showError(
          "Error",
          "❌ Ocurrió un error al cargar las asistencias. Por favor, intente nuevamente más tarde."
        );
        setAsistencias([]);
        setEstadisticas({
          totalRegistros: 0,
          totalPresentes: 0,
          porcentajeAsistencia: 0,
        });
      }
    } catch (error) {
      //console.error("Error al cargar asistencias:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar las asistencias. Por favor, intente nuevamente más tarde."
      );
      setAsistencias([]);
      setEstadisticas({
        totalAlumnos: 0,
        presentes: 0,
        ausentes: 0,
        noConfirmados: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (asistenciasData) => {
    const totalRegistros = asistenciasData.length;
    const totalPresentes = asistenciasData.reduce(
      (sum, registro) => sum + (registro.cantidadPresentes || 0),
      0
    );
    const registrosConPresencia = asistenciasData.filter(
      (r) => (r.cantidadPresentes || 0) > 0
    ).length;
    const porcentajeAsistencia =
      totalRegistros > 0
        ? Math.round((registrosConPresencia / totalRegistros) * 100)
        : 0;

    setEstadisticas({
      totalRegistros,
      totalPresentes,
      porcentajeAsistencia,
    });

    // Agrupar asistencias por servicio para verificar si alguno está al 100%
    const asistenciasAgrupadas = {};
    asistenciasData.forEach((registro) => {
      const clave = `${registro.fecha}_${registro.id_servicio || registro.idServicio}`;
      if (!asistenciasAgrupadas[clave]) {
        asistenciasAgrupadas[clave] = {
          fecha: registro.fecha,
          servicio: registro.nombreServicio,
          idServicio: registro.id_servicio || registro.idServicio,
          registros: [],
        };
      }
      asistenciasAgrupadas[clave].registros.push(registro);
    });

    setAsistenciaPorServicio(asistenciasAgrupadas);
  };

  const verificarAsistenciasCompletas = async () => {
    try {
      // Solo verificar si la fecha actual coincide
      const hoy = new Date().toISOString().split("T")[0];
      if (filtros.fecha !== hoy) return;

      const serviciosCompletos = {};
      let hayServiciosAlcien = false;

      // Analizar cada servicio
      for (const [clave, datos] of Object.entries(asistenciaPorServicio)) {
        // Verificar si el servicio está completo
        const totalGrados = grados.length;
        const asistenciasRegistradas = datos.registros.length;

        if (asistenciasRegistradas >= totalGrados) {
          serviciosCompletos[datos.idServicio] = true;
          hayServiciosAlcien = true;

          // Si aún no ha sido procesado, procesar automáticamente
          if (!serviciosCompletados[datos.idServicio]) {
            await procesarAsistenciaAutomaticamente(
              datos.fecha,
              datos.idServicio,
              datos.servicio
            );
          }
        }
      }

      setServiciosCompletados(serviciosCompletos);
    } catch (error) {
      // No mostrar errores silenciosos continuamente
      // console.error("Error al verificar asistencias:", error);
    }
  };

  const procesarAsistenciaAutomaticamente = async (
    fecha,
    idServicio,
    nombreServicio
  ) => {
    if (procesandoAutomatico) return;

    setProcesandoAutomatico(true);
    try {
      // Obtener detalles del menú del día para este servicio
      const menuDelDia = await planificacionMenuService.getMenusSemana(
        fecha,
        fecha
      );
      const menu = menuDelDia?.find((m) => m.id_servicio === idServicio);

      // Crear notificación con opción de descargar PDF
      const notificacionElement = document.createElement("div");
      notificacionElement.id = `notif-${idServicio}`;

      showSuccess(
        "¡Asistencia Completada!",
        `La asistencia para ${nombreServicio} del día ${new Date(fecha).toLocaleDateString(
          "es-ES"
        )} ha sido completada al 100%.

Presiona el botón para descargar las instrucciones e ingredientes requeridos.`
      );

      // Ofrecer descargar PDF inmediatamente
      setTimeout(() => {
        const confirmar = confirm(
          `¿Desea descargar el PDF con las instrucciones e ingredientes para ${nombreServicio}?`
        );
        if (confirmar && menu) {
          exportarMenuAPDF(fecha, idServicio, nombreServicio, menu);
        }
      }, 500);

      // Registrar en auditoría
      await auditoriaService.registrarReportePDF({
        nombreReporte: `Asistencia completada - ${nombreServicio}`,
        tipoReporte: "Asistencia",
        descripcion: `Procesamiento automático de asistencia para ${nombreServicio} en fecha ${fecha}`,
      });
    } catch (error) {
      // console.error("Error al procesar asistencia automáticamente:", error);
    } finally {
      setProcesandoAutomatico(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: new Date().toISOString().split("T")[0],
      idServicio: "",
      idGrado: "",
    });
  };

  const formatearFecha = (fecha) => {
    // Parsear la fecha en formato YYYY-MM-DD correctamente
    const [year, month, day] = fecha.split("-");
    const dateObj = new Date(year, parseInt(month) - 1, day);
    return dateObj.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatearFechaCorta = (fecha) => {
    // Convierte YYYY-MM-DD a DD-MM-YYYY
    if (!fecha) return "Sin fecha";
    const [year, month, day] = fecha.split("-");
    return `${day}-${month}-${year}`;
  };

  const formatearFechaHora = (fechaHora) => {
    // Convierte YYYY-MM-DD HH:MM:SS a DD-MM-YYYY HH:MM:SS
    if (!fechaHora) return "N/A";
    const [fechaParte, horaParte] = fechaHora.split(" ");
    const [year, month, day] = fechaParte.split("-");
    return `${day}-${month}-${year} ${horaParte}`;
  };

  const formatearCantidadExacta = (cantidad, decimales = 3) => {
    const num = Number(cantidad);
    if (Number.isNaN(num)) return "0.000";
    return num.toFixed(decimales);
  };

  const exportarMenuAPDF = async (fecha, idServicio, nombreServicio, menu) => {
    try {
      const doc = new jsPDF();

      // Configuración inicial
      doc.setFontSize(16);
      doc.text(`Menú del Día - ${nombreServicio}`, 14, 20);

      // Información del menú
      doc.setFontSize(11);
      doc.text(`Fecha: ${formatearFecha(fecha)}`, 14, 32);
      doc.text(`Servicio: ${nombreServicio}`, 14, 40);
      doc.text(`Plato: ${menu.nombreReceta || "Sin especificar"}`, 14, 48);

      // Obtener detalles de la receta usando recetaService
      let recetaDetalles = null;
      try {
        const respuesta = await recetaService.getById(menu.id_receta);
        recetaDetalles = respuesta;
      } catch (error) {
        // console.warn("No se pudieron obtener detalles de la receta");
      }

      // Instrucciones
      let yPosition = 58;
      if (recetaDetalles?.instrucciones) {
        doc.setFontSize(12);
        doc.text("Instrucciones:", 14, yPosition);
        doc.setFontSize(10);
        const instruccionesTexto = doc.splitTextToSize(
          recetaDetalles.instrucciones,
          180
        );
        doc.text(instruccionesTexto, 14, yPosition + 8);
        yPosition = yPosition + 8 + instruccionesTexto.length * 5 + 10;
      }

      // Tabla de ingredientes
      if (recetaDetalles?.insumos && recetaDetalles.insumos.length > 0) {
        doc.setFontSize(12);
        doc.text("Ingredientes Requeridos:", 14, yPosition);

        const ingredientesData = recetaDetalles.insumos.map((insumo) => [
          insumo.nombreInsumo || insumo.nombre || "Sin nombre",
          `${formatearCantidadExacta(insumo.cantidad)} ${insumo.unidad || "unidad"}`,
        ]);

        autoTable(doc, {
          startY: yPosition + 8,
          head: [["Ingrediente", "Cantidad"]],
          body: ingredientesData,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [70, 130, 180], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
        });
      }

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(
        `menu_${nombreServicio}_${fecha.replace(/-/g, "")}_${Date.now()}.pdf`
      );

      showSuccess("Éxito", "PDF del menú descargado correctamente");
    } catch (error) {
      // console.error("Error al exportar menú a PDF:", error);
      showError("Error", "Error al generar el PDF del menú");
    }
  };

  const verDetalle = (registro) => {
    showInfo(
      "Información",
      `
      Detalle del Registro de Asistencia:
      
      Fecha: ${registro.fecha || "Sin especificar"}
      Servicio: ${registro.nombreServicio || "Sin especificar"}
      Grado: ${registro.nombreGrado || "Sin especificar"}
      Cantidad de Presentes: ${registro.cantidadPresentes || 0}
      Fecha de Creación: ${registro.fechaCreacion || "N/A"}
    `
    );
  };

  const exportarCSV = () => {
    if (asistencias.length === 0) {
      showInfo("No hay datos para exportar", 4000);
      return;
    }

    const headers = [
      "Fecha",
      "Servicio",
      "Grado",
      "Cantidad Presentes",
      "Fecha Creacion",
    ];
    const csvData = asistencias.map((registro) => [
      registro.fecha || "Sin especificar",
      registro.nombreServicio || "Sin especificar",
      registro.nombreGrado || "Sin especificar",
      registro.cantidadPresentes || 0,
      registro.fechaCreacion || "N/A",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registros-asistencias_${filtros.fecha}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async () => {
    if (asistencias.length === 0) {
      showInfo("No hay datos para exportar", 4000);
      return;
    }

    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text("Reporte de Asistencias por Servicio", 14, 22);

      // Información
      doc.setFontSize(11);
      doc.text(`Generado por: ${user.nombre} ${user.apellido}`, 14, 32);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
        14,
        40
      );
      doc.text(`Fecha del reporte: ${formatearFecha(filtros.fecha)}`, 14, 48);
      doc.text(`Total de registros: ${asistencias.length}`, 14, 56);

      // Preparar datos para tabla
      const tableData = asistencias.map((registro) => [
        registro.fecha || "Sin especificar",
        registro.nombreServicio || "Sin especificar",
        registro.nombreGrado || "Sin especificar",
        registro.cantidadPresentes || 0,
        registro.fechaCreacion || "N/A",
      ]);

      // Tabla
      autoTable(doc, {
        startY: 70,
        head: [
          [
            "Fecha",
            "Servicio",
            "Grado",
            "Cantidad Presentes",
            "Fecha Creación",
          ],
        ],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [70, 130, 180], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(
        `reporte_asistencias_${filtros.fecha.replace(
          /-/g,
          ""
        )}_${Date.now()}.pdf`
      );

      // Registrar la generación del PDF en auditoría
      await auditoriaService.registrarReportePDF({
        nombreReporte: "Reporte de Asistencias por Servicio",
        tipoReporte: "Asistencias",
        descripcion: `Reporte generado para la fecha ${filtros.fecha}`,
        detallesReporte: `Total registros: ${asistencias.length}, Servicio: ${
          filtros.idServicio || "Todos"
        }, Grado: ${filtros.idGrado || "Todos"}`,
      });

      showSuccess("Éxito", "Reporte PDF de asistencias generado exitosamente");
    } catch (error) {
      //console.error("Error al generar PDF:", error);
      showError("Error", "Error al generar el reporte PDF");
    }
  };

  if (loading && asistencias.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando asistencias...</span>
        </div>
        <p className="mt-3">Cargando registros de asistencias...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Registros</h6>
              <h2 className="text-primary">{estadisticas.totalRegistros}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Presentes</h6>
              <h2 className="text-success">{estadisticas.totalPresentes}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">% Clases con Presencia</h6>
              <h2 className="text-info">
                {estadisticas.porcentajeAsistencia}%
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="card-title mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros de Búsqueda
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="fecha" className="form-label">
                <i className="fas fa-calendar me-2"></i>
                Fecha
              </label>
              <input
                type="date"
                className="form-control"
                id="fecha"
                name="fecha"
                value={filtros.fecha}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="idServicio" className="form-label">
                <i className="fas fa-utensils me-2"></i>
                Servicio
              </label>
              <select
                className="form-select"
                id="idServicio"
                name="idServicio"
                value={filtros.idServicio}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {servicios.map((servicio) => (
                  <option
                    key={servicio.idServicio || servicio.id_servicio}
                    value={servicio.idServicio || servicio.id_servicio}
                  >
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label htmlFor="idGrado" className="form-label">
                <i className="fas fa-graduation-cap me-2"></i>
                Grado
              </label>
              <select
                className="form-select"
                id="idGrado"
                name="idGrado"
                value={filtros.idGrado}
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {grados.map((grado) => (
                  <option
                    key={grado.idGrado || grado.id_grado}
                    value={grado.idGrado || grado.id_grado}
                  >
                    {grado.nombre || grado.nombreGrado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={limpiarFiltros}
            >
              <i className="fas fa-broom me-2"></i>
              Limpiar Filtros
            </button>

            <button
              type="button"
              className="btn btn-success"
              onClick={exportarCSV}
              disabled={asistencias.length === 0}
            >
              <i className="fas fa-download me-2"></i>
              Exportar CSV
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={exportarPDF}
              disabled={asistencias.length === 0}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Asistencias */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            <i className="fas fa-list me-2"></i>
            Registros de Asistencias por Servicio
          </h5>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => cargarAsistencias()}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-1"></i>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2 text-muted">Actualizando datos...</p>
            </div>
          ) : asistencias.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No hay registros de asistencias</h5>
              <p className="text-muted">
                {filtros.fecha
                  ? `No se encontraron registros para ${formatearFecha(
                      filtros.fecha
                    )}`
                  : "No hay registros con los filtros seleccionados"}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table table-striped data-table">
                <thead className="table-header-fixed">
                  <tr>
                    <th width="5%">#</th>
                    <th width="15%">
                      <i className="fas fa-calendar me-2"></i>
                      Fecha
                    </th>
                    <th width="20%">
                      <i className="fas fa-utensils me-2"></i>
                      Servicio
                    </th>
                    <th width="10%">
                      <i className="fas fa-graduation-cap me-2"></i>
                      Grado
                    </th>
                    <th width="26%">
                      <i className="fas fa-users me-2"></i>
                      Cantidad Presentes
                    </th>
                    <th width="20%">
                      <i className="fas fa-clock me-2"></i>
                      Fecha Creación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {asistencias.map((registro, index) => (
                    <tr
                      key={`${
                        registro.idRegistro || registro.id_registro || index
                      }`}
                    >
                      <td>
                        <strong>{index + 1}</strong>
                      </td>
                      <td>
                        <strong className="text-dark">
                          {formatearFechaCorta(registro.fecha)}
                        </strong>
                      </td>

                      <td>
                        <span className="badge bg-primary">
                          <i className="fas fa-utensils me-1"></i>
                          {registro.nombreServicio || "Sin especificar"}
                        </span>
                      </td>

                      <td>
                        <span className="badge bg-success">
                          <i className="fas fa-graduation-cap me-1"></i>
                          {registro.nombreGrado || "Sin especificar"}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className="badge bg-warning text-dark fs-6">
                          <i className="fas fa-users me-1"></i>
                          {registro.cantidadPresentes || 0}
                        </span>
                      </td>

                      <td>
                        <strong>{formatearFechaHora(registro.fechaCreacion)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {asistencias.length > 0 && (
          <div className="card-footer">
            <div className="row text-center">
              <div className="col-md-12">
                <small className="text-black">
                  <i className="fas fa-info-circle me-1"></i>
                  Mostrando {asistencias.length} registro(s) de asistencia
                  agregados | Última actualización:{" "}
                  {new Date().toLocaleTimeString("es-ES")}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaAsistenciasService;
