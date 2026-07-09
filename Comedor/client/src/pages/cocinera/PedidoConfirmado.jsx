import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import API from "../../services/api.js";
import { showSuccess, showError, showWarning } from "../../utils/alertService";
import PedidoVista from "../../components/cocinera/PedidoVista.jsx";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";

const PedidoConfirmado = () => {
  const [pedidosConfirmados, setPedidosConfirmados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [detallesPedido, setDetallesPedido] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [filtros, setFiltros] = useState({
    proveedor: "",
    estado: "",
    numeroPedido: "",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    cargarPedidosConfirmados();
  }, []);

  useEffect(() => {
    // Bloquear scroll del body cuando se abre el modal
    if (mostrarDetalles) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mostrarDetalles]);

  const clearFilters = () => {
    setFiltros({ proveedor: "", estado: "", numeroPedido: "" });
  };

  const hayFiltrosAplicados = () => {
    return filtros.proveedor || filtros.estado || filtros.numeroPedido;
  };

  const cargarPedidosConfirmados = async () => {
    try {
      setLoading(true);
      const response = await API.get("/pedidos/confirmados");
      setPedidosConfirmados(response.data);
      console.log("✅ Pedidos confirmados cargados:", response.data);
    } catch (error) {
      console.error("❌ Error al cargar pedidos confirmados:", error);
      showError("Error", "No se pudieron cargar los pedidos confirmados");
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = async (pedido) => {
    try {
      console.log("📋 Pedido completo:", pedido);
      console.log("📋 UUID a enviar:", pedido.id_pedido_uuid);
      console.log("📋 Longitud del UUID:", pedido.id_pedido_uuid.length);

      const response = await API.get(
        `/pedidos/confirmados/${pedido.id_pedido_uuid}`,
      );
      setDetallesPedido({
        ...pedido,
        detalles: response.data,
      });
      setMostrarDetalles(true);
      console.log("📋 Detalles del pedido:", response.data);
    } catch (error) {
      console.error("❌ Error al cargar detalles:", error);
      showError("Error", "No se pudieron cargar los detalles del pedido");
    }
  };

  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setDetallesPedido(null);
  };

  const filtrarPedidos = () => {
    return pedidosConfirmados.filter((pedido) => {
      const cumpleFiltroProveedor =
        !filtros.proveedor ||
        pedido.razonSocial
          .toLowerCase()
          .includes(filtros.proveedor.toLowerCase());
      const cumpleFiltroEstado =
        !filtros.estado || pedido.estadoPedido === filtros.estado;
      const cumpleFiltroNumeroPedido =
        !filtros.numeroPedido ||
        pedido.id_pedido_uuid
          .substring(0, 8)
          .toUpperCase()
          .includes(filtros.numeroPedido.toUpperCase());

      return (
        cumpleFiltroProveedor && cumpleFiltroEstado && cumpleFiltroNumeroPedido
      );
    });
  };

  const obtenerEstadosBadge = (insumosConfirmados, insumosRechazados) => {
    if (insumosConfirmados > 0 && insumosRechazados === 0) {
      return (
        <span
          className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeSuccess}`}
        >
          ✓ Confirmados
        </span>
      );
    } else if (insumosConfirmados === 0 && insumosRechazados > 0) {
      return (
        <span
          className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeDanger}`}
        >
          ✗ Rechazados
        </span>
      );
    } else {
      return (
        <span
          className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeWarning}`}
        >
          ⚠ Parcialmente
        </span>
      );
    }
  };

  const convertirCantidad = (cantidad, unidad) => {
    const cantidadNum = Number(cantidad) || 0;
    // Mostrar la cantidad tal cual está almacenada
    return Math.round(cantidadNum * 100) / 100;
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

  const pedidosFiltrados = filtrarPedidos();
  const filteredInsumos = pedidosFiltrados;
  const totalPages = Math.ceil(filteredInsumos.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pedidosACamostre = filteredInsumos.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Pedidos...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h5 className={ContenidoStyle.pageTitle}>Pedidos Confirmados</h5>
        </div>
      </div>

      {/* Filtros */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              placeholder="🔍 Buscar por proveedor..."
              value={filtros.proveedor}
              onChange={(e) =>
                setFiltros({ ...filtros, proveedor: e.target.value })
              }
              className={ContenidoStyle.searchInput}
            />
          </div>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              placeholder="🔍 Buscar por nº pedido..."
              value={filtros.numeroPedido}
              onChange={(e) =>
                setFiltros({ ...filtros, numeroPedido: e.target.value })
              }
              className={ContenidoStyle.searchInput}
            />
          </div>
          <div className={ContenidoStyle.filterActions}>
            <select
              value={filtros.estado}
              onChange={(e) =>
                setFiltros({ ...filtros, estado: e.target.value })
              }
              className={ContenidoStyle.filterSelect}
            >
              <option value="">Todos los estados</option>
              <option value="Enviado">Enviado</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
          {hayFiltrosAplicados() && (
            <button
              className="btn btn-outline-secondary"
              onClick={clearFilters}
              title="Limpiar filtros"
            >
              <i className="fas fa-times"></i>Limpiar
            </button>
          )}
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
        <div className={TablaStyle.tableContainer}>
          {pedidosFiltrados.length === 0 ? (
            <div colSpan={12}>
              <div className={TablaStyle.emptyState}>
                <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
                <h5>No se encontraron pedidos confirmados</h5>
                <p>No hay pedidos que coincidan con tu búsqueda.</p>
              </div>
            </div>
          ) : (
            <div className={TablaStyle.scrollableTable}>
              <div className={TablaStyle.tableBodyScroll}>
                <table
                  className={`${TablaStyle.tableData} table table-striped`}
                >
                  <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                  <thead className={TablaStyle.tableHeaderFixed}>
                    <tr>
                      <th>#</th>
                      <th>Proveedor</th>
                      <th>Nº Pedido</th>
                      <th>Fecha y Hora</th>
                      <th>Confirmados</th>
                      <th>Rechazados</th>
                      <th>Pendientes</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosACamostre.map((pedido, index) => (
                      <tr key={pedido.id_pedido}>
                        <td>
                          <span className="fw-bold">
                            {startIndex + index + 1}
                          </span>
                        </td>
                        <td className="fw-bold">{pedido.razonSocial}</td>
                        <td>
                          <span className="fw-bold">
                            {pedido.id_pedido_uuid
                              .substring(0, 8)
                              .toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <small className="text-muted fw-bold">
                              Emitido:{" "}
                              {formatearFechaConHora(pedido.fechaEmision)}
                            </small>
                            {pedido.fechaConfirmacion && (
                              <span className="text-success">
                                Confirmación:{" "}
                                {formatearFechaConHora(
                                  pedido.fechaConfirmacion,
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="text-center">
                          <span
                            className={`${ContenidoStyle.badgeNumber} ${ContenidoStyle.bgSuccess}`}
                          >
                            {pedido.insumosConfirmados}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`${ContenidoStyle.badgeNumber} ${ContenidoStyle.bgDanger}`}
                          >
                            {pedido.insumosRechazados}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`${ContenidoStyle.badgeNumber} ${ContenidoStyle.bgSecondary}`}
                          >
                            {pedido.insumosPendientes}
                          </span>
                        </td>
                        <td>
                          {obtenerEstadosBadge(
                            pedido.insumosConfirmados,
                            pedido.insumosRechazados,
                          )}
                        </td>
                        <td>
                          <div className="acciones-columna">
                            <button
                              onClick={() => verDetalles(pedido)}
                              className="btn-action btn-view"
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

      {mostrarDetalles &&
        detallesPedido &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-clipboard-list me-1"></i>
                    Detalles de Confirmación
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={cerrarDetalles}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <PedidoVista
                    detallesPedido={detallesPedido}
                    onClose={cerrarDetalles}
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

export default PedidoConfirmado;
