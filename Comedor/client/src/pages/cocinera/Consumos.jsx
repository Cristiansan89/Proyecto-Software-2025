import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import consumosService from "../../services/consumosService";
import servicioService from "../../services/servicioService";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import "../../styles/Consumos.css";

// Función para convertir unidades de medida
function convertirUnidad(cantidad, unidadOrigen, unidadDestino) {
  if (unidadOrigen === unidadDestino) {
    return { cantidad, unidad: unidadOrigen };
  }

  // Conversiones a Gramos (para productos sólidos)
  const aGramos = {
    Gramos: 1,
    Kilogramos: 1000,
    Unidades: 1,
  };

  // Conversiones a Mililitros (para productos líquidos)
  const aMililitros = {
    Mililitros: 1,
    Litros: 1000,
    Unidades: 1,
  };

  const esLiquido = ["Mililitros", "Litros"].includes(unidadOrigen);
  const conversiones = esLiquido ? aMililitros : aGramos;

  if (!conversiones[unidadOrigen] || !conversiones[unidadDestino]) {
    return { cantidad, unidad: unidadOrigen };
  }

  const cantidadEnBase = cantidad * conversiones[unidadOrigen];
  const cantidadFinal = cantidadEnBase / conversiones[unidadDestino];

  return {
    cantidad: Math.round(cantidadFinal * 100) / 100,
    unidad: unidadDestino,
  };
}

// Función para obtener la mejor unidad de representación
function obtenerMejorUnidad(cantidad, unidadActual) {
  const esLiquido = ["Mililitros", "Litros"].includes(unidadActual);

  if (esLiquido) {
    if (cantidad >= 1000) {
      return convertirUnidad(cantidad, unidadActual, "Litros");
    }
    return { cantidad, unidad: unidadActual };
  } else {
    if (cantidad >= 1000) {
      return convertirUnidad(cantidad, unidadActual, "Kilogramos");
    }
    return { cantidad, unidad: unidadActual };
  }
}

