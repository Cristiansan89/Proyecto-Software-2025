import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import consumosService from "../../services/consumosService";
import asistenciasService from "../../services/asistenciasService";
import API from "../../services/api";
import "../../styles/Estadistica.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const Estadistica = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
  });

  // Estado para gráficos
  const [datosConsumos, setDatosConsumos] = useState(null);
  const [datosAsistencias, setDatosAsistencias] = useState(null);
  const [datosInventario, setDatosInventario] = useState(null);
  const [datosServicios, setDatosServicios] = useState(null);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);

  const graficoRef = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarConsumos(),
        cargarAsistencias(),
        cargarInventario(),
        cargarServicios(),
      ]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarConsumos = async () => {
    try {
      const params = new URLSearchParams();
      params.append("fechaInicio", filtros.fechaInicio);
      params.append("fechaFin", filtros.fechaFin);

      const response = await consumosService.obtenerConsumos(params.toString());

      if (response.success && response.data) {
        // Agrupar consumos por día
        const consumosPorDia = {};
        response.data.forEach((consumo) => {
          const fecha = new Date(consumo.fecha).toLocaleDateString("es-ES");
          consumosPorDia[fecha] = (consumosPorDia[fecha] || 0) + 1;
        });

        // Agrupar por servicio
        const consumosPorServicio = {};
        response.data.forEach((consumo) => {
          const servicio = consumo.nombreServicio || "Sin servicio";
          consumosPorServicio[servicio] =
            (consumosPorServicio[servicio] || 0) + 1;
        });

        // Top 5 insumos más consumidos
        const insumosPorTipo = {};
        response.data.forEach((consumo) => {
          const insumo = consumo.nombreInsumo || "Desconocido";
          insumosPorTipo[insumo] =
            (insumosPorTipo[insumo] || 0) +
            (parseFloat(consumo.cantidadUtilizada) || 0);
        });

        const topInsumos = Object.entries(insumosPorTipo)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        setDatosConsumos({
          porDia: consumosPorDia,
          porServicio: consumosPorServicio,
          topInsumos: topInsumos,
          total: response.data.length,
        });
      }
    } catch (error) {
      console.error("Error al cargar consumos:", error);
    }
  };

  const cargarAsistencias = async () => {
    try {
      const response = await asistenciasService.obtenerRegistrosAsistencias(
        `fechaInicio=${filtros.fechaInicio}&fechaFin=${filtros.fechaFin}`
      );

      console.log("📊 Respuesta de asistencias:", response);

      if (response.success && response.data && Array.isArray(response.data)) {
        // Calcular totales
        const totalPresentes = response.data.reduce(
          (sum, reg) => sum + (reg.cantidadPresentes || 0),
          0
        );
        const totalAusentes = response.data.reduce(
          (sum, reg) => sum + (reg.cantidadAusentes || 0),
          0
        );
        const totalRegistros = response.data.length;

        console.log("✅ Totales calculados:", {
          totalPresentes,
          totalAusentes,
          totalRegistros,
        });

        // Por servicio
        const asistenciasPorServicio = {};
        response.data.forEach((registro) => {
          const servicio = registro.nombreServicio || "Sin servicio";
          asistenciasPorServicio[servicio] =
            (asistenciasPorServicio[servicio] || 0) +
            (registro.cantidadPresentes || 0);
        });

        setDatosAsistencias({
          totalPresentes,
          totalAusentes,
          totalRegistros,
          porcentajeAsistencia:
            totalRegistros > 0
              ? Math.round((totalPresentes / (totalRegistros * 40)) * 100)
              : 0,
          porServicio: asistenciasPorServicio,
        });
      } else {
        console.warn("⚠️ Sin datos de asistencia disponibles");
      }
    } catch (error) {
      console.error("❌ Error al cargar asistencias:", error);
      setDatosAsistencias(null);
    }
  };

  const cargarInventario = async () => {
    try {
      const response = await API.get("/insumos");

      if (response.data) {
        // Por categoría
        const porCategoria = {};
        const estadoPorCategoria = {
          Activo: 0,
          Inactivo: 0,
          "Stock Crítico": 0,
        };

        response.data.forEach((insumo) => {
          const categoria = insumo.categoria || "Otros";
          porCategoria[categoria] = (porCategoria[categoria] || 0) + 1;

          if (insumo.estado === "Activo") {
            estadoPorCategoria.Activo++;
          } else if (insumo.estado === "Inactivo") {
            estadoPorCategoria.Inactivo++;
          } else if (insumo.estado === "Crítico") {
            estadoPorCategoria["Stock Crítico"]++;
          }
        });

        setDatosInventario({
          porCategoria,
          estado: estadoPorCategoria,
          total: response.data.length,
          activos: response.data.filter((i) => i.estado === "Activo").length,
        });
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await API.get("/servicios");

      if (response.data && Array.isArray(response.data)) {
        const serviciosActivos = response.data.filter(
          (s) => s.estado === "Activo"
        ).length;
        const serviciosPorTipo = response.data.reduce((acc, servicio) => {
          acc[servicio.nombre] = (acc[servicio.nombre] || 0) + 1;
          return acc;
        }, {});

        setDatosServicios({
          total: response.data.length,
          activos: serviciosActivos,
          porTipo: serviciosPorTipo,
        });
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    }
  };

  const exportarPDF = async () => {
    try {
      const element = graficoRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 10;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;

      // Encabezado
      pdf.setFontSize(18);
      pdf.text("REPORTE DE ESTADÍSTICAS", margin, margin + 5);

      pdf.setFontSize(10);
      pdf.text(
        `Período: ${filtros.fechaInicio} a ${filtros.fechaFin}`,
        margin,
        margin + 12
      );
      pdf.text(
        `Generado por: ${user.nombre} ${user.apellido}`,
        margin,
        margin + 17
      );
      pdf.text(
        `Fecha: ${new Date().toLocaleString("es-ES")}`,
        margin,
        margin + 22
      );

      position = margin + 35;

      // Agregar imagen del gráfico
      if (imgHeight + position > pageHeight) {
        pdf.addPage();
        position = margin;
      }

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);

      // Agregar resumen estadístico en nueva página
      pdf.addPage();
      position = margin + 10;

      pdf.setFontSize(14);
      pdf.text("RESUMEN ESTADÍSTICO", margin, position);

      position += 12;
      pdf.setFontSize(11);

      if (datosConsumos) {
        pdf.text(`Consumos Totales: ${datosConsumos.total}`, margin, position);
        position += 7;
      }

      if (datosAsistencias) {
        pdf.text(
          `Asistencia Total: ${datosAsistencias.totalPresentes}`,
          margin,
          position
        );
        position += 7;
        pdf.text(
          `Porcentaje de Asistencia: ${datosAsistencias.porcentajeAsistencia}%`,
          margin,
          position
        );
        position += 7;
      }

      if (datosInventario) {
        pdf.text(
          `Total de Insumos: ${datosInventario.total}`,
          margin,
          position
        );
        position += 7;
        pdf.text(
          `Insumos Activos: ${datosInventario.activos}`,
          margin,
          position
        );
        position += 7;
      }

      pdf.save(`estadisticas_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar el PDF");
    }
  };

  // 🔧 NUEVO: Generar datos de prueba
  const generarDatosPrueba = async () => {
    try {
      setLoading(true);
      const response = await asistenciasService.generarDatosPrueba();

      if (response.success) {
        alert(
          `✅ ${response.message}\n\nRegistros creados: ${
            response.data?.registros || 0
          }`
        );
        // Recargar los datos
        await cargarDatos();
      } else {
        alert(`❌ Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Error al generar datos de prueba:", error);
      alert("Error al generar datos de prueba");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando datos estadísticos...</p>
      </div>
    );
  }

  return (
    <div className="estadistica-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-chart-bar me-2"></i>
            Estadísticas del Sistema
          </h1>
          <p className="page-subtitle">Análisis de datos y métricas clave</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-warning me-2"
            onClick={generarDatosPrueba}
            disabled={loading}
          >
            <i className="fas fa-database me-2"></i>
            {loading ? "Generando..." : "Generar Datos de Prueba"}
          </button>
          <button
            className="btn btn-primary"
            onClick={exportarPDF}
            disabled={loading}
          >
            <i className="fas fa-file-pdf me-2"></i>
            Exportar a PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-5">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaInicio: e.target.value })
                }
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-info w-100"
                onClick={cargarDatos}
                disabled={loading}
              >
                <i className="fas fa-sync me-1"></i>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="row mb-4">
        {datosConsumos && (
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <i className="fas fa-utensils stats-icon text-success"></i>
                <h3 className="stats-number">{datosConsumos.total}</h3>
                <p className="stats-label">Consumos Totales</p>
              </div>
            </div>
          </div>
        )}

        {datosAsistencias && datosAsistencias.totalRegistros > 0 && (
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <i className="fas fa-users stats-icon text-primary"></i>
                <h3 className="stats-number">
                  {datosAsistencias.totalPresentes}
                </h3>
                <p className="stats-label">Asistencias</p>
              </div>
            </div>
          </div>
        )}

        {datosInventario && (
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <i className="fas fa-boxes stats-icon text-warning"></i>
                <h3 className="stats-number">{datosInventario.activos}</h3>
                <p className="stats-label">Insumos Activos</p>
              </div>
            </div>
          </div>
        )}

        {datosServicios && (
          <div className="col-md-3">
            <div className="card stats-card">
              <div className="card-body text-center">
                <i className="fas fa-bell stats-icon text-info"></i>
                <h3 className="stats-number">{datosServicios.activos}</h3>
                <p className="stats-label">Servicios Activos</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div ref={graficoRef} className="graficos-container">
        <div className="row mb-4">
          {/* Consumos por Día */}
          {datosConsumos && (
            <div className="col-lg-6">
              <div className="card grafico-card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-chart-line me-2"></i>
                    Consumos Diarios
                  </h5>
                </div>
                <div className="card-body">
                  <Line
                    data={{
                      labels: Object.keys(datosConsumos.porDia),
                      datasets: [
                        {
                          label: "Consumos",
                          data: Object.values(datosConsumos.porDia),
                          borderColor: "#0d6efd",
                          backgroundColor: "rgba(13, 110, 253, 0.1)",
                          tension: 0.4,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: true,
                          position: "top",
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Asistencias */}
          {datosAsistencias && datosAsistencias.totalRegistros > 0 ? (
            <div className="col-lg-6">
              <div className="card grafico-card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-percent me-2"></i>
                    Tasa de Asistencia
                  </h5>
                </div>
                <div className="card-body">
                  <Doughnut
                    data={{
                      labels: ["Presentes", "Ausentes"],
                      datasets: [
                        {
                          data: [
                            datosAsistencias.totalPresentes,
                            datosAsistencias.totalAusentes,
                          ],
                          backgroundColor: ["#198754", "#dc3545"],
                          borderColor: ["#fff", "#fff"],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="col-lg-6">
              <div className="card grafico-card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-percent me-2"></i>
                    Tasa de Asistencia
                  </h5>
                </div>
                <div className="card-body text-center">
                  <i
                    className="fas fa-info-circle fa-2x text-muted mb-3"
                    style={{ display: "block" }}
                  ></i>
                  <p className="text-muted mb-2">
                    No hay datos de asistencia para el período seleccionado
                  </p>
                  <small className="text-secondary">
                    💡 <strong>Sugerencia:</strong> Genere enlaces de asistencia
                    en <strong>Gestión de Asistencias</strong> para registrar
                    las asistencias de los estudiantes.
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="row mb-4">
          {/* Consumos por Servicio */}
          {datosConsumos && (
            <div className="col-lg-6">
              <div className="card grafico-card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-bars me-2"></i>
                    Consumos por Servicio
                  </h5>
                </div>
                <div className="card-body">
                  <Bar
                    data={{
                      labels: Object.keys(datosConsumos.porServicio),
                      datasets: [
                        {
                          label: "Cantidad",
                          data: Object.values(datosConsumos.porServicio),
                          backgroundColor: [
                            "#0d6efd",
                            "#198754",
                            "#fd7e14",
                            "#dc3545",
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Insumos por Categoría */}
          {datosInventario && (
            <div className="col-lg-6">
              <div className="card grafico-card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-pie-chart me-2"></i>
                    Insumos por Categoría
                  </h5>
                </div>
                <div className="card-body">
                  <Pie
                    data={{
                      labels: Object.keys(datosInventario.porCategoria),
                      datasets: [
                        {
                          data: Object.values(datosInventario.porCategoria),
                          backgroundColor: [
                            "#0d6efd",
                            "#198754",
                            "#fd7e14",
                            "#dc3545",
                            "#6f42c1",
                            "#20c997",
                          ],
                          borderColor: "#fff",
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "right",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Insumos */}
        {datosConsumos && datosConsumos.topInsumos.length > 0 && (
          <div className="row">
            <div className="col-12">
              <div className="card grafico-card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-star me-2"></i>
                    Top 5 Insumos Más Consumidos
                  </h5>
                </div>
                <div className="card-body">
                  <Bar
                    data={{
                      labels: datosConsumos.topInsumos.map((item) => item[0]),
                      datasets: [
                        {
                          label: "Cantidad Consumida",
                          data: datosConsumos.topInsumos.map((item) => item[1]),
                          backgroundColor: "#0d6efd",
                        },
                      ],
                    }}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estadistica;
