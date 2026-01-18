import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import API from "../../services/api.js";
import { showSuccess, showError, showWarning } from "../../utils/alertService";
import PedidoVista from "../../components/cocinera/PedidoVista.jsx";
import "../../styles/pedidoConfirmado.css";

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
      return <span className="badge badge-success">✓ Confirmados</span>;
    } else if (insumosConfirmados === 0 && insumosRechazados > 0) {
      return <span className="badge badge-danger">✗ Rechazados</span>;
    } else {
      return <span className="badge badge-warning">⚠ Parcialmente</span>;
    }
  };

  const convertirCantidad = (cantidad, unidad) => {
    const cantidadNum = Number(cantidad) || 0;
    if (
      (unidad.includes("Gramo") || unidad.includes("Mililitro")) &&
      cantidadNum > 1000
    ) {
      return Math.round((cantidadNum / 1000) * 100) / 100;
    }
    return cantidadNum;
  };

  const pedidosFiltrados = filtrarPedidos();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando pedidos confirmados...</p>
      </div>
    );
  }

  return (
    <div className="content-page">
      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtro-grupo">
          <input
            type="text"
            placeholder="🔍 Buscar por proveedor..."
            value={filtros.proveedor}
            onChange={(e) =>
              setFiltros({ ...filtros, proveedor: e.target.value })
            }
            className="filtro-input"
          />
        </div>

        <div className="filtro-grupo">
          <input
            type="text"
            placeholder="🔍 Buscar por nº pedido..."
            value={filtros.numeroPedido}
            onChange={(e) =>
              setFiltros({ ...filtros, numeroPedido: e.target.value })
            }
            className="filtro-input"
          />
        </div>

        <div className="filtro-grupo">
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="form-select"
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
            <i className="fas fa-times me-1"></i>
          </button>
        )}
      </div>

      {/* Tabla de Pedidos Confirmados */}
      <div className="table-container">
        {pedidosFiltrados.length === 0 ? (
          <div className="tabla-vacia">
            <p>No hay pedidos confirmados que mostrar</p>
          </div>
        ) : (
          <div className="scrollable-table">
            <div className="">
              <div>
                <table
                  className="table table-striped data-table"
                  style={{ minWidth: 0 }}
                >
                  <colgroup>
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />

                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                  </colgroup>
                  <thead className="table-header-auto">
                    <tr className="tabla-title">
                      <th>#</th>
                      <th>Proveedor</th>
                      <th>Nº Pedido</th>
                      <th>Fecha</th>
                      <th>Confirmados</th>
                      <th>Rechazados</th>
                      <th>Pendientes</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosFiltrados.map((pedido, index) => (
                      <tr key={pedido.id_pedido}>
                        <td className="numero-id">
                          <span>{index + 1}</span>
                        </td>
                        <td className="proveedor-nombre">
                          {pedido.razonSocial}
                        </td>
                        <td className="numero-pedido">
                          <span>
                            {pedido.id_pedido_uuid
                              .substring(0, 8)
                              .toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {new Date(pedido.fechaEmision).toLocaleDateString(
                            "es-ES",
                          )}
                        </td>

                        <td className="numero-confirmados">
                          <span className="badge-number bg-success">
                            {pedido.insumosConfirmados}
                          </span>
                        </td>
                        <td className="numero-rechazados">
                          <span className="badge-number bg-danger">
                            {pedido.insumosRechazados}
                          </span>
                        </td>
                        <td className="numero-pendientes">
                          <span className="badge-number bg-secondary">
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
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {mostrarDetalles &&
        detallesPedido &&
        createPortal(
          <div className="modal-overlay-pedido-vista">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">
                  <i className="fas fa-clipboard-list me-1"></i>
                  Detalles de Confirmación
                </h2>
                <button className="modal-close" onClick={cerrarDetalles}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <PedidoVista
                  detallesPedido={detallesPedido}
                  onClose={cerrarDetalles}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PedidoConfirmado;
