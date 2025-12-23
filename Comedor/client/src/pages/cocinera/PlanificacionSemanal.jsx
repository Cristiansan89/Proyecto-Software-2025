import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import planificacionMenuService from "../../services/planificacionMenuService";
import PlanificacionMenuForm from "../../components/cocinera/PlanificacionMenuForm";
import "../../styles/PlanificacionMenus.css";

const PlanificacionSemanal = () => {
  const [planificaciones, setPlanificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // DEBUG: Inicializar en false
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedPlanificacion, setSelectedPlanificacion] = useState(null);

  useEffect(() => {
    loadPlanificaciones();
  }, []);

  useEffect(() => {
    console.log("🔍 showModal actualizado:", showModal);
  }, [showModal]);

  const loadPlanificaciones = async () => {
    setLoading(true);
    try {
      const response = await planificacionMenuService.getAll();
      if (Array.isArray(response)) {
        setPlanificaciones(response);
      } else {
        console.warn("Respuesta inesperada al cargar planificaciones");
        setPlanificaciones([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar planificaciones:", error);
      setPlanificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, planificacion = null) => {
    setModalMode(mode);
    setSelectedPlanificacion(planificacion);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlanificacion(null);
    setModalMode("create");
  };

  const handleSavePlanificacion = async () => {
    await loadPlanificaciones();
    closeModal();
  };

  const handleDelete = async (planificacionId) => {
    if (
      window.confirm("¿Está seguro de que desea eliminar esta planificación?")
    ) {
      try {
        await planificacionMenuService.delete(planificacionId);
        alert("Planificación eliminada correctamente");
        await loadPlanificaciones();
      } catch (error) {
        console.error("❌ Error al eliminar planificación:", error);
        const errorMessage = error.response?.data?.message || error.message;
        alert(`⚠️ ${errorMessage}`);
      }
    }
  };

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title-sub">Planificaciones Semanales</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary-new"
            onClick={() => openModal("create")}
          >
            <i className="fas fa-plus"></i>
            Nueva Planificación
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando planificaciones...</p>
          </div>
        ) : planificaciones.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-calendar-plus fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No hay planificaciones creadas</h5>
            <p className="text-muted">
              Comience creando una nueva planificación de menú
            </p>
            <button
              className="btn btn-primary"
              onClick={() => openModal("create")}
            >
              <i className="fas fa-plus me-2"></i>
              Crear Primera Planificación
            </button>
          </div>
        ) : (
          <table className="table table-striped data-tabla">
            <thead className="table-header-fixed">
              <tr>
                <th>#</th>
                <th>Período</th>
                <th>Usuario Creador</th>
                <th>Comensales Estimados</th>
                <th>Estado</th>
                <th width="200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {planificaciones.map((planificacion, index) => (
                <tr key={planificacion.id_planificacion}>
                  <td>
                    <strong>{index + 1}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>
                        {new Date(planificacion.fechaInicio).toLocaleDateString(
                          "es-ES"
                        )}{" "}
                        -{" "}
                        {new Date(planificacion.fechaFin).toLocaleDateString(
                          "es-ES"
                        )}
                      </strong>
                      <br />
                      <small className="text-muted">
                        {Math.ceil(
                          (new Date(planificacion.fechaFin) -
                            new Date(planificacion.fechaInicio)) /
                            (1000 * 60 * 60 * 24)
                        ) + 1}{" "}
                        días
                      </small>
                    </div>
                  </td>
                  <td>{planificacion.nombreUsuario}</td>
                  <td>
                    {planificacion.comensalesEstimados &&
                    planificacion.comensalesEstimados > 0 ? (
                      <span className="badge bg-info fs-6">
                        {planificacion.comensalesEstimados}
                      </span>
                    ) : (
                      <span className="text-muted small">
                        <i className="fas fa-info-circle me-1"></i>
                        No especificado
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        planificacion.estado === "Activo"
                          ? "bg-success"
                          : planificacion.estado === "Finalizado"
                          ? "bg-secondary"
                          : planificacion.estado === "Pendiente"
                          ? "bg-warning"
                          : "bg-info"
                      }`}
                    >
                      {planificacion.estado}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-view"
                        title="Ver detalles"
                        onClick={() => openModal("view", planificacion)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn-action btn-edit"
                        title="Editar"
                        onClick={() => openModal("edit", planificacion)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-action btn-delete"
                        title="Eliminar"
                        onClick={() =>
                          handleDelete(planificacion.id_planificacion)
                        }
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para crear/editar/ver planificación - Renderizado en Portal para cubrir toda la pantalla */}
      {showModal &&
        createPortal(
          <div className="modal-overlay-planificacion">
            <div className="modal-content planificacion-modal">
              <div className="modal-header">
                <h3 className="text-white">
                  {modalMode === "create" && (
                    <>
                      <i className="fas fa-calendar-plus me-2"></i>
                      Nueva Planificación
                    </>
                  )}
                  {modalMode === "edit" && (
                    <>
                      <i className="fas fa-calendar-edit me-2"></i>
                      Editar Planificación
                    </>
                  )}
                  {modalMode === "view" && (
                    <>
                      <i className="fas fa-calendar me-2"></i>
                      Detalles de Planificación
                    </>
                  )}
                </h3>
                <button className="modal-close text-white" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <PlanificacionMenuForm
                  planificacion={selectedPlanificacion}
                  mode={modalMode}
                  onSave={handleSavePlanificacion}
                  onCancel={closeModal}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PlanificacionSemanal;
