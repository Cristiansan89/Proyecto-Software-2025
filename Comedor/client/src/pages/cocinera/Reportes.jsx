import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/AuthContext";
import consumosService from "../../services/consumosService";
import inventarioService from "../../services/inventarioService";
import pedidoService from "../../services/pedidoService";
import planificacionMenuService from "../../services/planificacionMenuService";
import auditoriaService from "../../services/auditoriaService";

import {
  showSuccess,
  showError,
  showInfo,
  showConfirm,
} from "../../utils/alertService";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import { formatNumeroAR } from "../../utils/formatNumero";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const Reportes = () => {
  const { user } = useAuth();

  // Estados principales
  const [tipoReporte, setTipoReporte] = useState("consumos");
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [datos, setDatos] = useState([]);
  const [filtroAplicado, setFiltroAplicado] = useState(false);

  // Filtros comunes
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Filtros específicos - Consumos
  const [servicio, setServicio] = useState("");
  const [insumo, setInsumo] = useState("");
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);

  // Filtros específicos - Inventarios
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  // Filtros específicos - Pedidos
  const [estadoPedido, setEstadoPedido] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [usuarioPedido, setUsuarioPedido] = useState("");
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  // Validar rango de fechas
  const validarFechas = () => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (inicio > fin) {
        showError(
          "Error de fechas",
          "La fecha de inicio no puede ser posterior a la fecha de fin",
        );
        return false;
      }

      // Validar que no sea mayor de 1 año
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        showError(
          "Rango demasiado amplio",
          "El rango de fechas no puede exceder 1 año",
        );
        return false;
      }
    }

    return true;
  };

  // Cargar opciones de filtros al cambiar el tipo de reporte
  useEffect(() => {
    cargarOpcionesFiltros();
  }, [tipoReporte]);

  const cargarOpcionesFiltros = async () => {
    try {
      setLoading(true);

      switch (tipoReporte) {
        case "consumos":
          await cargarServiciosEInsumos();
          break;
        case "inventarios":
          await cargarCategorias();
          break;
        case "pedidos":
          await cargarProveedoresYUsuarios();
          break;
        default:
          break;
      }
    } catch (error) {
      showError("Error", "Error al cargar opciones de filtros");
    } finally {
      setLoading(false);
    }
  };

  const cargarServiciosEInsumos = async () => {
    try {
      // Simular carga de servicios
      setServiciosDisponibles([
        { id: 1, nombre: "Desayuno" },
        { id: 2, nombre: "Almuerzo" },
        { id: 3, nombre: "Merienda" },
      ]);

      // Intentar cargar insumos del servicio
      const resultado = await consumosService.obtenerConsumos().catch(() => ({
        success: false,
        data: [],
      }));
      const insumosData = resultado.data || [];
      if (Array.isArray(insumosData) && insumosData.length > 0) {
        // Deduplicar por id_insumo usando Map
        const insumosMap = new Map();
        insumosData.forEach((c) => {
          if (c.id_insumo != null)
            insumosMap.set(String(c.id_insumo), c.nombreInsumo);
        });
        setInsumosDisponibles(
          [...insumosMap.entries()].map(([id, nombre]) => ({ id, nombre })),
        );
      } else {
        setInsumosDisponibles([]);
      }
    } catch (error) {
      console.error("Error cargando servicios e insumos:", error);
    }
  };

  const cargarCategorias = async () => {
    // Valores del enum `categoria` de la tabla Insumos en la DB
    setCategoriasDisponibles([
      "Carnes",
      "Lacteos",
      "Cereales",
      "Verduras",
      "Frutas",
      "Legumbres",
      "Condimentos",
      "Bebidas",
      "Enlatados",
      "Conservas",
      "Limpieza",
      "Descartables",
      "Otros",
    ]);
  };

  const cargarProveedoresYUsuarios = async () => {
    try {
      const pedidosData = await pedidoService.getAll().catch(() => []);

      if (Array.isArray(pedidosData)) {
        const proveedores = [
          ...new Set(
            pedidosData
              .map((p) => p.nombreProveedor)
              .filter((p) => p && p.trim()),
          ),
        ];
        const usuarios = [
          ...new Set(
            pedidosData
              .map((p) => p.nombreUsuario)
              .filter((u) => u && u.trim()),
          ),
        ];

        setProveedoresDisponibles(proveedores);
        setUsuariosDisponibles(usuarios);
      }
    } catch (error) {
      console.error("Error cargando proveedores y usuarios:", error);
    }
  };

  // Generar reporte
  const generarReporte = async () => {
    try {
      if (!validarFechas()) return;

      setGenerando(true);
      let datosReporte = [];

      switch (tipoReporte) {
        case "consumos":
          datosReporte = await generarReporteConsumos();
          break;
        case "inventarios":
          datosReporte = await generarReporteInventarios();
          break;
        case "pedidos":
          datosReporte = await generarReportePedidos();
          break;
        case "planificacion":
          datosReporte = await generarReportePlanificacion();
          break;
      }

      if (datosReporte.length === 0) {
        showInfo(
          "Sin resultados",
          "No se encontraron resultados con los filtros aplicados",
        );
        setFiltroAplicado(false);
        return;
      }

      setDatos(datosReporte);
      setFiltroAplicado(true);

      // Registrar en auditoría
      await registrarEnAuditoria("GENERAR", "REPORTE", tipoReporte);

      showSuccess(
        "Éxito",
        `Reporte de ${getNombreReporte()} generado con ${datosReporte.length} registros`,
      );
    } catch (error) {
      showError(
        "Error",
        "Error al generar reporte: " + (error.message || "Error desconocido"),
      );
    } finally {
      setGenerando(false);
    }
  };

  const generarReporteConsumos = async () => {
    try {
      const resultado = await consumosService.obtenerConsumos().catch(() => ({
        success: false,
        data: [],
      }));
      let datosConsumo = Array.isArray(resultado.data)
        ? resultado.data
        : resultado.data?.data || [];

      // Aplicar filtros
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59);

        datosConsumo = datosConsumo.filter((c) => {
          const fechaConsumo = new Date(c.fechaConsumo || c.fecha);
          return fechaConsumo >= inicio && fechaConsumo <= fin;
        });
      }

      if (servicio) {
        datosConsumo = datosConsumo.filter(
          (c) => c.servicio === servicio || c.nombreServicio === servicio,
        );
      }

      if (insumo) {
        datosConsumo = datosConsumo.filter(
          (c) => c.nombreInsumo === insumo || c.idInsumo === insumo,
        );
      }

      // Ordenar por fecha ascendente
      datosConsumo.sort((a, b) => {
        const fa = new Date(a.fechaHoraGeneracion || a.fecha || 0);
        const fb = new Date(b.fechaHoraGeneracion || b.fecha || 0);
        return fa - fb;
      });

      return datosConsumo.map((c) => ({
        fecha: formatDate(c.fechaHoraGeneracion || c.fecha),
        servicio: c.nombreServicio || "-",
        insumo: c.nombreInsumo || "-",
        cantidad: formatNumeroAR(c.cantidadUtilizada || 0),
        unidad: c.unidadMedida || "-",
        usuario: c.nombreUsuario || "-",
      }));
    } catch (error) {
      console.error("Error generando reporte consumos:", error);
      return [];
    }
  };

  const generarReporteInventarios = async () => {
    try {
      // inventarioService.obtenerInventarios() devuelve un array directamente
      const resultado = await inventarioService
        .obtenerInventarios()
        .catch(() => []);
      let datosInventario = Array.isArray(resultado) ? resultado : [];

      // No se aplica filtro de fechas para inventario (no tiene campo de fecha relevante)

      if (categoria) {
        datosInventario = datosInventario.filter(
          (i) => i.categoria === categoria || i.nombreCategoria === categoria,
        );
      }

      if (estado) {
        // `i.estado` en la DB puede ser 'Normal','Critico','Agotado'
        datosInventario = datosInventario.filter((i) => i.estado === estado);
      }

      return datosInventario.map((i) => ({
        insumo: i.nombreInsumo || "-",
        categoria: i.categoria || "-",
        cantidad: formatNumeroAR(i.cantidadActual || 0),
        cantidadMinima: formatNumeroAR(i.nivelMinimoAlerta || 0),
        unidad: i.unidadMedida || "-",
        estado:
          i.estado ||
          (i.cantidadActual >= (i.nivelMinimoAlerta || 0)
            ? "Normal"
            : "Bajo Stock"),
        ultimaActualizacion: formatDate(
          i.fechaUltimaActualizacion || new Date(),
        ),
      }));
    } catch (error) {
      console.error("Error generando reporte inventarios:", error);
      return [];
    }
  };

  const generarReportePedidos = async () => {
    try {
      let datosPedidos = await pedidoService.getAll().catch(() => []);

      // Aplicar filtros
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59);

        datosPedidos = datosPedidos.filter((p) => {
          const fechaPedido = new Date(p.fechaEmision);
          return fechaPedido >= inicio && fechaPedido <= fin;
        });
      }

      if (estadoPedido) {
        datosPedidos = datosPedidos.filter(
          (p) => p.estadoPedido === estadoPedido,
        );
      }

      if (proveedor) {
        datosPedidos = datosPedidos.filter(
          (p) =>
            p.nombreProveedor &&
            p.nombreProveedor.toLowerCase().includes(proveedor.toLowerCase()),
        );
      }

      if (usuarioPedido) {
        datosPedidos = datosPedidos.filter(
          (p) =>
            p.nombreUsuario &&
            p.nombreUsuario.toLowerCase().includes(usuarioPedido.toLowerCase()),
        );
      }

      return datosPedidos.map((p) => ({
        id: p.id_pedido || p.idPedido || "-",
        fechaEmision: formatDate(p.fechaEmision),
        proveedor: p.nombreProveedor || "-",
        usuario: p.nombreUsuario || "-",
        estado: p.estadoPedido || "-",
        origen: p.origen || "-",
        fechaAprobacion: p.fechaAprobacion
          ? formatDate(p.fechaAprobacion)
          : "-",
      }));
    } catch (error) {
      console.error("Error generando reporte pedidos:", error);
      return [];
    }
  };

  const generarReportePlanificacion = async () => {
    try {
      let datosPlanificacion = await planificacionMenuService
        .getAll()
        .catch(() => []);

      // Aplicar filtros de fecha: detectar superposición con el rango seleccionado
      // Usamos comparación de strings YYYY-MM-DD para evitar problemas de timezone
      if (fechaInicio && fechaFin) {
        const toDateStr = (val) => {
          if (!val) return null;
          if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val))
            return val;
          const d = val instanceof Date ? val : new Date(val);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().slice(0, 10);
        };

        datosPlanificacion = datosPlanificacion.filter((p) => {
          const pInicioStr = toDateStr(p.fechaInicio);
          const pFinStr = toDateStr(p.fechaFin);
          if (!pInicioStr || !pFinStr) return false;
          // La planificación se superpone si empieza en o antes del fechaFin y termina en o después del fechaInicio
          return pInicioStr <= fechaFin && pFinStr >= fechaInicio;
        });
      }

      return datosPlanificacion.map((p) => ({
        fechaInicio: formatDate(p.fechaInicio),
        fechaFin: formatDate(p.fechaFin),
        comensales: p.comensalesEstimados || 0,
        estado: p.estado || "-",
        usuario: p.nombreUsuario || "-",
      }));
    } catch (error) {
      console.error("Error generando reporte planificación:", error);
      return [];
    }
  };

  const generarReporteAuditoria = async () => {
    return [];
  };

  // Registrar en auditoría
  const registrarEnAuditoria = async (accion, modulo, detalles) => {
    try {
      await auditoriaService
        .registrarReportePDF({
          nombreReporte: `${detalles} - ${accion}`,
          tipoReporte: detalles,
          descripcion: `${accion} de reporte: ${detalles}`,
          detallesReporte: `Período: ${fechaInicio || "Sin fecha"} a ${fechaFin || "Sin fecha"}`,
        })
        .catch(() => {
          // Si falla, no hay problema, continuar
        });
    } catch (error) {
      console.error("Error registrando en auditoría:", error);
    }
  };

  // Exportar a PDF
  const exportarPDF = () => {
    if (datos.length === 0) {
      showError("Error", "No hay datos para exportar");
      return;
    }

    try {
      setGenerando(true);
      const doc = new jsPDF();
      const columnasRaw = Object.keys(datos[0] || {});
      const columnasFormateadas = [
        "#",
        ...columnasRaw.map((col) => formatearNombreColumna(col)),
      ];
      const filas = datos.map((d, idx) => [
        idx + 1,
        ...columnasRaw.map((col) => d[col]),
      ]);

      // Título
      doc.setFontSize(16);
      doc.text(`Reporte de ${getNombreReporte()}`, 14, 22);

      // Información
      doc.setFontSize(10);
      const nombreUsuario = user
        ? `${user.nombre} ${user.apellido}`
        : "Sistema";
      doc.text(`Generado por: ${nombreUsuario}`, 14, 32);
      doc.text(`Fecha de generación: ${formatDateTime(new Date())}`, 14, 40);
      doc.text(`Total de registros: ${datos.length}`, 14, 48);

      if (fechaInicio && fechaFin) {
        doc.text(
          `Período: ${formatDate(fechaInicio)} a ${formatDate(fechaFin)}`,
          14,
          56,
        );
      }

      // Tabla - Usar la nueva API de autoTable
      try {
        autoTable(doc, {
          startY: 65,
          head: [columnasFormateadas],
          body: filas,
          styles: {
            fontSize: 7,
            cellPadding: 1.5,
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [34, 139, 34],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 7,
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        });
      } catch (tableError) {
        console.warn("Error con tabla, usando fallback:", tableError);
        // Fallback: crear tabla simple sin autoTable
        let yPosition = 65;

        // Headers
        doc.setFont(undefined, "bold");
        doc.setFillColor(34, 139, 34);
        doc.setTextColor(255);
        columnasFormateadas.forEach((col, i) => {
          doc.text(col, 14 + i * 30, yPosition);
        });

        // Datos
        doc.setFont(undefined, "normal");
        doc.setTextColor(0);
        yPosition = 75;
        filas.slice(0, 30).forEach((fila) => {
          fila.forEach((valor, i) => {
            doc.text(String(valor).substring(0, 25), 14 + i * 30, yPosition);
          });
          yPosition += 7;
          if (yPosition > 270) yPosition = 20;
        });
      }

      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10,
        );
      }

      // Guardar
      doc.save(`reporte_${tipoReporte}_${new Date().getTime()}.pdf`);

      // Registrar exportación
      registrarEnAuditoria("EXPORTAR", "REPORTE_PDF", tipoReporte);

      showSuccess("Éxito", "Reporte PDF exportado correctamente");
    } catch (error) {
      console.error("Error detallado:", error);
      showError("Error", "Error al exportar PDF: " + error.message);
    } finally {
      setGenerando(false);
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (datos.length === 0) {
      showError("Error", "No hay datos para exportar");
      return;
    }

    try {
      setGenerando(true);

      const columnasRaw = Object.keys(datos[0] || {});
      const datosConNumeracion = datos.map((d, idx) => ({
        "#": idx + 1,
        ...d,
      }));

      // Crear worksheet
      const ws = XLSX.utils.json_to_sheet(datosConNumeracion);

      // Establecer ancho de columnas
      const maxCols = Object.keys(datosConNumeracion[0] || {}).length;
      const columnWidths = Array(maxCols).fill(15);
      ws["!cols"] = columnWidths.map((w) => ({ wch: w }));

      // Crear workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Reporte ${getNombreReporte()}`);

      // Guardar
      XLSX.writeFile(wb, `reporte_${tipoReporte}_${new Date().getTime()}.xlsx`);

      // Registrar exportación
      registrarEnAuditoria("EXPORTAR", "REPORTE_EXCEL", tipoReporte);

      showSuccess("Éxito", "Reporte Excel exportado correctamente");
    } catch (error) {
      showError("Error", "Error al exportar Excel: " + error.message);
    } finally {
      setGenerando(false);
    }
  };

  // Exportar a CSV con punto y coma como delimitador (evita conflicto con coma decimal)
  const exportarCSV = () => {
    if (datos.length === 0) {
      showError("Error", "No hay datos para exportar");
      return;
    }

    try {
      setGenerando(true);
      const columnas = ["#", ...Object.keys(datos[0] || {})];
      const encabezado = columnas.map(formatearNombreColumna).join(";");
      const filas = datos.map((d, idx) =>
        [idx + 1, ...columnas.slice(1).map((col) => d[col])]
          .map((valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`)
          .join(";"),
      );
      // \uFEFF = BOM UTF-8 para que Excel abra correctamente con tildes
      const csv = "\uFEFF" + [encabezado, ...filas].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${tipoReporte}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      registrarEnAuditoria("EXPORTAR", "REPORTE_CSV", tipoReporte);
      showSuccess("Éxito", "Reporte CSV exportado correctamente");
    } catch (error) {
      showError("Error", "Error al exportar CSV: " + error.message);
    } finally {
      setGenerando(false);
    }
  };

  // Utilidades
  const getNombreReporte = () => {
    const nombres = {
      consumos: "Consumos",
      inventarios: "Inventarios",
      pedidos: "Pedidos",
      planificacion: "Planificación de Menús",
    };
    return nombres[tipoReporte] || "Reporte";
  };

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setServicio("");
    setInsumo("");
    setCategoria("");
    setEstado("");
    setEstadoPedido("");
    setProveedor("");
    setUsuarioPedido("");
    setDatos([]);
    setFiltroAplicado(false);
  };

  // Convertir nombres de columnas de camelCase a formato legible
  const formatearNombreColumna = (nombre) => {
    // Convertir camelCase a espacios: fechaInicio -> fecha Inicio
    const conEspacios = nombre.replace(/([A-Z])/g, " $1");
    // Capitalizar primera letra de cada palabra
    return conEspacios
      .split(" ")
      .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(" ")
      .trim();
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Reportes...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-file-alt"></i>
            Reportes
          </h1>
          <p>Genera reportes personalizados de diferentes módulos</p>
        </div>
      </div>

      {/* Selector de tipo de reporte */}
      <div className={ContenidoStyle.navigationTabs}>
        <div className={ContenidoStyle.tabsHeader} role="group">
          {[
            { id: "consumos", label: "Consumos", icon: "fas fa-receipt" },
            {
              id: "inventarios",
              label: "Inventarios",
              icon: "fas fa-boxes",
            },
            { id: "pedidos", label: "Pedidos", icon: "fas fa-shopping-cart" },
            {
              id: "planificacion",
              label: "Planificación",
              icon: "fas fa-calendar-alt",
            },
          ].map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              className={`${ContenidoStyle.tabsButton} ${
                tipoReporte === tipo.id ? ContenidoStyle.active : ""
              }`}
              onClick={() => {
                setTipoReporte(tipo.id);
                setDatos([]);
                setFiltroAplicado(false);
                setFechaInicio("");
                setFechaFin("");
              }}
            >
              <i className={tipo.icon}></i>
              <span>{tipo.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros dinámicos */}
      <div className={ContenidoStyle.card}>
        <div className={ContenidoStyle.cardBody}>
          <div className="row g-3">
            {tipoReporte !== "inventarios" && (
              <>
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Desde:</label>
                  <input
                    type="date"
                    className={ComponenteStyle.formControl}
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Hasta:</label>
                  <input
                    type="date"
                    className={ComponenteStyle.formControl}
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </>
            )}

            {tipoReporte === "consumos" && (
              <>
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Servicio:</label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={servicio}
                    onChange={(e) => setServicio(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {serviciosDisponibles.map((s) => (
                      <option key={`servicio-${s.id}`} value={s.nombre}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Insumo:</label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={insumo}
                    onChange={(e) => setInsumo(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {insumosDisponibles.map((i) => (
                      <option key={`insumo-${i.id}`} value={i.nombre}>
                        {i.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Filtros específicos - Inventarios */}
            {tipoReporte === "inventarios" && (
              <>
                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>
                    Categoría:
                  </label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {categoriasDisponibles.map((c) => (
                      <option key={`cat-${c}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className={ComponenteStyle.formLabel}>Estado:</label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Normal">Normal</option>
                    <option value="Critico">Crítico</option>
                    <option value="Agotado">Agotado</option>
                  </select>
                </div>
              </>
            )}

            {/* Filtros específicos - Pedidos */}
            {tipoReporte === "pedidos" && (
              <>
                <div className="col-md-2">
                  <label className={ComponenteStyle.formLabel}>Estado:</label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={estadoPedido}
                    onChange={(e) => setEstadoPedido(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Recibido">Recibido</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className={ComponenteStyle.formLabel}>
                    Proveedor:
                  </label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {proveedoresDisponibles.map((p, idx) => (
                      <option key={`prov-${idx}-${p}`} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <label className={ComponenteStyle.formLabel}>Usuario:</label>
                  <select
                    className={ComponenteStyle.formSelect}
                    value={usuarioPedido}
                    onChange={(e) => setUsuarioPedido(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {usuariosDisponibles.map((u, idx) => (
                      <option key={`usr-${idx}-${u}`} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Botones de acción */}
          <div className="row mt-4">
            <div className="col-auto">
              <button
                className="btn btn-primary"
                onClick={generarReporte}
                disabled={generando || loading}
              >
                {generando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Generando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt"></i>
                    Generar Reporte
                  </>
                )}
              </button>
            </div>

            {filtroAplicado && (
              <>
                <div className="col-auto">
                  <button
                    className="btn btn-danger"
                    onClick={exportarPDF}
                    disabled={generando}
                  >
                    <i className="fas fa-file-pdf me-2"></i>
                    Exportar PDF
                  </button>
                </div>

                <div className="col-auto">
                  <button
                    className="btn btn-success"
                    onClick={exportarExcel}
                    disabled={generando}
                  >
                    <i className="fas fa-file-excel me-2"></i>
                    Exportar Excel
                  </button>
                </div>

                <div className="col-auto">
                  <button
                    className="btn btn-outline-success"
                    onClick={exportarCSV}
                    disabled={generando}
                  >
                    <i className="fas fa-file-csv me-2"></i>
                    Exportar CSV
                  </button>
                </div>

                <div className="col-auto">
                  <button
                    className={ContenidoStyle.btnOutlineSecondary}
                    onClick={limpiarFiltros}
                    disabled={generando}
                  >
                    <i className="fas fa-times me-2"></i>
                    Limpiar Filtros
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de previsualización */}
      {filtroAplicado && datos.length > 0 && (
        <div className={ContenidoStyle.card}>
          <div className={`${ContenidoStyle.cardHeader} text-dark`}>
            <div className={ContenidoStyle.headerInventario}>
              <h4 className="mb-0">
                <i className="fas fa-table me-1"></i>
                Previsualización de Datos
              </h4>
              <span className={`${ContenidoStyle.badge} bg-info`}>
                {datos.length} Registros
              </span>
            </div>
          </div>

          <div className={TablaStyle.tableResponsive}>
            <table
              className={`${TablaStyle.tableData} table table-striped m-0`}
            >
              <thead className={TablaStyle.tableHeaderFixed}>
                <tr>
                  <th>#</th>
                  {Object.keys(datos[0] || {}).map((col) => (
                    <th key={col}>{formatearNombreColumna(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.slice(0, datos.length).map((fila, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    {Object.values(fila).map((valor, vidx) => (
                      <td key={vidx}>{valor}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
