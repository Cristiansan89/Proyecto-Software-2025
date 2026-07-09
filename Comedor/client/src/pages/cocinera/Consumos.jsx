import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import consumosService from "../../services/consumosService";
import servicioService from "../../services/servicioService";
import auditoriaService from "../../services/auditoriaService";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  showSuccess,
  showError,
  showWarning,
  showToast,
  showInfo,
} from "../../utils/alertService";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import { formatNumeroAR } from "../../utils/formatNumero";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import TablaStyle from "../../styles/Tabla.module.css";

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

// Formatea la cantidad visualmente: sin decimales para Kg/L/Unidades, con 3 decimales para g/mL
function formatearCantidad(cantidad, unidad) {
  const sinDecimales = ["Kilogramos", "Litros", "Unidades"];
  if (sinDecimales.includes(unidad)) {
    return Number.isInteger(Number(cantidad))
      ? String(Math.round(cantidad))
      : parseFloat(Number(cantidad).toFixed(3))
          .toString()
          .replace(/\.?0+$/, "");
  }
  // Gramos o Mililitros: hasta 3 decimales significativos
  return parseFloat(Number(cantidad).toFixed(3)).toString();
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
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Valores iniciales de los filtros
  const obtenerFiltrosIniciales = () => ({
    fechaInicio: "",
    fechaFin: "",
    idServicio: "",
  });

  const [filtros, setFiltros] = useState(obtenerFiltrosIniciales());

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
          serviciosResponse.filter((s) => s.estado === "Activo") || [],
        );
      }
    } catch (error) {
      //console.error("Error al cargar datos iniciales:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los datos iniciales. Por favor, intente nuevamente más tarde.",
      );
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
        //console.error("Error:", response.message);
        showError("Error", `❌ ${response.message}`);
        setConsumos([]);
        setEstadisticas({
          totalRegistros: 0,
          totalConsumos: 0,
          promedioConsumos: 0,
          servicioMasConsumido: "",
        });
      }
    } catch (error) {
      //console.error("Error al cargar consumos:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los consumos. Por favor, intente nuevamente más tarde.",
      );
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
      "",
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
    setFiltros(obtenerFiltrosIniciales());
  };

  // Verificar si hay filtros activos (diferentes a los iniciales)
  const hayFiltrosActivos = () => {
    const filtrosIniciales = obtenerFiltrosIniciales();
    return (
      filtros.fechaInicio !== filtrosIniciales.fechaInicio ||
      filtros.fechaFin !== filtrosIniciales.fechaFin ||
      filtros.idServicio !== filtrosIniciales.idServicio
    );
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
      (s) => (s.idServicio || s.id_servicio) === idServicio,
    );
    return servicio ? servicio.nombre : "Servicio no encontrado";
  };

  const exportarCSV = () => {
    if (consumos.length === 0) {
      showInfo("No hay datos para exportar");
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
        consumo.unidadMedida || "Unidades",
      );
      return [
        formatDate(consumo.fecha),
        obtenerNombreServicio(consumo.id_servicio, consumo.nombreServicio),
        consumo.nombreInsumo || `Insumo #${consumo.id_insumo}`,
        formatNumeroAR(convertida.cantidad),
        convertida.unidad,
        consumo.fechaHoraGeneracion
          ? formatDate(consumo.fechaHoraGeneracion)
          : "N/A",
      ];
    });

    // Separador ";" para evitar conflicto con coma decimal
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(";"))
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

  const exportarPDF = async () => {
    if (consumos.length === 0) {
      showInfo("No hay datos para exportar");
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
        `Período: ${formatDate(filtros.fechaInicio)} - ${formatDate(filtros.fechaFin)}`,
        14,
        32,
      );
      doc.text(`Generado por: ${user.nombre} ${user.apellido}`, 14, 40);
      doc.text(`Fecha de generación: ${formatDateTime(new Date())}`, 14, 48);

      // Estadísticas resumen
      doc.setFontSize(14);
      doc.text("Resumen Estadístico:", 14, 60);
      doc.setFontSize(10);
      doc.text(`• Total de registros: ${estadisticas.totalRegistros}`, 20, 68);
      doc.text(`• Total consumos: ${estadisticas.totalConsumos}`, 20, 74);
      doc.text(
        `• Promedio de consumos: ${estadisticas.promedioConsumos}`,
        20,
        80,
      );
      doc.text(
        `• Servicio más consumido: ${estadisticas.servicioMasConsumido}`,
        20,
        86,
      );

      // Preparar datos para la tabla
      const tableData = consumos.map((consumo) => {
        const convertida = obtenerMejorUnidad(
          consumo.cantidadUtilizada || 0,
          consumo.unidadMedida || "Unidades",
        );
        return [
          formatDate(consumo.fecha),
          obtenerNombreServicio(consumo.id_servicio, consumo.nombreServicio),
          consumo.nombreInsumo || "N/A",
          formatNumeroAR(convertida.cantidad),
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
          doc.internal.pageSize.height - 10,
        );
      }

      // Guardar archivo
      const fechaInicio = filtros.fechaInicio.replace(/-/g, "");
      const fechaFin = filtros.fechaFin.replace(/-/g, "");
      doc.save(`reporte_consumos_${fechaInicio}_${fechaFin}.pdf`);

      // Registrar la generación del PDF en auditoría
      await auditoriaService.registrarReportePDF({
        nombreReporte: "Reporte de Consumos",
        tipoReporte: "Consumos",
        descripcion: `Reporte generado para el período ${filtros.fechaInicio} - ${filtros.fechaFin}`,
        detallesReporte: `Total registros: ${consumos.length}, Servicio: ${
          filtros.idServicio || "Todos"
        }`,
      });

      showSuccess("Éxito", "Reporte PDF generado exitosamente");
    } catch (error) {
      //console.error("Error al generar PDF:", error);
      showError("Error", "Error al generar el reporte PDF");
    }
  };

  const verDetalle = (consumo) => {
    const convertida = obtenerMejorUnidad(
      consumo.cantidadUtilizada || 0,
      consumo.unidadMedida || "Unidades",
    );

    showInfo(
      "Detalle de Consumo",
      `📊 DETALLE DE CONSUMO

      📅 Fecha: ${formatearFecha(consumo.fecha)}
      🍽️ Servicio: ${obtenerNombreServicio(
        consumo.id_servicio,
        consumo.nombreServicio,
      )}
      📦 Insumo: ${consumo.nombreInsumo || `Insumo #${consumo.id_insumo}`}
      ⚖️ Cantidad Utilizada: ${formatearCantidad(convertida.cantidad, convertida.unidad)} ${convertida.unidad}
      📐 Cantidad Calculada: ${consumo.cantidadCalculada}
      📊 Varianza: ${varianza}%
      🆔 ID de Consumo: ${consumo.id_consumo}
      🆔 ID de Jornada: ${consumo.id_jornada}
      🆔 ID de Insumo: ${consumo.id_insumo}
      📋 ID Item Receta: ${consumo.id_itemReceta}
      📋 Origen Cálculo: ${consumo.origenCalculo}
      📋 Fecha Hora Generación: ${
        consumo.fechaHoraGeneracion
          ? formatDateTime(consumo.fechaHoraGeneracion)
          : "N/A"
      }`,
    );
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Consumos...</p>
      </div>
    );
  }

  // Cálculo de paginación
  const filteredInsumos = consumos;
  const totalPages = Math.ceil(filteredInsumos.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const consumosAMostrar = filteredInsumos.slice(startIndex, endIndex);

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-chart-bar"></i>
            Gestión de Consumos
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Visualización y reportes de consumos del comedor escolar
          </p>
        </div>
      </div>
      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.headerLeft}>
          <div className={ContenidoStyle.searchFilters}>
            <div className={ContenidoStyle.filterActionsCook}>
              <label className={`${ComponenteStyle.formLabel} mb-0`}>
                <i className="fas fa-calendar me-1"></i>
                Fecha Inicio
              </label>
              <input
                type="date"
                className={ComponenteStyle.formControl}
                id="fechaInicio"
                name="fechaInicio"
                placeholder="dd/mm/aaaa"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
              />
            </div>
            <div className={ContenidoStyle.filterActionsCook}>
              <label className={`${ComponenteStyle.formLabel} mb-0`}>
                <i className="fas fa-calendar me-1"></i>
                Fecha Fin
              </label>
              <input
                type="date"
                className={ComponenteStyle.formControl}
                id="fechaFin"
                name="fechaFin"
                placeholder="dd/mm/aaaa"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
              />
            </div>

            <div className={ContenidoStyle.filterActionsCook}>
              <label className={`${ComponenteStyle.formLabel} mb-0`}>
                <i className="fas fa-utensils me-1"></i>
                Servicio
              </label>
              <select
                className={ComponenteStyle.formSelect}
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
            {hayFiltrosActivos() && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={limpiarFiltros}
                title="Limpiar filtros"
                style={{ marginTop: "2.5rem" }}
              >
                <i className="fas fa-times"></i>
                Limpiar
              </button>
            )}

            <div className="d-flex gap-2 mt-2 w-100">
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
                className="btn btn-danger mx-2"
                onClick={exportarPDF}
                disabled={consumos.length === 0}
              >
                <i className="fas fa-file-pdf me-2"></i>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        <div className={ContenidoStyle.card}>
          <div
            className={`${ContenidoStyle.cardHeader} ${ContenidoStyle.headerInventario} pb-0 pt-2`}
          >
            <h5>
              <i className="fas fa-list me-1"></i>
              Registros de Consumos
            </h5>
            <div className={ContenidoStyle.headerRight}>
              <label className="mx-2">
                <span>Registros por página:</span>
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Tabla de Consumos */}
          <div className={TablaStyle.tableContainer}>
            {consumos.length === 0 ? (
              <div>
                <div className={TablaStyle.emptyState}>
                  <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                  <h5>No se encontraron consumos</h5>
                  <p>No hay consumo que coincidan con tu búsqueda.</p>
                </div>
              </div>
            ) : (
              <div className={TablaStyle.scrollableTable}>
                <div className={TablaStyle.tableBodyScroll}>
                  <table
                    className={`${TablaStyle.tableData} table table-striped`}
                  >
                    <thead className={TablaStyle.tableHeaderFixed}>
                      <tr>
                        <th width="12%">#</th>
                        <th width="22%">
                          <i className="fas fa-calendar me-2"></i>
                          Fecha
                        </th>
                        <th width="22%">
                          <i className="fas fa-utensils me-2"></i>
                          Servicio
                        </th>
                        <th width="22%">
                          <i className="fas fa-cube me-2"></i>
                          Insumo
                        </th>
                        <th width="22%">
                          <i className="fas fa-weight me-2"></i>
                          Cantidad
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumosAMostrar.map((consumo, index) => (
                        <tr key={`${consumo.id_consumo}-${index}`}>
                          <td>
                            <strong>{startIndex + index + 1}</strong>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold">
                                {formatDate(consumo.fecha)}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="d-flex align-items-center">
                              <span
                                className={`${ComponenteStyle.badge} bg-primary me-2 text-white`}
                              >
                                <i className="fas fa-utensils me-1"></i>{" "}
                                {obtenerNombreServicio(
                                  consumo.id_servicio,
                                  consumo.nombreServicio,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`${ComponenteStyle.badge} bg-info text-dark fs-6`}
                            >
                              {consumo.nombreInsumo ||
                                `Insumo #${consumo.id_insumo}` ||
                                "N/A"}
                            </span>
                          </td>

                          <td>
                            {(() => {
                              const convertida = obtenerMejorUnidad(
                                consumo.cantidadUtilizada || 0,
                                consumo.unidadMedida || "Unidades",
                              );
                              return (
                                <span
                                  className={`${ComponenteStyle.badge} bg-warning text-dark fs-6`}
                                >
                                  <i className="fas fa-weight me-1"></i>
                                  {formatNumeroAR(convertida.cantidad)}{" "}
                                  {convertida.unidad}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className={TablaStyle.pagination}>
                      <button
                        className={TablaStyle.paginationBtn}
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <div className={TablaStyle.paginationInfo}>
                        Página {currentPage} de {totalPages} (
                        {filteredInsumos.length} registros)
                      </div>
                      <button
                        className={TablaStyle.paginationBtn}
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consumos;
