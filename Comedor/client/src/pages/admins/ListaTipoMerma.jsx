import { useState, useEffect } from "react";
import tipoMermaService from "../../services/tipoMermaService.js";
import TipoMermaForm from "../../components/admin/TipoMermaForm.jsx";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const ListaTipoMerma = () => {
  const [tiposMerma, setTiposMerma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("crear");
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "id_tipo_merma",
    direction: "asc",
  });

  // Cargar tipos de merma
  const cargarTiposMerma = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tipoMermaService.getAll();
      setTiposMerma(data);
    } catch (error) {
      console.error("Error al cargar tipos de merma:", error);
      setError("Error al cargar los tipos de merma");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTiposMerma();
  }, []);

  // Abrir modal para crear nuevo tipo
  const handleNuevo = () => {
    setSelectedTipo(null);
    setModalMode("crear");
    setShowModal(true);
  };

  // Abrir modal para editar tipo
  const handleEditar = (tipo) => {
    setSelectedTipo(tipo);
    setModalMode("editar");
    setShowModal(true);
  };

  // Ordenar tabla
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Ordenar datos
  const tiposMermaOrdenados = [...tiposMerma].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortConfig.direction === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  // Eliminar tipo
  const handleEliminar = async (id, nombre) => {
    // 1. Confirmación asíncrona personalizada
    const confirmed = await showConfirm(
      "Eliminar Tipo de Merma",
      `¿Está seguro de que desea eliminar el tipo de merma "${nombre}"?`,
      "Sí, eliminar",
      "Cancelar"
    );

    // 2. Si el usuario confirma, ejecutamos la acción
    if (confirmed) {
      try {
        await tipoMermaService.delete(id);

        // Recargar lista y mostrar éxito
        await cargarTiposMerma();
        showSuccess(
          "Éxito",
          `Tipo de merma "${nombre}" eliminado exitosamente`
        );
      } catch (error) {
        // Manejo de errores sin console.log innecesarios
        showError(
          "Error",
          "Error al eliminar el tipo de merma: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  // Cerrar modal
  const handleCerrarModal = () => {
    setShowModal(false);
    setSelectedTipo(null);
  };

  // Manejar guardado exitoso
  const handleGuardadoExitoso = async () => {
    setShowModal(false);
    setSelectedTipo(null);
    await cargarTiposMerma();
    showSuccess("Éxito", "Tipo de merma guardado exitosamente");
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
          <h2 className="page-title-sub">Gestionar Tipos de Mermas</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleNuevo}>
            <i className="fas fa-plus me-2"></i>Nuevo Tipo de Merma
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Tabla de tipos de merma */}
      <div className="table-container">
        {tiposMerma.length === 0 ? (
          <div className="no-data">
            <p>No hay tipos de merma registrados</p>
          </div>
        ) : (
          <div className="scrollable-table">
            <div className="table-body-scroll">
              <table className="table table-striped data-table">
                <thead>
                  <tr>
                    <th>
                      <button
                        className="btn btn-link p-0 text-dark"
                        onClick={() => handleSort("id_tipo_merma")}
                        style={{ textDecoration: "none" }}
                      >
                        #
                        {sortConfig.key === "id_tipo_merma" && (
                          <i
                            className={`fas fa-sort-${
                              sortConfig.direction === "asc" ? "up" : "down"
                            } ms-2`}
                          ></i>
                        )}
                      </button>
                    </th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposMermaOrdenados.map((tipo) => (
                    <tr key={tipo.id_tipo_merma}>
                      <td>
                        <strong>{tipo.id_tipo_merma}</strong>
                      </td>
                      <td>
                        <i className="fas fa-tag me-2"></i>
                        {tipo.nombre}
                      </td>
                      <td>{tipo.descripcion || "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            tipo.estado === "Activo"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {tipo.estado}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditar(tipo)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() =>
                              handleEliminar(tipo.id_tipo_merma, tipo.nombre)
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

      {/* Modal para agregar/editar tipo */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content configuracion-modal">
            <div className="modal-header">
              <h4 className="modal-title">
                <i className="fas fa-tags me-2"></i>
                {modalMode === "crear"
                  ? "Nuevo Tipo de Merma"
                  : "Editar Tipo de Merma"}
              </h4>
              <button
                className="modal-close text-white"
                onClick={handleCerrarModal}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <TipoMermaForm
                tipoMerma={selectedTipo}
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

export default ListaTipoMerma;
