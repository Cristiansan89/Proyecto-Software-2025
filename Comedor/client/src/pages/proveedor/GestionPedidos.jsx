import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import PedidoListado from "../../components/proveedor/PedidoListado.jsx";
import pedidoService from "../../services/pedidoService.js";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const estadosPedido = ["Confirmado", "Entregado", "Enviado"];

const GestionPedidos = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [filtros, setFiltros] = useState({ numeroPedido: "", estado: "" });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      cargarPedidosProveedor();
    }
  }, [authLoading, user?.idProveedor, user?.id_proveedor]);

  const formatDate = (value) => {
    if (!value) return "N/D";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/D";

    return date.toLocaleDateString("es-ES");
  };

  const normalizarPedido = async (pedido) => {
    const idPedido = pedido.id_pedido || pedido.id;
    let detalles = [];

    try {
      const response = await pedidoService.getDetalles(idPedido);
      detalles = Array.isArray(response) ? response : response?.data || [];
    } catch (error) {
      console.warn("No se pudieron obtener los detalles del pedido", error);
    }

    return {
      id: idPedido,
      numeroPedido: idPedido,
      fechaSolicitud:
        pedido.fechaEmision || pedido.fechaPedido || pedido.fechaAprobacion,
      fechaEntregaSolicitada:
        pedido.fechaEntregaEsperada ||
        pedido.fechaEntregaSolicitada ||
        pedido.fechaEmision,
      estado: pedido.estadoPedido || pedido.estado || "Todos los estados",
      proveedorId: pedido.id_proveedor || pedido.proveedorId,
      detalles: detalles.map((detalle) => ({
        nombreInsumo: detalle.nombreInsumo,
        cantidadSolicitada: detalle.cantidadSolicitada ?? detalle.cantidad ?? 0,
        unidadMedida: detalle.unidadMedida || "-",
        estado:
          detalle.estado ||
          pedido.estadoPedido ||
          pedido.estado ||
          "Todos los estados",
      })),
    };
  };

  const cargarPedidosProveedor = async () => {
    try {
      setLoading(true);

      const proveedorId = user?.idProveedor || user?.id_proveedor;
      if (!proveedorId) {
        setPedidos([]);
        setLoading(false);
        return;
      }

      const response = await pedidoService.getByProveedor(proveedorId);
      const pedidosData = Array.isArray(response)
        ? response
        : response?.pedidos || response?.data || [];

      const pedidosNormalizados = await Promise.all(
        pedidosData.map((pedido) => normalizarPedido(pedido)),
      );

      setPedidos(pedidosNormalizados);
    } catch (error) {
      console.error("Error al cargar pedidos del proveedor", error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      const numeroPedido = String(pedido.numeroPedido || "")
        .toLowerCase()
        .trim();
      const numeroBuscado = filtros.numeroPedido.toLowerCase().trim();
      const estadoPedido = String(pedido.estado || "")
        .toLowerCase()
        .trim();
      const estadoFiltrado = filtros.estado.toLowerCase().trim();

      const coincideNumero =
        !numeroBuscado || numeroPedido.includes(numeroBuscado);
      const coincideEstado = !estadoFiltrado || estadoPedido === estadoFiltrado;

      return coincideNumero && coincideEstado;
    });
  }, [pedidos, filtros]);

  const totalPages = Math.max(1, Math.ceil(pedidosFiltrados.length / pageSize));

  const pedidosPaginados = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return pedidosFiltrados.slice(start, end);
  }, [pedidosFiltrados, currentPage, pageSize]);

  const abrirDetallePedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarDetalles(true);
  };

  const cerrarDetallePedido = () => {
    setMostrarDetalles(false);
    setPedidoSeleccionado(null);
  };

  const getEstadoClass = (estado) => {
    if (estado === "Recibido") {
      return (
        <span
          className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeSuccess}`}
        >
          ✓ Entregado
        </span>
      );
    } else if (estado === "Aprobado") {
      return (
        <span
          className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeWarning}`}
        >
          🗹 Aprobado
        </span>
      );
    } else if (estado === "Cancelado") {
      return (
        <span
          className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeDanger}`}
        >
          ✗ Cancelado
        </span>
      );
    } else if (estado === "Pendiente") {
      return (
        <span className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeInfo}`}>
          ⋯ Pendiente
        </span>
      );
    }
  };

  const hayFiltrosAplicados = () => {
    return Boolean(filtros.numeroPedido || filtros.estado);
  };

  const limpiarFiltros = () => {
    setFiltros({ numeroPedido: "", estado: "" });
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filtros.numeroPedido, filtros.estado, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading || authLoading) {
    return (
      <div className={ContenidoStyle.pageContent}>
        <div className={ContenidoStyle.loadingContainer}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando pedidos del proveedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-shopping-cart me-2"></i>
            Gestión de Pedidos
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Consulta el estado de tus pedidos asignados y revisa su detalle en
            modo lectura.
          </p>
        </div>
      </div>

      <div className={ContenidoStyle.tabContent}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              placeholder="🔍 Buscar por número de pedido"
              value={filtros.numeroPedido}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  numeroPedido: e.target.value,
                }))
              }
              className={ContenidoStyle.searchInput}
            />
          </div>

          <div className={ContenidoStyle.filterActions}>
            <select
              value={filtros.estado}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  estado: e.target.value,
                }))
              }
              className={ContenidoStyle.filterSelect}
            >
              <option value="">Todos los estados</option>
              {estadosPedido.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {hayFiltrosAplicados() && (
            <button
              type="button"
              className={ContenidoStyle.btnOutlineSecondary}
              onClick={limpiarFiltros}
              title="Limpiar filtros"
            >
              <i className="fas fa-times"></i> Limpiar
            </button>
          )}
        </div>

        <div className={ContenidoStyle.card}>
          <div
            className={`${ContenidoStyle.cardHeader} ${ContenidoStyle.headerInventario} pb-0 pt-2`}
          >
            <h5>
              <i className="fas fa-list me-1"></i>
              Registros de Solicitudes
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
          <div className={TablaStyle.tablaContainer}>
            {pedidosFiltrados.length === 0 ? (
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron pedidos para este proveedor</h5>
                <p>
                  No hay pedidos que coincidan con el número o estado
                  seleccionado.
                </p>
              </div>
            ) : (
              <table className={`${TablaStyle.tableData} table table-striped`}>
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "19%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead className={TablaStyle.tableHeaderFixed}>
                  <tr>
                    <th className="mx-2">#</th>
                    <th className="text-center">Número de Pedido</th>
                    <th className="text-center">Fecha de Solicitud</th>
                    <th className="text-center">Fecha de Entrega</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosPaginados.map((pedido, index) => (
                    <tr key={pedido.id || `${pedido.numeroPedido}-${index}`}>
                      <td className="fw-bold">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="fw-bold text-center">
                        {pedido.numeroPedido.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="text-center">
                        {formatDate(pedido.fechaSolicitud)}
                      </td>
                      <td className="text-center">
                        {formatDate(pedido.fechaEntregaSolicitada)}
                      </td>
                      <td className="text-center">
                        {getEstadoClass(pedido.estado)}
                      </td>
                      <td>
                        <div
                          className={`${TablaStyle.actionButtons} justify-content-center`}
                        >
                          <button
                            onClick={() => abrirDetallePedido(pedido)}
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnView} `}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pedidosFiltrados.length > 0 && (
            <div className={TablaStyle.pagination}>
              <button
                type="button"
                className={TablaStyle.paginationBtn}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className={TablaStyle.paginationInfo}>
                Página {currentPage} de {totalPages} ({pedidosFiltrados.length}{" "}
                registros)
              </div>
              <button
                type="button"
                className={TablaStyle.paginationBtn}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
      {mostrarDetalles &&
        pedidoSeleccionado &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-clipboard-list me-1"></i>
                    Detalles del Pedido
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={cerrarDetallePedido}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <PedidoListado
                    pedido={pedidoSeleccionado}
                    onClose={cerrarDetallePedido}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default GestionPedidos;
