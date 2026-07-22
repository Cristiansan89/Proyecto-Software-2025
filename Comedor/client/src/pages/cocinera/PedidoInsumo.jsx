import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import PedidoFormSimple from "../../components/cocinera/PedidoFormSimple";
import PedidoAutomaticoForm from "../../components/cocinera/PedidoAutomaticoForm";
import pedidoService from "../../services/pedidoService";
import estadoPedidoService from "../../services/estadoPedidoService";
import insumoService from "../../services/insumoService";
import auditoriaService from "../../services/auditoriaService";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  showSuccess,
  showError,
  showInfo,
  showConfirm,
  showCancelar,
} from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const PedidoInsumo = ({ onModoEdicion }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [vistaActual, setVistaActual] = useState("lista"); // 'lista', 'crear', 'automatico'
  const [pedidos, setPedidos] = useState([]);
  const [estadosPedido, setEstadosPedido] = useState([]);
  const [insumosBajoStock, setInsumosBajoStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: "",
    fechaInicio: "",
    fechaFin: "",
    proveedor: "",
    usuario: "",
    origen: "",
  });
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [proveedoresUnicos, setProveedoresUnicos] = useState([]);
  const [usuariosUnicos, setUsuariosUnicos] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [mostrarDetallesPedido, setMostrarDetallesPedido] = useState(null);
  const [mostrarAutomatico, setMostrarAutomatico] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Función auxiliar para parsear fechas de manera consistente
  const parsearFecha = (fechaString) => {
    if (!fechaString) return null;

    try {
      let fecha;

      // Si ya tiene formato de fecha completa (con hora)
      if (fechaString.includes("T") || fechaString.includes(":")) {
        fecha = new Date(fechaString);
      } else {
        // Si es solo fecha (YYYY-MM-DD), parsear directamente sin conversión UTC
        const [año, mes, día] = fechaString.split("-").map(Number);
        // Crear fecha local directamente
        fecha = new Date(año, mes - 1, día);
      }

      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        return null;
      }

      return fecha;
    } catch (error) {
      return null;
    }
  };

  // Función para formatear fechas evitando problemas de zona horaria
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";

    try {
      const fecha = parsearFecha(fechaString);
      if (!fecha) {
        console.error("Fecha inválida:", fechaString);
        return "-";
      }

      return fecha.toLocaleDateString("es-ES");
    } catch (error) {
      console.error("Error al formatear fecha:", fechaString, error);
      return "-";
    }
  };

  // Función para formatear fechas con hora
  const formatearFechaConHora = (fechaString) => {
    if (!fechaString) return "-";

    try {
      let fecha;

      // Si ya tiene formato de fecha completa (con hora)
      if (fechaString.includes("T") || fechaString.includes(":")) {
        fecha = new Date(fechaString);
      } else {
        // Si es solo fecha (YYYY-MM-DD), crear fecha local
        const [año, mes, día] = fechaString.split("-").map(Number);
        fecha = new Date(año, mes - 1, día);
      }

      if (isNaN(fecha.getTime())) {
        return "-";
      }

      const fechaFormato = fecha.toLocaleDateString("es-ES");
      const horaFormato = fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${fechaFormato} ${horaFormato}`;
    } catch (error) {
      console.error("Error al formatear fecha con hora:", fechaString, error);
      return "-";
    }
  };

  // Función para calcular fecha de entrega desde fecha de aprobación
  const calcularFechaEntrega = (fechaAprobacion) => {
    if (!fechaAprobacion) return null;

    try {
      const fecha = parsearFecha(fechaAprobacion);
      if (!fecha) {
        console.error("Fecha de aprobación inválida:", fechaAprobacion);
        return null;
      }

      // Agregar 1 día a la fecha de aprobación
      fecha.setDate(fecha.getDate() + 1);

      // Si cae en sábado (6), mover al lunes
      if (fecha.getDay() === 6) {
        fecha.setDate(fecha.getDate() + 2);
      }
      // Si cae en domingo (0), mover al lunes
      else if (fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }

      return fecha;
    } catch (error) {
      console.error(
        "Error al calcular fecha de entrega:",
        fechaAprobacion,
        error,
      );
      return null;
    }
  };

  // Función para verificar si hay filtros aplicados
  const hayFiltrosAplicados = () => {
    return (
      filtros.estado ||
      filtros.proveedor ||
      filtros.usuario ||
      filtros.origen ||
      filtros.fechaInicio ||
      filtros.fechaFin
    );
  };

  useEffect(() => {
    // Solo cargar datos si el usuario está autenticado y la verificación de autenticación está completa
    if (!authLoading && isAuthenticated) {
      cargarDatos();
      cargarInsumosBajoStock();
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    aplicarFiltros();
  }, [pedidos, filtros]);

  useEffect(() => {
    // Bloquear scroll del body cuando se abre el modal de detalles
    if (mostrarDetallesPedido) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mostrarDetallesPedido]);

  // Notificar al componente padre cuando entra/sale del modo edición o creación
  useEffect(() => {
    if (onModoEdicion) {
      onModoEdicion(vistaActual === "lista");
    }
  }, [vistaActual, onModoEdicion]);

  const aplicarFiltros = () => {
    let pedidosTemp = [...pedidos];

    // Filtrar por estado
    if (filtros.estado) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => pedido.id_estadoPedido.toString() === filtros.estado,
      );
    }

    // Filtrar por proveedor
    if (filtros.proveedor) {
      pedidosTemp = pedidosTemp.filter((pedido) =>
        pedido.nombreProveedor
          .toLowerCase()
          .includes(filtros.proveedor.toLowerCase()),
      );
    }

    // Filtrar por usuario
    if (filtros.usuario) {
      pedidosTemp = pedidosTemp.filter((pedido) =>
        pedido.nombreUsuario
          .toLowerCase()
          .includes(filtros.usuario.toLowerCase()),
      );
    }

    // Filtrar por origen
    if (filtros.origen) {
      pedidosTemp = pedidosTemp.filter(
        (pedido) => pedido.origen === filtros.origen,
      );
    }

    // Filtrar por fechas
    if (filtros.fechaInicio) {
      pedidosTemp = pedidosTemp.filter((pedido) => {
        const fechaPedido = parsearFecha(pedido.fechaEmision);
        const fechaFiltro = parsearFecha(filtros.fechaInicio);
        return fechaPedido && fechaFiltro && fechaPedido >= fechaFiltro;
      });
    }

    if (filtros.fechaFin) {
      pedidosTemp = pedidosTemp.filter((pedido) => {
        const fechaPedido = parsearFecha(pedido.fechaEmision);
        const fechaFiltro = parsearFecha(filtros.fechaFin);
        return fechaPedido && fechaFiltro && fechaPedido <= fechaFiltro;
      });
    }

    setPedidosFiltrados(pedidosTemp);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidosData, estadosData] = await Promise.all([
        pedidoService.getAll(),
        estadoPedidoService.getAll(),
      ]);

      setPedidos(pedidosData);
      setEstadosPedido(estadosData);

      // Extraer proveedores y usuarios únicos para los filtros
      const proveedores = [
        ...new Set(pedidosData.map((p) => p.nombreProveedor).filter(Boolean)),
      ].sort();
      const usuarios = [
        ...new Set(pedidosData.map((p) => p.nombreUsuario).filter(Boolean)),
      ].sort();

      setProveedoresUnicos(proveedores);
      setUsuariosUnicos(usuarios);
    } catch (error) {
      //console.error("Error al cargar datos:", error);
      showError("Error", "Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const cargarPedidos = async () => {
    try {
      const data = await pedidoService.getAll();
      setPedidos(data);

      // Actualizar listas únicas - filtrar valores vacíos/nulos
      const proveedores = [
        ...new Set(data.map((p) => p.nombreProveedor).filter(Boolean)),
      ].sort();
      const usuarios = [
        ...new Set(data.map((p) => p.nombreUsuario).filter(Boolean)),
      ].sort();

      setProveedoresUnicos(proveedores);
      setUsuariosUnicos(usuarios);
    } catch (error) {
      //console.error("Error al cargar pedidos:", error);
      showError("Error", "Error al cargar pedidos: " + error.message);
    }
  };

  const cargarInsumosBajoStock = async () => {
    try {
      const data = await insumoService.getBajoStock();
      setInsumosBajoStock(data);
    } catch (error) {
      //console.error("Error al cargar insumos bajo stock:", error);
      showError(
        "Error",
        "Error al cargar insumos bajo stock: " + error.message,
      );
    }
  };

  const cancelarPedido = async (id) => {
    // 1. Solicitar el motivo de cancelación
    const motivo = await showCancelar(
      "Cancelar Pedido",
      "Escriba el motivo aquí...",
    );

    // 2. Si el usuario proporcionó un motivo
    if (motivo) {
      try {
        // 3. Llamada al servicio con el motivo
        await pedidoService.cancelar(id, motivo);

        showSuccess("Éxito", "El pedido ha sido cancelado correctamente.");

        // 4. Recarga de la lista
        await cargarPedidos();
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "No se pudo cancelar el pedido.";
        showError("Error", errorMessage);
      }
    }
  };

  // Funciones para generación automática
  const abrirGeneracionAutomatica = () => {
    setMostrarAutomatico(true);
  };

  const cerrarGeneracionAutomatica = () => {
    setMostrarAutomatico(false);
  };

  const onGeneracionAutomaticaExitosa = (resultado) => {
    // console.log("✅ Generación automática exitosa:", resultado);

    // Mostrar mensaje de éxito
    showInfo(
      "Información",
      `¡Éxito! ${resultado.message}\n\nTotal pedidos creados: ${resultado.totalPedidosCreados}`,
    );

    // Recargar datos
    cargarPedidos();

    // No cerrar el modal inmediatamente para que el usuario vea los resultados
  };

  const onGeneracionAutomaticaError = (error) => {
    //console.error("❌ Error en generación automática:", error);
    showInfoError("Información", `Error: ${error}`);
  };

  const verDetallesPedido = async (pedido) => {
    try {
      setLoading(true);
      const pedidoCompleto = await pedidoService.getPedidoCompleto(
        pedido.id_pedido,
      );
      setMostrarDetallesPedido(pedidoCompleto);
    } catch (error) {
      //console.error("Error al cargar detalles del pedido:", error);
      showError("Error", "Error al cargar detalles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarPedido = async (id) => {
    // 1. Confirmación asíncrona personalizada
    const confirmed = await showConfirm(
      "Eliminar Pedido",
      "¿Está seguro de que desea eliminar este pedido? Esta acción podría revertir movimientos de inventario pendientes.",
      "Sí, eliminar",
      "Cancelar",
    );

    if (!confirmed) return;

    try {
      // 2. Ejecución del servicio
      await pedidoService.delete(id);

      // 3. Notificación de éxito y actualización de la lista
      showSuccess("Éxito", "Pedido eliminado correctamente.");

      // Es recomendable usar await si cargarPedidos es asíncrono para asegurar orden
      await cargarPedidos();
    } catch (error) {
      // 4. Manejo de errores profesional
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error desconocido al eliminar el pedido.";

      // Usamos showError para fallos técnicos o showInfo si es una regla de negocio
      showError("Error al eliminar", errorMessage);
    }
  };

  const onSuccessForm = (pedidosCreados) => {
    cargarPedidos();
    setVistaActual("lista");
    setPedidoEditando(null);
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case "Aprobado":
        return "bg-success text-white fw-bold";
      case "Enviado":
        return "bg-info text-black fw-bold";
      case "Recibido":
        return "bg-primary text-white fw-bold";
      case "Cancelado":
        return "bg-danger text-white fw-bold";
      default:
        return "bg-secondary text-white fw-bold";
    }
  };

  const exportarPDFPedidos = async () => {
    //console.log("Botón PDF clickeado, pedidos:", pedidos); // Debug
    // Filtrar solo pedidos aprobados
    const pedidosAprobados = pedidos.filter(
      (p) => p.estadoPedido === "Aprobado",
    );

    if (pedidosAprobados.length === 0) {
      showInfo("Información", "No hay pedidos aprobados para exportar");
      return;
    }

    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text("Reporte de Pedidos Aprobados", 14, 22);

      // Información
      doc.setFontSize(11);
      const nombreUsuario = user
        ? `${user.nombre} ${user.apellido}`
        : "Sistema";
      doc.text(`Generado por: ${nombreUsuario}`, 14, 32);
      doc.text(
        `Fecha de generación: ${new Date().toLocaleString("es-ES")}`,
        14,
        40,
      );
      doc.text(
        `Total de pedidos aprobados: ${pedidosAprobados.length}`,
        14,
        48,
      );

      // Preparar datos para tabla
      const tableData = pedidosAprobados.map((pedido) => [
        formatearFecha(pedido.fechaEmision),
        pedido.nombreProveedor,
        pedido.nombreUsuario,
        pedido.estadoPedido,
        formatearFecha(pedido.fechaAprobacion),
      ]);

      // Tabla
      autoTable({
        doc,
        startY: 60,
        head: [
          [
            "Fecha Emisión",
            "Proveedor",
            "Usuario",
            "Estado",
            "Fecha Aprobación",
          ],
        ],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
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
          doc.internal.pageSize.height - 10,
        );
      }

      doc.save(`pedidos_aprobados_${new Date().getTime()}.pdf`);

      // Registrar la generación del PDF en auditoría
      await auditoriaService.registrarReportePDF({
        nombreReporte: "Reporte de Pedidos Aprobados",
        tipoReporte: "Pedidos",
        descripcion: "Reporte de pedidos aprobados para proveedores",
        detallesReporte: `Total de pedidos aprobados: ${pedidosAprobados.length}`,
      });

      showSuccess(
        "Éxito",
        "Reporte PDF de pedidos aprobados generado exitosamente",
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showError("Error", "Error al generar el reporte PDF");
    }
  };

  // Cálculo de paginación
  const filteredInsumos = pedidosFiltrados;
  const totalPages = Math.ceil(filteredInsumos.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pedidosAMostrar = filteredInsumos.slice(startIndex, endIndex);

  // Vista de creación/edición de pedido
  if (vistaActual === "crear") {
    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.pageHeader}>
          <div className={ContenidoStyle.headerLeft}>
            <h2 className={ContenidoStyle.pageTitle}>
              {pedidoEditando ? "Editar Pedido" : "Crear Nuevo Pedido"}
            </h2>
            <p className={ContenidoStyle.pageSubtitle}>
              {pedidoEditando
                ? "Actualiza el pedido con los nuevos datos"
                : "Complete el formulario para crear un pedido manual"}
            </p>
          </div>
          <div className={ContenidoStyle.headerActions}>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setVistaActual("lista");
                setPedidoEditando(null);
              }}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver a la Lista
            </button>
          </div>
        </div>

        <PedidoFormSimple
          onClose={() => {
            setVistaActual("lista");
            setPedidoEditando(null);
          }}
          onSuccess={onSuccessForm}
          pedidoEditando={pedidoEditando}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Pedido de Insumos...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h2 className={ContenidoStyle.pageTitle}>Lista de Pedidos</h2>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <div className="d-flex gap-2">
            <button
              className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
              onClick={() => {
                setPedidoEditando(null);
                setVistaActual("crear");
              }}
            >
              <i className="fas fa-plus me-1"></i>
              Nuevo Pedido Manual
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {insumosBajoStock.length > 0 && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertWarning} mb-4`}
        >
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
            <div>
              <h5 className="alert-heading mb-1">
                ¡Atención! Insumos con Stock Bajo
              </h5>
              <p className="mb-1">
                Hay {insumosBajoStock.length} insumo(s) con stock crítico o
                agotado.
              </p>
              <small>
                <strong>Insumos afectados:</strong>{" "}
                {insumosBajoStock
                  .slice(0, 3)
                  .map((i) => i.nombreInsumo)
                  .join(", ")}
                {insumosBajoStock.length > 3 &&
                  ` y ${insumosBajoStock.length - 3} más...`}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.filterActionsCook}>
            <label className={`${ComponenteStyle.formLabel} mb-0`}>
              Estado:
            </label>
            <select
              className={ComponenteStyle.formSelect}
              value={filtros.estado}
              onChange={(e) =>
                setFiltros({ ...filtros, estado: e.target.value })
              }
            >
              <option value="">Todos</option>
              {estadosPedido.map((estado, index) => (
                <option
                  key={estado.id_estadoPedido || `estado-${index}`}
                  value={estado.id_estadoPedido}
                >
                  {estado.nombreEstado}
                </option>
              ))}
            </select>
          </div>
          <div className={ContenidoStyle.filterActionsCook}>
            <label className={`${ComponenteStyle.formLabel} mb-0`}>
              Proveedor:
            </label>
            <select
              className={ComponenteStyle.formSelect}
              value={filtros.proveedor}
              onChange={(e) =>
                setFiltros({ ...filtros, proveedor: e.target.value })
              }
            >
              <option value="">Todos</option>
              {proveedoresUnicos.map((proveedor, index) => (
                <option key={`proveedor-${index}`} value={proveedor}>
                  {proveedor}
                </option>
              ))}
            </select>
          </div>
          <div className={ContenidoStyle.filterActionsCook}>
            <label className={`${ComponenteStyle.formLabel} mb-0`}>
              Usuario:
            </label>
            <select
              className={ComponenteStyle.formSelect}
              value={filtros.usuario}
              onChange={(e) =>
                setFiltros({ ...filtros, usuario: e.target.value })
              }
            >
              <option value="">Todos</option>
              {usuariosUnicos.map((usuario, index) => (
                <option key={`usuario-${index}`} value={usuario}>
                  {usuario}
                </option>
              ))}
            </select>
          </div>
          <div className={ContenidoStyle.filterActionsCook}>
            <label className={`${ComponenteStyle.formLabel} mb-0`}>
              Origen:
            </label>
            <select
              className={ComponenteStyle.formSelect}
              value={filtros.origen}
              onChange={(e) =>
                setFiltros({ ...filtros, origen: e.target.value })
              }
            >
              <option value="">Todos</option>
              <option value="Manual">Manual</option>
              <option value="Generado">Automático</option>
            </select>
          </div>
          <div className={ContenidoStyle.filterActionsCook}>
            <label className={`${ComponenteStyle.formLabel} mb-0`}>
              Desde:
            </label>
            <input
              type="date"
              className={ComponenteStyle.formControl}
              value={filtros.fechaInicio}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaInicio: e.target.value })
              }
            />
          </div>
          <div className={ContenidoStyle.filterActionsCook}>
            <label className={`${ComponenteStyle.formLabel} mb-0`}>
              Hasta:
            </label>
            <input
              type="date"
              className={ComponenteStyle.formControl}
              value={filtros.fechaFin}
              onChange={(e) =>
                setFiltros({ ...filtros, fechaFin: e.target.value })
              }
            />
          </div>

          <div className={ContenidoStyle.filterActionsCook}>
            <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
              {" "}
              <div className="mt-2">
                <button
                  className="btn btn-danger"
                  onClick={exportarPDFPedidos}
                  disabled={
                    pedidos.filter((p) => p.estadoPedido === "Aprobado")
                      .length === 0
                  }
                  title="Exportar solo pedidos aprobados"
                >
                  <i className="fas fa-file-pdf me-1"></i>
                  Exportar PDF
                </button>
              </div>
              {hayFiltrosAplicados() && (
                <div className="mt-2">
                  <button
                    className={ContenidoStyle.btnOutlineSecondary}
                    onClick={() =>
                      setFiltros({
                        estado: "",
                        fechaInicio: "",
                        fechaFin: "",
                        proveedor: "",
                        usuario: "",
                        origen: "",
                      })
                    }
                  >
                    <i className="fas fa-times me-1"></i>
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className={ContenidoStyle.card}>
        <div
          className={`${ContenidoStyle.cardHeader} ${ContenidoStyle.headerInventario} pb-0 pt-2`}
        >
          <h5>
            <i className="fas fa-list me-2"></i>
            Lista de Pedidos ({pedidosFiltrados.length})
          </h5>
          <div className={ContenidoStyle.headerRight}>
            <label className="mx-2">
              <span>Registros por página:</span>
            </label>
            <select
              className={ComponenteStyle.formSelect}
              style={{ width: "60px" }}
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

        {/* Tabla de la lista de Pedido */}
        <div className={TablaStyle.tableContainer}>
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h5>No se encontraron pedidos</h5>
              <p className="text-muted">
                {pedidos.length === 0
                  ? "No hay pedidos registrados. Cree el primer pedido haciendo clic en 'Nuevo Pedido Manual'"
                  : "No hay pedidos que coincidan con los filtros aplicados. Intente modificar los criterios de búsqueda."}
              </p>
            </div>
          ) : (
            <div className={TablaStyle.scrollableTable}>
              <div className={TablaStyle.tableBodyScroll}>
                <table
                  className={`${TablaStyle.tableData} table table-striped`}
                >
                  <thead className={TablaStyle.tableHeaderFixed}>
                    <tr>
                      <th>#</th>
                      <th>Fecha Emisión</th>
                      <th>Proveedor</th>
                      <th>Usuario</th>
                      <th>Origen</th>
                      <th>Estado</th>
                      <th>Fecha Aprobación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosAMostrar.map((pedido, index) => (
                      <tr key={pedido.id_pedido || `pedido-${index}`}>
                        <td>
                          <strong>{startIndex + index + 1}</strong>
                        </td>
                        <td>{formatearFechaConHora(pedido.fechaEmision)}</td>
                        <td>
                          <strong>{pedido.nombreProveedor}</strong>
                        </td>
                        <td>{pedido.nombreUsuario}</td>
                        <td>
                          <span
                            className={`${ComponenteStyle.badge} ${
                              pedido.origen === "Manual"
                                ? "bg-warning text-black"
                                : "bg-success text-white"
                            }  fw-bold`}
                            title={
                              pedido.origen === "Generado"
                                ? "Pedido generado automáticamente por el sistema"
                                : "Pedido creado manualmente"
                            }
                          >
                            {pedido.origen === "Generado"
                              ? "🤖 Automático"
                              : "👤 Manual"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${ComponenteStyle.badge} ${getEstadoBadgeClass(
                              pedido.estadoPedido,
                            )}`}
                          >
                            {pedido.estadoPedido}
                          </span>
                        </td>
                        <td>
                          {pedido.fechaAprobacion ? (
                            <div className="d-flex flex-column">
                              <small className="text-muted">
                                (Aprobado:{" "}
                                {formatearFechaConHora(pedido.fechaAprobacion)})
                              </small>
                              <span className="text-success">
                                Entrega:{" "}
                                {calcularFechaEntrega(
                                  pedido.fechaAprobacion,
                                )?.toLocaleDateString("es-ES") || "-"}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <div className={TablaStyle.actionButtons}>
                            <button
                              className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                              onClick={() => verDetallesPedido(pedido)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>

                            {pedido.estadoPedido === "Pendiente" && (
                              <>
                                <button
                                  className={`${TablaStyle.btnAction} ${TablaStyle.btnWarning}`}
                                  onClick={async () => {
                                    try {
                                      setLoading(true);
                                      const pedidoCompleto =
                                        await pedidoService.getPedidoCompleto(
                                          pedido.id_pedido,
                                        );
                                      setPedidoEditando(pedidoCompleto);
                                      setVistaActual("crear");
                                    } catch (error) {
                                      showError(
                                        "Error",
                                        "Error al cargar el pedido: " +
                                          error.message,
                                      );
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  title="Editar pedido"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>

                                <button
                                  className={`${TablaStyle.btnAction} ${TablaStyle.btnDisable}`}
                                  onClick={() =>
                                    cancelarPedido(pedido.id_pedido)
                                  }
                                  title="Cancelar pedido"
                                >
                                  <i className="fas fa-ban"></i>
                                </button>

                                <button
                                  className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                                  onClick={() =>
                                    eliminarPedido(pedido.id_pedido)
                                  }
                                  title="Eliminar pedido"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className={TablaStyle.pagination}>
                  <button
                    className={TablaStyle.paginationBtn}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
          )}
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {mostrarDetallesPedido &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-info-circle me-2"></i>
                    Detalles del Pedido
                  </h5>
                  <button
                    type="button"
                    className={FormularioStyle.modalClose}
                    onClick={() => setMostrarDetallesPedido(null)}
                  ></button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Proveedor:</strong>{" "}
                      {mostrarDetallesPedido.nombreProveedor}
                    </div>
                    <div className="col-md-6">
                      <strong>Fecha de Emisión:</strong>{" "}
                      {formatearFecha(mostrarDetallesPedido.fechaEmision)}
                    </div>
                    <div className="col-md-6">
                      <strong>Usuario:</strong>{" "}
                      {mostrarDetallesPedido.nombreUsuario}
                    </div>
                    <div className="col-md-6">
                      <strong>Estado:</strong>
                      <span
                        className={`${ComponenteStyle.badge} ms-2 ${getEstadoBadgeClass(
                          mostrarDetallesPedido.estadoPedido,
                        )}`}
                      >
                        {mostrarDetallesPedido.estadoPedido}
                      </span>
                    </div>
                  </div>

                  {mostrarDetallesPedido.observaciones && (
                    <div className="mb-3">
                      <strong>Observaciones:</strong>
                      <p className="mt-1">
                        {mostrarDetallesPedido.observaciones}
                      </p>
                    </div>
                  )}
                  <div className={ContenidoStyle.card}>
                    <div
                      className={`${ContenidoStyle.cardHeader} ${ContenidoStyle.headerInventario} pb-0 pt-2`}
                    >
                      <h6>
                        <i className="fas fa-list me-2"></i>Insumos del Pedido
                      </h6>
                    </div>
                    {mostrarDetallesPedido.detalles &&
                    mostrarDetallesPedido.detalles.length > 0 ? (
                      <div className={TablaStyle.tableContainer}>
                        <div className={TablaStyle.scrollableTable}>
                          <div className={TablaStyle.tableBodyScroll}>
                            <table
                              className={`${TablaStyle.tableData} table table-striped`}
                            >
                              <thead className={TablaStyle.tableHeaderFixed}>
                                <tr>
                                  <th>Insumo</th>
                                  <th>Unidad</th>
                                  <th>Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mostrarDetallesPedido.detalles.map(
                                  (detalle, index) => (
                                    <tr
                                      key={
                                        detalle.id_detallePedido ||
                                        `detalle-${index}`
                                      }
                                    >
                                      <td>{detalle.nombreInsumo}</td>
                                      <td>{detalle.unidadMedida}</td>
                                      <td>
                                        {(() => {
                                          const cantidad = Number(
                                            detalle.cantidad ||
                                              detalle.cantidadSolicitada,
                                          );
                                          return (
                                            Math.round(cantidad * 100) / 100
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted">
                        No hay detalles disponibles para este pedido.
                      </p>
                    )}
                  </div>
                </div>
                <div className={`${ComponenteStyle.formActions} m-0 p-0`}>
                  <button
                    type="button"
                    className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel} mb-4 mt-3`}
                    onClick={() => setMostrarDetallesPedido(null)}
                  >
                    <i className="fas fa-close"></i>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Generación Automática */}
      <PedidoAutomaticoForm
        isVisible={mostrarAutomatico}
        onClose={cerrarGeneracionAutomatica}
        onSuccess={onGeneracionAutomaticaExitosa}
        onError={onGeneracionAutomaticaError}
      />
    </div>
  );
};

export default PedidoInsumo;
