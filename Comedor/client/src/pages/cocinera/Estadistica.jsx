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
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import consumosService from "../../services/consumosService";
import asistenciasService from "../../services/asistenciasService";
import auditoriaService from "../../services/auditoriaService";
import API from "../../services/api";
import "../../styles/Estadistica.css";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler,
);

// ============================================
// UTILIDADES DE FORMATEO
// ============================================

/**
 * Formatea un número con 3 decimales y coma como separador decimal
 * @param {number} valor - Valor a formatear
 * @param {number} decimales - Número de decimales (defecto 3)
 * @returns {string} - Valor formateado (ej: 12,450)
 */
const formatearNumero = (valor, decimales = 3) => {
  if (valor === null || valor === undefined) return "0,000";
  const numero = parseFloat(valor);
  if (isNaN(numero)) return "0,000";
  return numero.toFixed(decimales).replace(".", ",");
};

/**
 * Define el mapeo de colores por unidad de medida
 */
const COLORES_UNIDADES = {
  "Kilogramos": "#0d6efd",      // Azul
  "Litros": "#198754",       // Verde
  "Gramos": "#fd7e14",       // Naranja
  "Mililitros": "#dc3545",      // Rojo
};

/**
 * Normaliza la unidad de medida a su forma estándar
 * @param {string} unidad - Unidad a normalizar
 * @returns {string} - Unidad normalizada (Kg, L, g, ml)
 */
const normalizarUnidad = (unidad) => {
  if (!unidad) return "Kilogramos";
  const unidadLower = String(unidad).toLowerCase().trim();
  
  // Líquidos
  if (unidadLower.includes("litro") || unidadLower === "l") return "Litros";
  if (unidadLower.includes("ml") || unidadLower === "ml") return "Mililitros";
  
  // Sólidos
  if (unidadLower.includes("gramo") || unidadLower === "g") return "Gramos";
  if (unidadLower.includes("kg") || unidadLower === "kg") return "Kilogramos";
  
  return "Kg"; // Por defecto
};

/**
 * Obtiene el color según la unidad de medida
 * @param {string} unidad - Unidad normalizada
 * @returns {string} - Color en formato hex
 */
const obtenerColorUnidad = (unidad) => {
  return COLORES_UNIDADES[unidad] || COLORES_UNIDADES["Kilogramos"];
};

/**
 * Convierte un número a formato internacional (con comas como separador decimal)
 * @param {number} valor - Valor a convertir
 * @returns {string} - Valor formateado
 */
const formatearMoneda = (valor) => {
  if (valor === null || valor === undefined) return "$0,00";
  return `$${parseFloat(valor).toFixed(2).replace(".", ",")}`;
};

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================

/**
 * Componente para las tarjetas de KPI
 */
const KPICard = ({ icon, title, value, subtitle, color = "primary" }) => (
  <div className="col-md-6 five-card mb-2">
    <div className="card kpi-card text-center">
      <div className="card-body">
        <div className={`kpi-icon text-${color} mb-3`}>
          <i className={`${icon} fa-3x`}></i>
        </div>
        <h6 className="kpi-title mb-2">{title}</h6>
        <h3 className="kpi-value mb-2">{value}</h3>
        {subtitle && <small className="text-muted">{subtitle}</small>}
      </div>
    </div>
  </div>
);

/**
 * Componente para la barra de filtros
 */
