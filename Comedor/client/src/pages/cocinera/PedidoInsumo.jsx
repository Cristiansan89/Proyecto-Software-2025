import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import PedidoForm from "../../components/cocinera/PedidoForm";
import PedidoAutomaticoForm from "../../components/cocinera/PedidoAutomaticoForm";
import pedidoService from "../../services/pedidoService";
import estadoPedidoService from "../../services/estadoPedidoService";
import insumoService from "../../services/insumoService";

const PedidoInsumo = () => {
  const { user } = useAuth();
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
  });
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [mostrarDetallesPedido, setMostrarDetallesPedido] = useState(null);
  const [mostrarAutomatico, setMostrarAutomatico] = useState(false);

  useEffect(() => {
    cargarDatos();
    cargarInsumosBajoStock();
  }, []);

  useEffect(() => {
    if (filtros.estado || filtros.fechaInicio || filtros.fechaFin) {
      cargarPedidosFiltrados();
    } else {
      cargarPedidos();
    }
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidosData, estadosData] = await Promise.all([
        pedidoService.getAll(),
        estadoPedidoService.getAll(),
      ]);
      setPedidos(pedidosData);
      setEstadosPedido(estadosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarPedidos = async () => {
    try {
      const data = await pedidoService.getAll();
      setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    }
  };

  const cargarPedidosFiltrados = async () => {
    try {
      setLoading(true);
      let data;

      if (filtros.estado) {
        data = await pedidoService.getByEstado(filtros.estado);
      } else {
        data = await pedidoService.getAll();
      }

      // Filtrar por fechas si se especificaron
      if (filtros.fechaInicio || filtros.fechaFin) {
        data = data.filter((pedido) => {
          const fechaPedido = new Date(pedido.fechaEmision);
          const inicio = filtros.fechaInicio
            ? new Date(filtros.fechaInicio)
            : null;
          const fin = filtros.fechaFin ? new Date(filtros.fechaFin) : null;

          return (
            (!inicio || fechaPedido >= inicio) && (!fin || fechaPedido <= fin)
          );
        });
      }

      setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos filtrados:", error);
      alert("Error al cargar pedidos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumosBajoStock = async () => {
    try {
      const data = await insumoService.getBajoStock();
      setInsumosBajoStock(data);
    } catch (error) {
      console.error("Error al cargar insumos bajo stock:", error);
    }
  };

  const aprobarPedido = async (id) => {
    if (!confirm("¿Está seguro de que desea aprobar este pedido?")) return;

    try {
      await pedidoService.aprobar(id);
      alert("Pedido aprobado exitosamente");
      cargarPedidos();
    } catch (error) {
      console.error("Error al aprobar pedido:", error);
      alert("Error al aprobar pedido: " + error.message);
    }
  };

  const cancelarPedido = async (id) => {
    const motivo = prompt("Ingrese el motivo de cancelación:");
    if (!motivo) return;

    try {
      await pedidoService.cancelar(id, motivo);
      alert("Pedido cancelado exitosamente");
      cargarPedidos();
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      alert("Error al cancelar pedido: " + error.message);
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
    console.log("✅ Generación automática exitosa:", resultado);

    // Mostrar mensaje de éxito
    alert(
      `¡Éxito! ${resultado.message}\n\nTotal pedidos creados: ${resultado.totalPedidosCreados}`
    );

    // Recargar datos
    cargarPedidos();

    // No cerrar el modal inmediatamente para que el usuario vea los resultados
  };

  const onGeneracionAutomaticaError = (error) => {
    console.error("❌ Error en generación automática:", error);
    alert(`Error: ${error}`);
  };

  const verDetallesPedido = async (pedido) => {
    try {
      setLoading(true);
      const pedidoCompleto = await pedidoService.getPedidoCompleto(
        pedido.id_pedido
      );
      setMostrarDetallesPedido(pedidoCompleto);
    } catch (error) {
      console.error("Error al cargar detalles del pedido:", error);
      alert("Error al cargar detalles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarPedido = async (id) => {
    if (!confirm("¿Está seguro de que desea eliminar este pedido?")) return;

    try {
      await pedidoService.delete(id);
      alert("Pedido eliminado exitosamente");
      cargarPedidos();
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert("Error al eliminar pedido: " + error.message);
    }
  };

  const onSuccessForm = (pedidosCreados) => {
    cargarPedidos();
    setVistaActual("lista");
    setPedidoEditando(null);
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case "Pendiente":
        return "bg-warning";
      case "Aprobado":
        return "bg-success";
      case "Enviado":
        return "bg-info";
      case "Recibido":
        return "bg-primary";
      case "Cancelado":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Vista de creación de pedido
  if (vistaActual === "crear") {
    return (
      <div className="page-content">
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">Crear Nuevo Pedido</h1>
            <p>Complete el formulario para crear un pedido manual</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setVistaActual("lista")}
            >
              <i className="fas fa-arrow-left me-1"></i>
              Volver a la Lista
            </button>
          </div>
        </div>

        <PedidoForm
          onClose={() => setVistaActual("lista")}
          onSuccess={onSuccessForm}
          pedidoEditado={pedidoEditando}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            {" "}
            <i className="fas fa-boxes-packing me-2"></i> Gestión de Pedidos
          </h1>
          <p>Administre los pedidos de insumos manual y automáticamente</p>
        </div>
        <div className="header-actions">
          <div className="btn-group">
            <button
              className="btn btn-success"
              onClick={() => {
                setPedidoEditando(null);
                setVistaActual("crear");
              }}
            >
              <i className="fas fa-plus me-1"></i>
              Nuevo Pedido Manual
            </button>
            <button
              className="btn btn-info"
              onClick={abrirGeneracionAutomatica}
              disabled={loading}
            >
              <i className="fas fa-robot me-1"></i>
              Generar Automático
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {insumosBajoStock.length > 0 && (
        <div className="alert alert-warning mb-4">
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
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i>
            Filtros
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Estado:</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value })
                }
              >
                <option value="">Todos los estados</option>
                {estadosPedido.map((estado) => (
                  <option
                    key={estado.id_estadoPedido}
                    value={estado.id_estadoPedido}
                  >
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha desde:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaInicio: e.target.value })
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha hasta:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() =>
                  setFiltros({
                    estado: "",
                    fechaInicio: "",
                    fechaFin: "",
                    proveedor: "",
                  })
                }
              >
                <i className="fas fa-times me-1"></i>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-list me-2"></i>
              Lista de Pedidos ({pedidos.length})
            </h5>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={cargarPedidos}
              disabled={loading}
            >
              <i className="fas fa-sync-alt me-1"></i>
              Actualizar
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
              <h5>No hay pedidos registrados</h5>
              <p className="text-muted">
                Cree el primer pedido haciendo clic en "Nuevo Pedido Manual"
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Fecha Emisión</th>
                    <th>Proveedor</th>
                    <th>Usuario</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Fecha Entrega</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td>
                        {new Date(pedido.fechaEmision).toLocaleDateString(
                          "es-ES"
                        )}
                      </td>
                      <td>
                        <strong>{pedido.nombreProveedor}</strong>
                      </td>
                      <td>{pedido.nombreUsuario}</td>
                      <td>
                        <span
                          className={`badge ${
                            pedido.origen === "Manual"
                              ? "bg-primary"
                              : "bg-info"
                          }`}
                        >
                          {pedido.origen}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${getEstadoBadgeClass(
                            pedido.id_estadoPedido
                          )}`}
                        >
                          {pedido.id_estadoPedido}
                        </span>
                      </td>
                      <td>
                        {pedido.fechaAprobacion
                          ? new Date(pedido.fechaAprobacion).toLocaleDateString(
                              "es-ES"
                            )
                          : "-"}
                      </td>
                      <td>
                        <div className="btn-group-sm">
                          <button
                            className="btn btn-outline-info btn-sm me-1"
                            onClick={() => verDetallesPedido(pedido)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {pedido.id_estadoPedido === "Pendiente" && (
                            <>
                              <button
                                className="btn btn-outline-success btn-sm me-1"
                                onClick={() => aprobarPedido(pedido.id_pedido)}
                                title="Aprobar pedido"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-outline-warning btn-sm me-1"
                                onClick={() => {
                                  setPedidoEditando(pedido);
                                  setVistaActual("crear");
                                }}
                                title="Editar pedido"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </>
                          )}

                          {pedido.id_estadoPedido !== "Cancelado" && (
                            <button
                              className="btn btn-outline-danger btn-sm me-1"
                              onClick={() => cancelarPedido(pedido.id_pedido)}
                              title="Cancelar pedido"
                            >
                              <i className="fas fa-ban"></i>
                            </button>
                          )}

                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminarPedido(pedido.id_pedido)}
                            title="Eliminar pedido"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {mostrarDetallesPedido && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "0",
              maxWidth: "900px",
              width: "90%",
              maxHeight: "80vh",
            }}
          >
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-info-circle me-2"></i>
                Detalles del Pedido
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setMostrarDetallesPedido(null)}
              ></button>
            </div>
            <div
              className="modal-body"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Proveedor:</strong>{" "}
                  {mostrarDetallesPedido.nombreProveedor}
                </div>
                <div className="col-md-6">
                  <strong>Fecha de Emisión:</strong>{" "}
                  {new Date(
                    mostrarDetallesPedido.fechaEmision
                  ).toLocaleDateString("es-ES")}
                </div>
                <div className="col-md-6">
                  <strong>Usuario:</strong>{" "}
                  {mostrarDetallesPedido.nombreUsuario}
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong>
                  <span
                    className={`badge ms-2 ${getEstadoBadgeClass(
                      mostrarDetallesPedido.id_estadoPedido
                    )}`}
                  >
                    {mostrarDetallesPedido.id_estadoPedido}
                  </span>
                </div>
              </div>

              {mostrarDetallesPedido.observaciones && (
                <div className="mb-3">
                  <strong>Observaciones:</strong>
                  <p className="mt-1">{mostrarDetallesPedido.observaciones}</p>
                </div>
              )}

              <h6>
                <i className="fas fa-list me-2"></i>Insumos del Pedido
              </h6>
              {mostrarDetallesPedido.detalles &&
              mostrarDetallesPedido.detalles.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Unidad</th>
                        <th>Cantidad</th>
                        <th>Proveedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostrarDetallesPedido.detalles.map((detalle) => (
                        <tr key={detalle.id_detallePedido}>
                          <td>{detalle.nombreInsumo}</td>
                          <td>{detalle.unidadMedida}</td>
                          <td>{detalle.cantidadSolicitada}</td>
                          <td>{detalle.nombreProveedor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">
                  No hay detalles disponibles para este pedido.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMostrarDetallesPedido(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