const Consumos = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consumos, setConsumos] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0], // Primer día del mes actual
    fechaFin: new Date().toISOString().split("T")[0], // Día actual
    idServicio: "",
  });

  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    totalConsumos: 0,
    promedioConsumos: 0,
    servicioMasConsumido: "",
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarConsumos();
  }, [filtros]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      // Cargar servicios desde la API
      const serviciosResponse = await servicioService.getAll();
      if (serviciosResponse && Array.isArray(serviciosResponse)) {
        setServicios(
          serviciosResponse.filter((s) => s.estado === "Activo") || []
        );
      }
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      setServicios([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarConsumos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filtros.fechaInicio)
        params.append("fechaInicio", filtros.fechaInicio);
      if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
      if (filtros.idServicio) params.append("idServicio", filtros.idServicio);

      const queryString = params.toString();
      const response = await consumosService.obtenerConsumos(queryString);

      if (response.success) {
        setConsumos(response.data || []);
        calcularEstadisticas(response.data || []);
      } else {
        console.error("Error:", response.message);
        setConsumos([]);
        setEstadisticas({
          totalRegistros: 0,
          totalConsumos: 0,
          promedioConsumos: 0,
          servicioMasConsumido: "",
        });
      }
    } catch (error) {
      console.error("Error al cargar consumos:", error);
      setConsumos([]);
      setEstadisticas({
        totalRegistros: 0,
        totalConsumos: 0,
        promedioConsumos: 0,
        servicioMasConsumido: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (consumosData) => {
    const totalRegistros = consumosData.length;

    // Calcular total de consumos por cantidad registrada
    const totalConsumos = consumosData.reduce((sum, consumo) => {
      return sum + 1; // Contar registros de consumo
    }, 0);

    const promedioConsumos =
      totalRegistros > 0 ? totalConsumos / totalRegistros : 0;

    // Calcular servicio más consumido (por cantidad de registros)
    const consumosPorServicio = {};
    consumosData.forEach((consumo) => {
      const servicio = consumo.nombreServicio || "Sin especificar";
      if (!consumosPorServicio[servicio]) {
        consumosPorServicio[servicio] = 0;
      }
      consumosPorServicio[servicio] += 1;
    });

    const servicioMasConsumido = Object.keys(consumosPorServicio).reduce(
      (a, b) => (consumosPorServicio[a] > consumosPorServicio[b] ? a : b),
      ""
    );

    setEstadisticas({
      totalRegistros,
      totalConsumos,
      promedioConsumos: Math.round(promedioConsumos * 100) / 100,
      servicioMasConsumido,
    });
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
      fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      fechaFin: new Date().toISOString().split("T")[0],
      idServicio: "",
    });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const obtenerNombreServicio = (idServicio, nombreServicio) => {
    if (nombreServicio) return nombreServicio;
    const servicio = servicios.find(
      (s) => (s.idServicio || s.id_servicio) === idServicio
    );
    return servicio ? servicio.nombre : "Servicio no encontrado";
  };

  const exportarCSV = () => {
    if (consumos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const headers = [
      "Fecha",
      "Servicio",
      "Insumo",
      "Cantidad",
      "Unidad",
      "Fecha Generación",
    ];

    const csvData = consumos.map((consumo) => {
      const convertida = obtenerMejorUnidad(
        consumo.cantidadUtilizada || 0,
        consumo.unidadMedida || "Unidades"
      );
      return [
        formatearFecha(consumo.fecha),
        obtenerNombreServicio(consumo.id_servicio, consumo.nombreServicio),
        consumo.nombreInsumo || `Insumo #${consumo.id_insumo}` || "N/A",
        convertida.cantidad,
        convertida.unidad,
        consumo.fechaHoraGeneracion
          ? new Date(consumo.fechaHoraGeneracion).toLocaleDateString("es-ES")
          : "N/A",
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const fechaInicio = filtros.fechaInicio.replace(/-/g, "");
    const fechaFin = filtros.fechaFin.replace(/-/g, "");
    link.download = `consumos_${fechaInicio}_${fechaFin}_${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    if (consumos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      const doc = new jsPDF();

      // Título del documento
      doc.setFontSize(18);
      doc.text("Reporte de Consumos", 14, 22);

      // Información del periodo
      doc.setFontSize(12);
      doc.text(
        `Período: ${formatearFecha(filtros.fechaInicio)} - ${formatearFecha(
          filtros.fechaFin
        )}`,
        14,
        32
      );
      doc.text(`Generado por: ${user.nombre} ${user.apellido}`, 14, 40);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
        14,
        48
      );

      // Estadísticas resumen
      doc.setFontSize(14);
      doc.text("Resumen Estadístico:", 14, 60);
      doc.setFontSize(10);
      doc.text(`• Total de registros: ${estadisticas.totalRegistros}`, 20, 68);
      doc.text(`• Total consumos: ${estadisticas.totalConsumos}`, 20, 74);
      doc.text(
        `• Promedio de consumos: ${estadisticas.promedioConsumos}`,
        20,
        80
      );
      doc.text(
        `• Servicio más consumido: ${estadisticas.servicioMasConsumido}`,
        20,
        86
      );

      // Preparar datos para la tabla
      const tableData = consumos.map((consumo) => {
        const convertida = obtenerMejorUnidad(
          consumo.cantidadUtilizada || 0,
          consumo.unidadMedida || "Unidades"
        );
        return [
          new Date(consumo.fecha).toLocaleDateString("es-ES"),
          obtenerNombreServicio(consumo.id_servicio, consumo.nombreServicio),
          consumo.nombreInsumo || "N/A",
          convertida.cantidad.toString(),
          convertida.unidad,
        ];
      });

      // Tabla de datos
      autoTable(doc, {
        startY: 95,
        head: [["Fecha", "Servicio", "Insumo", "Cantidad", "Unidad"]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "left" },
          2: { halign: "left" },
          3: { halign: "center" },
          4: { halign: "center" },
        },
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

      // Guardar archivo
      const fechaInicio = filtros.fechaInicio.replace(/-/g, "");
      const fechaFin = filtros.fechaFin.replace(/-/g, "");
      doc.save(`reporte_consumos_${fechaInicio}_${fechaFin}.pdf`);

      alert("✅ Reporte PDF generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("❌ Error al generar el reporte PDF");
    }
  };

  const verDetalle = (consumo) => {
    const convertida = obtenerMejorUnidad(
      consumo.cantidadUtilizada || 0,
      consumo.unidadMedida || "Unidades"
    );

    const varianza = consumo.cantidadCalculada
      ? (
          ((consumo.cantidadUtilizada - consumo.cantidadCalculada) /
            consumo.cantidadCalculada) *
          100
        ).toFixed(2)
      : "N/A";

    alert(`📊 DETALLE DE CONSUMO

📅 Fecha: ${formatearFecha(consumo.fecha)}
🍽️ Servicio: ${obtenerNombreServicio(
      consumo.id_servicio,
      consumo.nombreServicio
    )}
📦 Insumo: ${consumo.nombreInsumo || `Insumo #${consumo.id_insumo}` || "N/A"}
⚖️ Cantidad Utilizada: ${convertida.cantidad} ${convertida.unidad}
📐 Cantidad Calculada: ${consumo.cantidadCalculada || "N/A"}
📊 Varianza: ${varianza}%
🆔 ID de Consumo: ${consumo.id_consumo}
🆔 ID de Jornada: ${consumo.id_jornada || "N/A"}
🆔 ID de Insumo: ${consumo.id_insumo || "N/A"}
📋 ID Item Receta: ${consumo.idItemReceta || "N/A"}
📋 Origen Cálculo: ${consumo.origenCalculo || "N/A"}
📋 Fecha Hora Generación: ${
      consumo.fechaHoraGeneracion
        ? new Date(consumo.fechaHoraGeneracion).toLocaleString("es-ES")
        : "N/A"
    }`);
  };

  if (loading && consumos.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando consumos...</span>
        </div>
        <p className="mt-3">Cargando registros de consumos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-chart-bar me-2"></i>
            Gestión de Consumos
          </h1>
          <p className="page-subtitle">
            Visualización y reportes de consumos del comedor escolar
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-list-ol stats-icon text-primary"></i>
              <h3 className="stats-number text-primary">
                {estadisticas.totalRegistros}
              </h3>
              <p className="stats-label">Total Registros</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-utensils stats-icon text-success"></i>
              <h3 className="stats-number text-success">
                {estadisticas.totalConsumos}
              </h3>
              <p className="stats-label">Total Consumos</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-chart-line stats-icon text-info"></i>
              <h3 className="stats-number text-info">
                {estadisticas.promedioConsumos}
              </h3>
              <p className="stats-label">Promedio por Registro</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <i className="fas fa-trophy stats-icon text-warning"></i>
              <h6 className="stats-number text-warning">
                {estadisticas.servicioMasConsumido || "N/A"}
              </h6>
              <p className="stats-label">Servicio Más Consumido</p>
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
            <div className="col-md-3">
              <label htmlFor="fechaInicio" className="form-label">
                <i className="fas fa-calendar me-2"></i>
                Fecha Inicio
              </label>
              <input
                type="date"
                className="form-control"
                id="fechaInicio"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="fechaFin" className="form-label">
                <i className="fas fa-calendar me-2"></i>
                Fecha Fin
              </label>
              <input
                type="date"
                className="form-control"
                id="fechaFin"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
              />
            </div>

            <div className="col-md-3">
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
              disabled={consumos.length === 0}
            >
              <i className="fas fa-file-csv me-2"></i>
              Exportar CSV
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={exportarPDF}
              disabled={consumos.length === 0}
            >
              <i className="fas fa-file-pdf me-2"></i>
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Consumos */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            <i className="fas fa-list me-2"></i>
            Registros de Consumos
          </h5>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => cargarConsumos()}
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
          ) : consumos.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No hay registros de consumos</h5>
              <p className="text-muted">
                No se encontraron registros para el período seleccionado
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-light">
                  <tr>
                    <th width="5%">#</th>
                    <th width="20%">
                      <i className="fas fa-calendar me-2"></i>
                      Fecha
                    </th>
                    <th width="20%">
                      <i className="fas fa-utensils me-2"></i>
                      Servicio
                    </th>
                    <th width="20%">
                      <i className="fas fa-cube me-2"></i>
                      Insumo
                    </th>
                    <th width="20%">
                      <i className="fas fa-weight me-2"></i>
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consumos.map((consumo, index) => (
                    <tr key={`${consumo.id_consumo}-${index}`}>
                      <td>
                        <strong>{index + 1}</strong>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">
                            {new Date(consumo.fecha).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-primary me-2">
                            <i className="fas fa-utensils me-1"></i>
                          </span>
                          {obtenerNombreServicio(
                            consumo.id_servicio,
                            consumo.nombreServicio
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="badge bg-info text-dark">
                          {consumo.nombreInsumo ||
                            `Insumo #${consumo.id_insumo}` ||
                            "N/A"}
                        </span>
                      </td>

                      <td>
                        {(() => {
                          const convertida = obtenerMejorUnidad(
                            consumo.cantidadUtilizada || 0,
                            consumo.unidadMedida || "Unidades"
                          );
                          return (
                            <span className="badge bg-warning text-dark fs-6">
                              <i className="fas fa-weight me-1"></i>
                              {convertida.cantidad} {convertida.unidad}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {consumos.length > 0 && (
          <div className="card-footer">
            <div className="row text-center">
              <div className="col-md-12">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Mostrando {consumos.length} registro(s) de consumos | Período:{" "}
                  {formatearFecha(filtros.fechaInicio)} -{" "}
                  {formatearFecha(filtros.fechaFin)} | Última actualización:{" "}
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

export default Consumos;
