import { useState, useEffect } from "react";
import estadoPedidoService from "../../services/estadoPedidoService.js";
import EstadoPedidoForm from "../../components/admin/EstadoPedidoForm.jsx";

const ListaEstadoPedido = () => {
  const [estadosPedido, setEstadosPedido] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedEstado, setSelectedEstado] = useState(null);

  // Cargar estados de pedido
  const cargarEstadosPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await estadoPedidoService.getAll();
      setEstadosPedido(data);
    } catch (error) {
      console.error("Error al cargar estados de pedido:", error);
      setError("Error al cargar los estados de pedido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadosPedido();
  }, []);

  // Abrir modal para crear nuevo estado
  const handleNuevo = () => {
    setSelectedEstado(null);
    setModalMode("create");
    setShowModal(true);
  };

  // Abrir modal para editar estado
  const handleEditar = (estado) => {
    setSelectedEstado(estado);
    setModalMode("edit");
    setShowModal(true);
  };

  // Eliminar estado
  const handleEliminar = async (id) => {
    if (!confirm("¿Está seguro de que desea eliminar este estado de pedido?")) {
      return;
    }

    try {
      await estadoPedidoService.delete(id);
      await cargarEstadosPedido(); // Recargar lista
      alert("Estado de pedido eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar estado de pedido:", error);
      alert(
        "Error al eliminar el estado de pedido: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setShowModal(false);
    setSelectedEstado(null);
  };

  // Manejar guardado exitoso
  const handleGuardadoExitoso = async () => {
    setShowModal(false);
    setSelectedEstado(null);
    await cargarEstadosPedido();
    alert("Estado de pedido guardado exitosamente");
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h2 className="page-title-sub">Gestionar Estados de Pedidos</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleNuevo}>
            <i className="fas fa-plus me-2"></i>Nuevo Estado de Pedido
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Tabla de estados de pedido */}
      <div className="table-container">
        {estadosPedido.length === 0 ? (
          <div className="no-data">
            <p>No hay estados de pedido registrados</p>
          </div>
        ) : (
          <div className="scrollable-table">
            <div className="table-body-scroll">
              <table className="table table-striped data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre del Estado</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estadosPedido.map((estado) => (
                    <tr key={estado.id_estadoPedido}>
                      <td>
                        <strong>{estado.id_estadoPedido}</strong>
                      </td>
                      <td>
                        <i className="fas fa-clipboard-check me-2"></i>
                        <strong>{estado.nombreEstado}</strong>
                      </td>
                      <td>{estado.descripcion || "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            estado.estado === "Activo"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {estado.estado}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditar(estado)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() =>
                              handleEliminar(estado.id_estado_pedido)
                            }
                            title="Eliminar"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar estado */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                <i className="fas fa-clipboard-list"></i>
                {modalMode === "create"
                  ? "Nuevo Estado de Pedido"
                  : "Editar Estado de Pedido"}
              </h4>
              <button
                className="modal-close text-white"
                onClick={handleCerrarModal}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <EstadoPedidoForm
                estadoPedido={selectedEstado}
                mode={modalMode}
                onSave={handleGuardadoExitoso}
                onCancel={handleCerrarModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaEstadoPedido;
