import { useState, useEffect } from "react";
import tipoMermaService from "../../services/tipoMermaService.js";
import TipoMermaForm from "../../components/admin/TipoMermaForm.jsx";

const ListaTipoMerma = () => {
  const [tiposMerma, setTiposMerma] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("crear");
  const [selectedTipo, setSelectedTipo] = useState(null);

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

  // Eliminar tipo
  const handleEliminar = async (id) => {
    if (!confirm("¿Está seguro de que desea eliminar este tipo de merma?")) {
      return;
    }

    try {
      await tipoMermaService.delete(id);
      await cargarTiposMerma(); // Recargar lista
      alert("Tipo de merma eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar tipo de merma:", error);
      alert(
        "Error al eliminar el tipo de merma: " +
          (error.response?.data?.message || error.message)
      );
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
    alert("Tipo de merma guardado exitosamente");
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
          <h2 className="page-title-sub">Gestión de Tipos de Mermas</h2>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleNuevo}>
            <i className="fas fa-plus me-2"></i> Agregar Tipo de Merma
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
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposMerma.map((tipo) => (
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
                            onClick={() => handleEliminar(tipo.id_tipo_merma)}
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
          <div className="modal-tipomerma">
            <div className="modal-header">
              <h5 className="modal-title">
                {modalMode === "crear"
                  ? "Nuevo Tipo de Merma"
                  : "Editar Tipo de Merma"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCerrarModal}
              ></button>
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