const FiltrosGlobales = ({
  filtros,
  setFiltros,
  categorias,
  tiposMenu,
  estadosInsumo,
  grados,
  onActualizar,
  onLimpiar,
  loading,
}) => (
  <div className="card filtros-card mb-4">
    <div className="card-header bg-light">
      <h5 className="mb-0">
        <i className="fas fa-filter me-2"></i>
        Filtros Globales
      </h5>
    </div>
    <div className="card-body">
      <div className="row g-3 align-items-end">
        {/* Rango de Fechas */}
        <div className="col-md-2">
          <label className="form-label">Desde (DD/MM/AAAA)</label>
          <input
            type="date"
            className="form-control"
            value={filtros.fechaInicio}
            onChange={(e) =>
              setFiltros({ ...filtros, fechaInicio: e.target.value })
            }
            disabled={loading}
          />
        </div>

        <div className="col-md-2">
          <label className="form-label">Hasta (DD/MM/AAAA)</label>
          <input
            type="date"
            className="form-control"
            value={filtros.fechaFin}
            onChange={(e) =>
              setFiltros({ ...filtros, fechaFin: e.target.value })
            }
            disabled={loading}
          />
        </div>

        {/* Categoría de Insumos */}
        <div className="col-md-2">
          <label className="form-label">Categoría Insumo</label>
          <select
            className="form-select"
            value={filtros.categoriaInsumo}
            onChange={(e) =>
              setFiltros({ ...filtros, categoriaInsumo: e.target.value })
            }
            disabled={loading}
          >
            <option value="">Todos</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Menú */}
        <div className="col-md-2">
          <label className="form-label">Tipo de Menú</label>
          <select
            className="form-select"
            value={filtros.tipoMenu}
            onChange={(e) =>
              setFiltros({ ...filtros, tipoMenu: e.target.value })
            }
            disabled={loading}
          >
            <option value="">Todos</option>
            {tiposMenu.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        {/* Estado de Insumo */}
        <div className="col-md-2">
          <label className="form-label">Estado Insumo</label>
          <select
            className="form-select"
            value={filtros.estadoInsumo}
            onChange={(e) =>
              setFiltros({ ...filtros, estadoInsumo: e.target.value })
            }
            disabled={loading}
          >
            <option value="">Todos</option>
            {estadosInsumo.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {/* Grado */}
        <div className="col-md-2">
          <label className="form-label">Grado</label>
          <select
            className="form-select"
            value={filtros.grado}
            onChange={(e) => setFiltros({ ...filtros, grado: e.target.value })}
            disabled={loading}
          >
            <option value="">Todos</option>
            {grados.map((grado) => (
              <option key={grado} value={grado}>
                {grado}
              </option>
            ))}
          </select>
        </div>

        {/* Botones de Acción */}
        <div className="col-12 d-flex gap-2">
          <button
            className="btn btn-primary flex-grow-1"
            onClick={onActualizar}
            disabled={loading}
          >
            <i className="fas fa-sync me-2"></i>
            Actualizar Datos
          </button>
          <button
            className="btn btn-outline-secondary flex-grow-1"
            onClick={onLimpiar}
          >
            <i className="fas fa-times me-2"></i>
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Componente para gráficos con leyenda explicativa
 */
const GraficoConLeyenda = ({ titulo, leyenda, children, icon }) => (
  <div className="card grafico-card h-100">
    <div className="card-header bg-light">
      <h5 className="mb-2">
        <i className={`${icon} me-2`}></i>
        {titulo}
      </h5>
      <small className="text-muted badge bg-info-light">
        <i className="fas fa-lightbulb me-1"></i>
        {leyenda}
      </small>
    </div>
    <div className="card-body">{children}</div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const Estadistica = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    categoriaInsumo: "",
    tipoMenu: "",
    estadoInsumo: "",
    grado: "",
  });

  // Estado para cantidad de top insumos a mostrar
  const [cantidadTop, setCantidadTop] = useState(5);

  // Estado para gráficos
  const [datosConsumos, setDatosConsumos] = useState(null);
  const [datosAsistencias, setDatosAsistencias] = useState(null);
  const [datosInventario, setDatosInventario] = useState(null);
  const [datosServicios, setDatosServicios] = useState(null);

  // Estado para catálogos
  const [categorias, setCategorias] = useState([]);
  const [tiposMenu, setTiposMenu] = useState([]);
  const [estadosInsumo, setEstadosInsumo] = useState([]);
  const [grados, setGrados] = useState([]);

  const graficoRef = useRef(null);

  // Cargar catálogos al montar
  useEffect(() => {
    cargarCatalogos();
    cargarDatos();
  }, [filtros]);

  /**
   * Carga las categorías de insumos, tipos de menú, estados e insumo disponibles
   */
  const cargarCatalogos = async () => {
    try {
      // Obtener categorías de insumos
      const responseInsumos = await API.get("/insumos");
      if (responseInsumos.data) {
        const categoriasUnicas = [
          ...new Set(
            responseInsumos.data
              .map((i) => i.categoria)
              .filter((c) => c && c !== "Otros"),
          ),
        ].sort();
        setCategorias(categoriasUnicas);

        // Obtener estados únicos de insumos
        const estadosUnicos = [
          ...new Set(
            responseInsumos.data.map((i) => i.estado).filter((e) => e),
          ),
        ].sort();
        setEstadosInsumo(estadosUnicos);
      }

      // Obtener tipos de menú (servicios)
      const responseServicios = await API.get("/servicios");
      if (responseServicios.data) {
        const tiposUnicos = [
          ...new Set(responseServicios.data.map((s) => s.nombre)),
        ].sort();
        setTiposMenu(tiposUnicos);
      }

      // Obtener grados disponibles
      const responseGrados = await API.get("/grados");
      if (responseGrados.data) {
        const gradosUnicos = [
          ...new Set(
            responseGrados.data
              .map((g) => g.nombre || g.grado)
              .filter((g) => g),
          ),
        ].sort();
        setGrados(gradosUnicos);
      }
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
    }
  };



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
      //console.error("Error cargando datos:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar las estadísticas. Por favor, intente nuevamente más tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarConsumos = async () => {
    try {
      const params = new URLSearchParams();
      params.append("fechaInicio", filtros.fechaInicio);
      params.append("fechaFin", filtros.fechaFin);
      if (filtros.categoriaInsumo) {
        params.append("categoria", filtros.categoriaInsumo);
      }
      if (filtros.tipoMenu) {
        params.append("servicio", filtros.tipoMenu);
      }
      if (filtros.estadoInsumo) {
        params.append("estado", filtros.estadoInsumo);
      }
      if (filtros.grado) {
        params.append("grado", filtros.grado);
      }

      const response = await consumosService.obtenerConsumos(params.toString());

      if (response.success && response.data) {
        // Consumos por día (sin separar por unidad)
        const consumosPorDia = {};
        
        // Consumos por servicio y unidad {servicio-unidad: cantidad}
        const consumosPorServicioUnidad = {};
        
        // Insumos con su unidad {nombre: {cantidad, unidad}}
        const insumosPorTipo = {};

        response.data.forEach((consumo) => {
          const fecha = new Date(consumo.fecha).toLocaleDateString("es-ES");
          const cantidad = parseFloat(consumo.cantidadUtilizada) || 0;
          const cantidadActual = (consumosPorDia[fecha] || 0);
          
          consumosPorDia[fecha] = parseFloat(
            (cantidadActual + cantidad).toFixed(3),
          );

          // Agrupar por servicio y unidad
          const servicio = consumo.nombreServicio || "Sin servicio";
          const unidad = normalizarUnidad(consumo.unidadMedida);
          const keyServicioUnidad = `${servicio}|${unidad}`;
          
          consumosPorServicioUnidad[keyServicioUnidad] = parseFloat(
            ((consumosPorServicioUnidad[keyServicioUnidad] || 0) + cantidad).toFixed(3),
          );

          // Guardar insumo con su unidad
          const insumo = consumo.nombreInsumo || "Desconocido";
          if (!insumosPorTipo[insumo]) {
            insumosPorTipo[insumo] = {
              cantidad: 0,
              unidad: unidad,
            };
          }
          insumosPorTipo[insumo].cantidad = parseFloat(
            (insumosPorTipo[insumo].cantidad + cantidad).toFixed(3),
          );
        });

        // Ordenar fechas de menor a mayor
        const fechasOrdenadas = Object.keys(consumosPorDia).sort((a, b) => {
          const [diaA, mesA, anioA] = a.split("/");
          const [diaB, mesB, anioB] = b.split("/");
          const fechaA = new Date(`${anioA}-${mesA}-${diaA}`);
          const fechaB = new Date(`${anioB}-${mesB}-${diaB}`);
          return fechaA - fechaB;
        });
        const consumosPorDiaOrdenado = {};
        fechasOrdenadas.forEach((fecha) => {
          consumosPorDiaOrdenado[fecha] = consumosPorDia[fecha];
        });

        // Convertir consumosPorServicioUnidad a formato útil
        const consumosPorServicio = {};
        Object.entries(consumosPorServicioUnidad).forEach(([key, cantidad]) => {
          const [servicio, unidad] = key.split("|");
          if (!consumosPorServicio[servicio]) {
            consumosPorServicio[servicio] = {};
          }
          consumosPorServicio[servicio][unidad] = cantidad;
        });

        // Top insumos con unidad
        const topInsumos = Object.entries(insumosPorTipo)
          .map(([nombre, data]) => ({
            nombre,
            cantidad: data.cantidad,
            unidad: data.unidad,
          }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, cantidadTop);

        const totalConsumo = Object.values(consumosPorDiaOrdenado).reduce(
          (a, b) => a + b,
          0,
        );

        setDatosConsumos({
          porDia: consumosPorDiaOrdenado,
          fechasOrdenadas: fechasOrdenadas,
          porServicio: consumosPorServicio,
          topInsumos: topInsumos,
          total: parseFloat(totalConsumo.toFixed(3)),
        });
      }
    } catch (error) {
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los consumos. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  /**
   * Carga datos de asistencia CON CORRECCIONES y sin dependencia de servicio
   */
  const cargarAsistencias = async () => {
    try {
      const response = await asistenciasService.obtenerRegistrosAsistencias(
        `fechaInicio=${filtros.fechaInicio}&fechaFin=${filtros.fechaFin}`,
      );

      if (response.success && response.data && Array.isArray(response.data)) {
        // Contar registros por tipo de asistencia
        let totalPresentes = 0;
        let totalAusentes = 0;
        let totalNoAsisten = 0;

        response.data.forEach((registro) => {
          const tipoAsistencia =
            registro.tipoAsistencia?.trim().toLowerCase() || "";

          if (tipoAsistencia === "si") {
            totalPresentes += 1;
          } else if (tipoAsistencia === "ausente") {
            totalAusentes += 1;
          } else if (tipoAsistencia === "no") {
            totalNoAsisten += 1;
          }
        });

        // Asegurarse que existan datos válidos
        if (
          totalPresentes === 0 &&
          totalAusentes === 0 &&
          totalNoAsisten === 0
        ) {
          console.warn("No se encontraron datos de asistencia");
          setDatosAsistencias({
            totalPresentes: 0,
            totalAusentes: 0,
            totalNoAsisten: 0,
            totalRegistros: 0,
            porcentajeAsistencia: 0,
            porServicio: {},
          });
          return;
        }

        // Calcular porcentaje de asistencia solo sobre presentes vs ausentes (excluyendo "no asisten al servicio")
        const porcentajeAsistencia =
          totalPresentes + totalAusentes > 0
            ? parseFloat(
                (
                  (totalPresentes / (totalPresentes + totalAusentes)) *
                  100
                ).toFixed(1),
              )
            : 0;

        // Agrupar asistencias por servicio
        const asistenciasPorServicio = {};
        response.data.forEach((registro) => {
          const servicio = registro.nombreServicio || "Sin servicio";
          const tipoAsistencia =
            registro.tipoAsistencia?.trim().toLowerCase() || "";

          if (tipoAsistencia === "si") {
            asistenciasPorServicio[servicio] =
              (asistenciasPorServicio[servicio] || 0) + 1;
          }
        });

        console.log("Datos de asistencia cargados:", {
          totalPresentes,
          totalAusentes,
          totalNoAsisten,
          porcentajeAsistencia,
        });

        setDatosAsistencias({
          totalPresentes,
          totalAusentes,
          totalNoAsisten,
          totalRegistros: response.data.length,
          porcentajeAsistencia,
          porServicio: asistenciasPorServicio,
        });
      } else {
        setDatosAsistencias({
          totalPresentes: 0,
          totalAusentes: 0,
          totalNoAsisten: 0,
          totalRegistros: 0,
          porcentajeAsistencia: 0,
          porServicio: {},
        });
      }
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
      setDatosAsistencias({
        totalPresentes: 0,
        totalAusentes: 0,
        totalNoAsisten: 0,
        totalRegistros: 0,
        porcentajeAsistencia: 0,
        porServicio: {},
      });
    }
  };

  /**
   * Carga datos de inventario con análisis de stock crítico
   */
  const cargarInventario = async () => {
    try {
      const response = await API.get("/insumos");

      if (response.data) {
        const porCategoria = {};
        const estadoPorCategoria = {
          Activo: 0,
          Inactivo: 0,
          "Stock Crítico": 0,
        };

        let insumoMasCritico = null;
        let menorDiferencia = 0;

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

          // Encontrar insumo más crítico
          const stockMinimo = parseFloat(insumo.stockMinimo) || 0;
          const stockActual = parseFloat(insumo.stockActual) || 0;
          const diferencia = stockActual - stockMinimo;

          if (diferencia < menorDiferencia) {
            menorDiferencia = diferencia;
            insumoMasCritico = {
              nombre: insumo.nombreInsumo,
              stockActual: parseFloat(stockActual.toFixed(3)),
              stockMinimo: parseFloat(stockMinimo.toFixed(3)),
              diferencia: parseFloat(diferencia.toFixed(3)),
              unidad: insumo.unidadMedida,
            };
          }
        });

        setDatosInventario({
          porCategoria,
          estado: estadoPorCategoria,
          total: response.data.length,
          activos: response.data.filter((i) => i.estado === "Activo").length,
          criticos: estadoPorCategoria["Stock Crítico"],
          insumoMasCritico,
        });
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar el inventario. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  /**
   * Carga datos de servicios disponibles
   */
  const cargarServicios = async () => {
    try {
      const response = await API.get("/servicios");

      if (response.data && Array.isArray(response.data)) {
        const serviciosActivos = response.data.filter(
          (s) => s.estado === "Activo",
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
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los servicios. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  /**
   * Limpia los filtros y recarga datos
   */
  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      fechaFin: new Date().toISOString().split("T")[0],
      categoriaInsumo: "",
      tipoMenu: "",
      estadoInsumo: "",
      grado: "",
    });
    showInfo("Información", "✅ Filtros restablecidos");
  };

  /**
   * Exporta el reporte a PDF respetando los filtros
   */
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
      const margin = 15;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // ============== PÁGINA 1: ENCABEZADO ==============
      pdf.setFontSize(18);
      pdf.setFont(undefined, "bold");
      pdf.text("REPORTE DE ESTADÍSTICAS", margin, margin + 5);
      pdf.text("GESTIÓN DE COMEDOR", margin, margin + 12);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");

      // Formatear fechas en DD/MM/AAAA
      const fechaInicio = new Date(filtros.fechaInicio).toLocaleDateString(
        "es-ES",
      );
      const fechaFin = new Date(filtros.fechaFin).toLocaleDateString("es-ES");

      let y = margin + 25;
      pdf.text(`Período: ${fechaInicio} a ${fechaFin}`, margin, y);
      y += 7;

      if (filtros.categoriaInsumo) {
        pdf.text(`Categoría de Insumos: ${filtros.categoriaInsumo}`, margin, y);
        y += 7;
      }

      if (filtros.tipoMenu) {
        pdf.text(`Tipo de Menú: ${filtros.tipoMenu}`, margin, y);
        y += 7;
      }

      y += 5;
      pdf.setFont(undefined, "bold");
      pdf.text(`Generado por: ${user.nombre} ${user.apellido}`, margin, y);
      y += 7;
      pdf.setFont(undefined, "normal");
      pdf.text(`Fecha: ${new Date().toLocaleString("es-ES")}`, margin, y);
      pdf.text("Página 1", 10, pageHeight - 10);

      // ============== PÁGINA 2: GRÁFICOS ==============
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("GRÁFICOS Y ANÁLISIS", margin, margin + 5);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");

      const graphicsStartY = margin + 15;
      if (imgHeight + graphicsStartY < pageHeight - 10) {
        // Si cabe en una página
        pdf.addImage(imgData, "PNG", margin, graphicsStartY, imgWidth, imgHeight);
      } else {
        // Si no cabe, usar múltiples páginas
        let remainingHeight = imgHeight;
        let currentY = graphicsStartY;
        let sourceY = 0;

        while (remainingHeight > 0) {
          const heightToCopy = Math.min(
            remainingHeight,
            pageHeight - margin - currentY,
          );
          const heightInSource = (heightToCopy / imgHeight) * canvas.height;

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = heightInSource;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            heightInSource,
            0,
            0,
            canvas.width,
            heightInSource,
          );

          const tempImgData = tempCanvas.toDataURL("image/png");
          const tempHeight = (heightInSource * imgWidth) / canvas.width;

          pdf.addImage(tempImgData, "PNG", margin, currentY, imgWidth, tempHeight);

          remainingHeight -= heightToCopy;
          sourceY += heightInSource;

          if (remainingHeight > 0) {
            pdf.addPage();
            currentY = margin;
          }
        }
      }
      pdf.text("Página 2", 10, pageHeight - 10);


      // ============== PÁGINA FINAL: RESUMEN ==============
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text("RESUMEN ESTADÍSTICO", margin, margin + 5);

      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      let summaryY = margin + 20;

      // Consumos
      if (datosConsumos) {
        pdf.setFont(undefined, "bold");
        pdf.text("CONSUMO DE INSUMOS", margin, summaryY);
        summaryY += 8;
        pdf.setFont(undefined, "normal");

        pdf.text(
          `Total Consumo: ${formatearNumero(datosConsumos.total)} (Múltiples unidades)`,
          margin + 5,
          summaryY,
        );
        summaryY += 7;

        if (datosConsumos.topInsumos && datosConsumos.topInsumos.length > 0) {
          pdf.text("Top Insumos Consumidos:", margin + 5, summaryY);
          summaryY += 6;
          datosConsumos.topInsumos.slice(0, 3).forEach((insumo, idx) => {
            if (summaryY > pageHeight - margin) {
              pdf.addPage();
              summaryY = margin;
            }
            pdf.text(
              `${idx + 1}. ${insumo.nombre}: ${formatearNumero(insumo.cantidad)} ${insumo.unidad}`,
              margin + 10,
              summaryY,
            );
            summaryY += 6;
          });
        }
      }

      summaryY += 5;

      // Asistencias
      if (datosAsistencias && datosAsistencias.totalRegistros > 0) {
        if (summaryY > pageHeight - margin - 30) {
          pdf.addPage();
          summaryY = margin;
        }

        pdf.setFont(undefined, "bold");
        pdf.text("ASISTENCIA", margin, summaryY);
        summaryY += 8;
        pdf.setFont(undefined, "normal");

        pdf.text(
          `Total Presentes: ${datosAsistencias.totalPresentes}`,
          margin + 5,
          summaryY,
        );
        summaryY += 6;

        pdf.text(
          `Total Ausentes: ${datosAsistencias.totalAusentes}`,
          margin + 5,
          summaryY,
        );
        summaryY += 6;

        pdf.text(
          `No Asisten al Servicio: ${datosAsistencias.totalNoAsisten}`,
          margin + 5,
          summaryY,
        );
        summaryY += 6;

        pdf.setFont(undefined, "bold");
        pdf.text(
          `Porcentaje de Asistencia: ${formatearNumero(datosAsistencias.porcentajeAsistencia)}%`,
          margin + 5,
          summaryY,
        );
        summaryY += 8;
        pdf.setFont(undefined, "normal");
      }

      // Inventario
      if (datosInventario) {
        if (summaryY > pageHeight - margin - 40) {
          pdf.addPage();
          summaryY = margin;
        }

        pdf.setFont(undefined, "bold");
        pdf.text("INVENTARIO", margin, summaryY);
        summaryY += 8;
        pdf.setFont(undefined, "normal");

        pdf.text(
          `Total de Insumos: ${datosInventario.total}`,
          margin + 5,
          summaryY,
        );
        summaryY += 6;

        pdf.text(
          `Insumos Activos: ${datosInventario.activos}`,
          margin + 5,
          summaryY,
        );
        summaryY += 6;

        pdf.text(
          `Insumos en Riesgo: ${datosInventario.criticos}`,
          margin + 5,
          summaryY,
        );
        summaryY += 8;

        if (datosInventario.insumoMasCritico) {
          pdf.setFont(undefined, "bold");
          pdf.text("Insumo Más Crítico:", margin + 5, summaryY);
          summaryY += 7;
          pdf.setFont(undefined, "normal");

          pdf.text(
            `Nombre: ${datosInventario.insumoMasCritico.nombre}`,
            margin + 10,
            summaryY,
          );
          summaryY += 6;

          pdf.text(
            `Stock Actual: ${formatearNumero(datosInventario.insumoMasCritico.stockActual)} ${normalizarUnidad(datosInventario.insumoMasCritico.unidad)}`,
            margin + 10,
            summaryY,
          );
          summaryY += 6;

          pdf.text(
            `Stock Mínimo: ${formatearNumero(datosInventario.insumoMasCritico.stockMinimo)} ${normalizarUnidad(datosInventario.insumoMasCritico.unidad)}`,
            margin + 10,
            summaryY,
          );
        }
      }
      pdf.text("Página 3", 10, pageHeight - 10);

      pdf.save(`estadisticas_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`);

      await auditoriaService.registrarReportePDF({
        nombreReporte: "Reporte de Estadísticas",
        tipoReporte: "Estadísticas",
        descripcion: `Reporte de estadísticas generado para el período ${fechaInicio} - ${fechaFin}`,
        detallesReporte:
          "Incluye gráficos de consumos, asistencias e inventario con filtros aplicados",
      });

      showSuccess("Éxito", "✅ PDF exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      showError("Error", "❌ Error al exportar el PDF");
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
          <div className="row g-3">
            {/* Fecha Inicio */}
            <div className="col-md-2">
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

            {/* Fecha Fin */}
            <div className="col-md-2">
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

            <div className="col-md-6">
              <div className="col-12">
                <label className="form-label">
                  <strong>Cantidad de Top Insumos a mostrar</strong>
                </label>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="50"
                    value={cantidadTop}
                    onChange={(e) => setCantidadTop(parseInt(e.target.value))}
                    style={{ maxWidth: "300px" }}
                  />
                  <span
                    className="badge bg-primary"
                    style={{ minWidth: "50px" }}
                  >
                    Top {cantidadTop}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="col-12 d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={cargarDatos}
                disabled={loading}
              >
                <i className="fas fa-sync me-1"></i>
                Actualizar
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={limpiarFiltros}
              >
                <i className="fas fa-times me-1"></i>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Tarjetas de Resumen (KPIs) */}
      <div className="row mb-4">
        {datosConsumos && (
          <KPICard
            icon="fas fa-utensils"
            title="Total Consumo Mes"
            value={`${formatearNumero(datosConsumos.total)} Kg`}
            subtitle="Volumen total de insumos utilizados"
            color="success"
          />
        )}

        {datosInventario && datosInventario.insumoMasCritico && (
          <KPICard
            icon="fas fa-exclamation-triangle"
            title="Insumo más Crítico"
            value={datosInventario.insumoMasCritico.nombre}
            subtitle={`Diferencia: ${formatearNumero(datosInventario.insumoMasCritico.diferencia)} ${normalizarUnidad(datosInventario.insumoMasCritico.unidad)}`}
            color="danger"
          />
        )}

        {datosInventario && (
          <KPICard
            icon="fas fa-boxes"
            title="Insumos en Riesgo"
            value={datosInventario.criticos}
            subtitle={`de ${datosInventario.total} insumos totales`}
            color="warning"
          />
        )}

        {datosAsistencias && datosAsistencias.totalRegistros > 0 && (
          <KPICard
            icon="fas fa-user-check"
            title="Tasa de Asistencia"
            value={`${datosAsistencias.porcentajeAsistencia}%`}
            subtitle={`${datosAsistencias.totalPresentes} presentes / ${datosAsistencias.totalAusentes} ausentes`}
            color="info"
          />
        )}

        {datosAsistencias && datosAsistencias.totalRegistros > 0 && (
          <KPICard
            icon="fas fa-percent"
            title="Eficiencia de Receta"
            value={`${datosAsistencias.porcentajeAsistencia}%`}
            subtitle="Cumplimiento del plan (basado en asistencia)"
            color="primary"
          />
        )}
      </div>

      <div ref={graficoRef} className="graficos-container">
        <div className="row mb-4">
          {/* Consumo por Día */}
          {datosConsumos && (
            <div className="col-lg-6">
              <GraficoConLeyenda
                titulo="Volumen de Consumo Diario"
                leyenda="Detecta qué días tienen mayor rotación de insumos
                para optimizar la compra y preparación"
                icon="fas fa-chart-line"
              >
                <Line
                  data={{
                    labels: Object.keys(datosConsumos.porDia),
                    datasets: [
                      {
                        label: "Consumo (Kg)",
                        data: Object.values(datosConsumos.porDia),
                        borderColor: "#0d6efd",
                        backgroundColor: "rgba(13, 110, 253, 0.1)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
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
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const valor = context.parsed.y;
                            return `Consumo: ${formatearNumero(valor)} Kg`;
                          },
                        },
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: 12,
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Kilogramos",
                        },
                      },
                    },
                  }}
                />
              </GraficoConLeyenda>
            </div>
          )}

          {/* Asistencias */}
          {datosAsistencias && datosAsistencias.totalRegistros > 0 ? (
            <div className="col-lg-6">
              <GraficoConLeyenda
                titulo="Tasa de Asistencia"
                leyenda="Proporción de estudiantes presentes vs ausentes, importante para cuantificar porciones"
                icon="fas fa-percent"
              >
                <Doughnut
                  data={{
                    labels: ["Presentes", "No Asisten al Servicio", "Ausentes"],
                    datasets: [
                      {
                        data: [
                          datosAsistencias.totalPresentes || 0,
                          datosAsistencias.totalNoAsisten || 0,
                          datosAsistencias.totalAusentes || 0,
                        ],
                        backgroundColor: ["#198754", "#e6de00", "#dc3545"],
                        borderColor: "#fff",
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
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const valor = context.parsed;
                            const total =
                              datosAsistencias.totalPresentes +
                              datosAsistencias.totalAusentes +
                              datosAsistencias.totalNoAsisten;
                            const porcentaje =
                              total > 0
                                ? ((valor / total) * 100).toFixed(1)
                                : 0;
                            return `${context.label}: ${formatearNumero(valor)} (${porcentaje}%)`;
                          },
                        },
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: 12,
                      },
                    },
                  }}
                />
              </GraficoConLeyenda>
            </div>
          ) : (
            <div className="col-lg-6">
              <GraficoConLeyenda
                titulo="Tasa de Asistencia"
                leyenda="Datos de asistencia no disponibles para el período seleccionado"
                icon="fas fa-percent"
              >
                <div className="text-center py-5">
                  <i className="fas fa-info-circle fa-2x text-muted mb-3"></i>
                  <p className="text-muted">
                    No hay datos de asistencia disponibles
                  </p>
                </div>
              </GraficoConLeyenda>
            </div>
          )}
        </div>

        <div className="row mb-4">
          {/* Consumo por Servicio */}
          {datosConsumos && (
            <div className="col-lg-6">
              <GraficoConLeyenda
                titulo="Consumo por Tipo de Menú"
                leyenda="Identifica qué servicios (Desayuno, Almuerzo, etc.) consumen más insumos, separado por unidad de medida con colores específicos"
                icon="fas fa-bars"
              >
                {(() => {
                  // Preparar datos para gráfico con unidades
                  const servicios = Object.keys(datosConsumos.porServicio);
                  const unidadesSet = new Set();
                  
                  servicios.forEach(servicio => {
                    Object.keys(datosConsumos.porServicio[servicio]).forEach(u => unidadesSet.add(u));
                  });
                  
                  const unidades = Array.from(unidadesSet).sort();
                  const datasets = unidades.map(unidad => ({
                    label: unidad,
                    data: servicios.map(servicio => datosConsumos.porServicio[servicio][unidad] || 0),
                    backgroundColor: obtenerColorUnidad(unidad),
                  }));

                  return (
                    <Bar
                      data={{
                        labels: servicios,
                        datasets: datasets,
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            display: true,
                            position: "top",
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const valor = context.parsed.y;
                                const unidad = context.dataset.label;
                                return `${unidad}: ${formatearNumero(valor)}`;
                              },
                            },
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 12,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            stacked: false,
                            title: {
                              display: true,
                              text: "Cantidad",
                            },
                          },
                          x: {
                            stacked: false,
                          },
                        },
                      }}
                    />
                  );
                })()}
              </GraficoConLeyenda>
            </div>
          )}

          {/* Inventario por Categoría */}
          {datosInventario && (
            <div className="col-lg-6">
              <GraficoConLeyenda
                titulo="Distribución de Insumos por Categoría (Inventario)"
                leyenda={`${datosInventario.criticos} insumos en riesgo de quiebre de stock`}
                icon="fas fa-pie-chart"
              >
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
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const valor = context.parsed;
                            const total = Object.values(
                              datosInventario.porCategoria,
                            ).reduce((a, b) => a + b, 0);
                            const porcentaje =
                              total > 0
                                ? ((valor / total) * 100).toFixed(1)
                                : 0;
                            return `${context.label}: ${valor} (${porcentaje}%)`;
                          },
                        },
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: 12,
                      },
                    },
                  }}
                />
              </GraficoConLeyenda>
            </div>
          )}
        </div>

        {/* Top N Insumos */}
        {datosConsumos && datosConsumos.topInsumos.length > 0 && (
          <div className="row">
            <div className="col-12">
              <GraficoConLeyenda
                titulo={`Top ${cantidadTop} Insumos Más Consumidos`}
                leyenda="Estos son los insumos con mayor rotación; mantén su stock en niveles óptimos para evitar conflictos. Los colores indican la unidad de medida"
                icon="fas fa-star"
              >
                <div>
                  <Bar
                    data={{
                      labels: datosConsumos.topInsumos.map((item) => item.nombre),
                      datasets: [
                        {
                          label: "Cantidad Consumida",
                          data: datosConsumos.topInsumos.map((item) => item.cantidad),
                          backgroundColor: datosConsumos.topInsumos.map((item) => obtenerColorUnidad(item.unidad)),
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
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const valor = context.parsed.x;
                              const insumo = datosConsumos.topInsumos[context.dataIndex];
                              return `Consumo: ${formatearNumero(valor)} ${insumo.unidad}`;
                            },
                          },
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          padding: 12,
                        },
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: "Cantidad",
                          },
                        },
                      },
                    }}
                  />
                  
                  {/* Leyenda de colores */}
                  <div className="mt-3 p-3 bg-light rounded" style={{ fontSize: "13px" }}>
                    <strong className="d-block mb-2">Leyenda de Unidades de Medida:</strong>
                    <div className="d-flex gap-3 flex-wrap">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "20px", height: "20px", backgroundColor: "#0d6efd", borderRadius: "3px" }}></span>
                        <span>Kilogramos (Kg)</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "20px", height: "20px", backgroundColor: "#198754", borderRadius: "3px" }}></span>
                        <span>Litros (L)</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "20px", height: "20px", backgroundColor: "#fd7e14", borderRadius: "3px" }}></span>
                        <span>Gramos (g)</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ width: "20px", height: "20px", backgroundColor: "#dc3545", borderRadius: "3px" }}></span>
                        <span>Mililitros (ml)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GraficoConLeyenda>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Estadistica;
