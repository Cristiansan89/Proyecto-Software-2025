import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import estadoPedidoService from "../../services/estadoPedidoService.js";
import EstadoPedidoForm from "../../components/admin/EstadoPedidoForm.jsx";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";
import FormularioStyle from "../../styles/Formulario.module.css";

const ListaEstadoPedido = () => {
  const [estadosPedido, setEstadosPedido] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedEstado, setSelectedEstado] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar estados de pedido
  const cargarEstadosPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await estadoPedidoService.getAll();
      const dataOrdenada = (data || []).sort((a, b) => {
        return Number(a.id_estadoPedido) - Number(b.id_estadoPedido);
      });
      setEstadosPedido(data);
    } catch (error) {
      // console.error("Error al cargar estados de pedido:", error);
      showError(
        "Error",
        "Error al cargar los estados de pedido: " +
          (error.response?.data?.message || error.message),
      );
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
  const handleEliminar = async (id, nombreEstado) => {
    // 1. Confirmación personalizada
    const confirmed = await showConfirm(
      "Eliminar Estado de Pedido",
      `¿Está seguro de que desea eliminar el estado de pedido "${nombreEstado}"?`,
      "Sí, eliminar",
      "Cancelar",
    );

    // 2. Ejecutar solo si el usuario confirmó
    if (confirmed) {
      try {
        await estadoPedidoService.delete(id);

        // Actualizar la tabla y notificar
        await cargarEstadosPedido();
        showSuccess(
          "Éxito",
          `Estado de pedido "${nombreEstado}" eliminado exitosamente`,
        );
      } catch (error) {
        // Notificación de error sin logs innecesarios
        showError(
          "Error",
          "Error al eliminar el estado de pedido: " +
            (error.response?.data?.message || error.message),
        );
      }
    }
  };

  // Filtrar estado
  const filteredEstadosPedidos = estadosPedido.filter((estado) => {
    const matchesSearch = (estado.nombreEstado || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSearchTerm = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setShowModal(false);
    setSelectedEstado(null);
  };

  // Manejar guardado exitoso
  const handleGuardadoExitoso = async (accion) => {
    setShowModal(false);
    setSelectedEstado(null);
    await cargarEstadosPedido();
    if (accion === "updated") {
      showSuccess("Éxito", "Estado de pedido actualizado exitosamente");
    } else {
      showSuccess("Éxito", "Estado de pedido guardado exitosamente");
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Estados de Pedidos...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            Gestionar Estados de Pedidos
          </h1>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <button
            className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
            onClick={handleNuevo}
          >
            <i className="fas fa-plus me-2"></i>Nuevo Estado de Pedido
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className={ContenidoStyle.headerLeft}>
        <div className={ContenidoStyle.searchFilters}>
          <div className={ContenidoStyle.searchBar}>
            <input
              type="text"
              className={ContenidoStyle.searchInput}
              placeholder="Buscar nombre del estado de pedido..."
              value={searchTerm}
              onChange={handleSearchTerm}
            />
          </div>
          <div className={ContenidoStyle.filterActions}>
            {searchTerm && (
              <button
                className={ContenidoStyle.btnOutlineSecondary}
                onClick={clearFilters}
              >
                <i className="fas fa-times"></i> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de estados de pedido */}
      <div className={TablaStyle.tableContainer}>
        {filteredEstadosPedidos.length === 0 ? (
          <div colSpan={12}>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No se encontraron estados de pedido</h5>
              <p>No hay estados de pedido que coincidan con tu búsqueda.</p>
            </div>
          </div>
        ) : (
          <div className={TablaStyle.scrollableTable}>
            <div className={TablaStyle.bodyScroll}>
              <table className={`${TablaStyle.tableData} table table-striped`}>
                <thead className={TablaStyle.tableHeaderFixed}>
                  <tr>
                    <th>#</th>
                    <th>Nombre del Estado</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEstadosPedidos.map((estado) => (
                    <tr key={estado.id_estadoPedido}>
                      <td>
                        <strong>{estado.id_estadoPedido}</strong>
                      </td>
                      <td>
                        <div className={TablaStyle.titleTable}>
                          <i className="fas fa-clipboard-check"></i>
                          <strong>{estado.nombreEstado}</strong>
                        </div>
                      </td>
                      <td>
                        <div className={TablaStyle.titleDescripcion}>
                          {estado.descripcion || "-"}
                        </div>
                      </td>
                      <td>
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            onClick={() => handleEditar(estado)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            onClick={() =>
                              handleEliminar(
                                estado.id_estadoPedido,
                                estado.nombreEstado,
                              )
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
      {showModal &&
        createPortal(
          <div className={`modal fade show d-block ${FormularioStyle.modal}`}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
                    <i className="fas fa-clipboard-list"></i>
                    {modalMode === "create"
                      ? "Nuevo Estado de Pedido"
                      : "Editar Estado de Pedido"}
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={handleCerrarModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <EstadoPedidoForm
                    estadoPedido={selectedEstado}
                    mode={modalMode}
                    onSave={handleGuardadoExitoso}
                    onCancel={handleCerrarModal}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showModal &&
        createPortal(
          <div
            className={`${FormularioStyle.modalBackdrop}`}
            style={{ zIndex: 1040, pointerEvents: "all" }}
          ></div>,
          document.body,
        )}
    </div>
  );
};

export default ListaEstadoPedido;
