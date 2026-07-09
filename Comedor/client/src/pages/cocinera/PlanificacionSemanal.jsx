import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import planificacionMenuService from "../../services/planificacionMenuService";
import PlanificacionMenuForm from "../../components/cocinera/PlanificacionMenuForm";
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

const PlanificacionSemanal = () => {
  const [planificaciones, setPlanificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // DEBUG: Inicializar en false
  const [modalMode, setModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [selectedPlanificacion, setSelectedPlanificacion] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadPlanificaciones();
  }, []);

  useEffect(() => {
    //console.log("🔍 showModal actualizado:", showModal);
  }, [showModal]);

  // Resetear a página 1 cuando cambian los datos o el tamaño de página
  useEffect(() => {
    setCurrentPage(1);
  }, [planificaciones, pageSize]);

  const loadPlanificaciones = async () => {
    setLoading(true);
    try {
      const response = await planificacionMenuService.getAll();
      if (Array.isArray(response)) {
        setPlanificaciones(response);
      } else {
        //console.warn("Respuesta inesperada al cargar planificaciones");
        showWarning(
          "Advertencia",
          "⚠️ La respuesta del servidor al cargar las planificaciones fue inesperada.",
        );
        setPlanificaciones([]);
      }
    } catch (error) {
      //console.error("❌ Error al cargar planificaciones:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar las planificaciones. Por favor, intente nuevamente más tarde.",
      );
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
    // Buscar la planificación en el array para obtener las fechas
    const planificacion = planificaciones.find(
      (p) => p.id_planificacion === planificacionId,
    );

    if (!planificacion) {
      showError("Error", "Planificación no encontrada");
      return;
    }

    // Validar que solo se puedan eliminar planificaciones en estado Pendiente
    if (planificacion.estado !== "Pendiente") {
      showWarning(
        "Operación no permitida",
        `No se puede eliminar una planificación en estado "${planificacion.estado}". Solo se pueden eliminar planificaciones en estado Pendiente.`,
      );
      return;
    }

    // 1. Confirmación asíncrona personalizada
    const confirmed = await showConfirm(
      "Eliminar Planificación",
      `¿Está seguro de que desea eliminar la planificación de menú del período ${new Date(
        planificacion.fechaInicio,
      ).toLocaleDateString("es-ES")} - ${new Date(
        planificacion.fechaFin,
      ).toLocaleDateString(
        "es-ES",
      )}? Esta acción podría afectar los reportes de consumo de insumos.`,
      "Sí, eliminar",
      "Cancelar",
    );

    if (confirmed) {
      try {
        // 2. Ejecución del servicio
        await planificacionMenuService.delete(planificacionId);

        // 3. Notificación de éxito y recarga
        showSuccess("Éxito", "Planificación eliminada correctamente");
        await loadPlanificaciones();
      } catch (error) {
        // 4. Manejo de errores unificado
        // Extraemos el mensaje del servidor o usamos uno genérico si falla la conexión
        const errorMessage =
          error.response?.data?.message ||
          "Ocurrió un error inesperado al eliminar la planificación.";

        showError("Error al eliminar", errorMessage);
      }
    }
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(planificaciones.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const planificacionesActuales = planificaciones.slice(startIndex, endIndex);

  // Generar números de página para la paginación
  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Planificación Semanal...</p>
      </div>
    );
  }

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fas fa-calendar-week"></i>
            Planificaciones Semanales
          </h1>
        </div>
        <div className={ContenidoStyle.headerActions}>
          <div className="d-flex gap-2">
            <button
              className={`${ContenidoStyle.btn} ${ContenidoStyle.btnNuevo}`}
              onClick={() => openModal("create")}
            >
              <i className="fas fa-plus me-1"></i>
              Nueva Planificación
            </button>
          </div>
        </div>
      </div>

      <div className={TablaStyle.paginationInfoBar}>
        <div className={TablaStyle.paginationInfo}>
          Mostrando {startIndex + 1} a{" "}
          {Math.min(endIndex, planificaciones.length)} de{" "}
          {planificaciones.length} planificaciones
        </div>
        <div className={TablaStyle.itemsPerPage}>
          <label>
            <strong>Registros por página:</strong>
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
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
        {planificaciones.length === 0 ? (
          <div>
            <div className={TablaStyle.emptyState}>
              <i className={`fas fa-search ${TablaStyle.emptyIcon}`}></i>
              <h5>No hay planificaciones creadas</h5>
              <p>Comience creando una nueva planificación de menú</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => openModal("create")}
            >
              <i className="fas fa-plus me-2"></i>
              Crear Primera Planificación
            </button>
          </div>
        ) : (
          <div className={TablaStyle.scrollableTable}>
            <div className={TablaStyle.tableBodyScroll}>
              <table className={`${TablaStyle.tableData} table table-striped`}>
                <thead className={TablaStyle.tableHeaderFixed}>
                  <tr>
                    <th className="text-center fw-bold">#</th>
                    <th className="fw-bold">Período</th>
                    <th className="fw-bold">Usuario Creador</th>
                    <th className="text-center fw-bold">
                      Comensales Estimados
                    </th>
                    <th className="text-center fw-bold">Estado</th>
                    <th className="fw-bold" width="200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {planificacionesActuales.map((planificacion, index) => (
                    <tr key={planificacion.id_planificacion}>
                      <td className="text-center">
                        <strong>{startIndex + index + 1}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>
                            {new Date(
                              planificacion.fechaInicio,
                            ).toLocaleDateString("es-ES")}{" "}
                            -{" "}
                            {new Date(
                              planificacion.fechaFin,
                            ).toLocaleDateString("es-ES")}
                          </strong>
                          <br />
                          <small className="text-muted">
                            {Math.ceil(
                              (new Date(planificacion.fechaFin) -
                                new Date(planificacion.fechaInicio)) /
                                (1000 * 60 * 60 * 24),
                            ) + 1}{" "}
                            días
                          </small>
                        </div>
                      </td>
                      <td className="fw-bold fst-italic">
                        {planificacion.nombreUsuario}
                      </td>
                      <td className="text-center">
                        {planificacion.comensalesEstimados &&
                        planificacion.comensalesEstimados > 0 ? (
                          <span
                            className={`${ContenidoStyle.badge} bg-primary fs-6 text-white `}
                          >
                            {planificacion.comensalesEstimados}
                          </span>
                        ) : (
                          <span className="text-muted small">
                            <i className="fas fa-info-circle me-1"></i>
                            No especificado
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className={`${ContenidoStyle.badge} ${
                            planificacion.estado === "Activo"
                              ? "bg-success text-white"
                              : planificacion.estado === "Finalizado"
                                ? "bg-secondary text-white"
                                : planificacion.estado === "Pendiente"
                                  ? "bg-warning text-black"
                                  : "bg-info text-white"
                          } fw-bold`}
                        >
                          {planificacion.estado}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className={TablaStyle.actionButtons}>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnView}`}
                            title="Ver detalles"
                            onClick={() => openModal("view", planificacion)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnEdit}`}
                            title={
                              planificacion.estado === "Programado" ||
                              planificacion.estado === "Activo" ||
                              planificacion.estado === "Finalizado"
                                ? "No se puede editar: planificación " +
                                  planificacion.estado.toLowerCase()
                                : "Editar"
                            }
                            onClick={() => openModal("edit", planificacion)}
                            disabled={
                              planificacion.estado === "Programado" ||
                              planificacion.estado === "Activo" ||
                              planificacion.estado === "Finalizado"
                            }
                            style={{
                              display:
                                planificacion.estado === "Programado" ||
                                planificacion.estado === "Activo" ||
                                planificacion.estado === "Finalizado"
                                  ? "none"
                                  : "block",
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`${TablaStyle.btnAction} ${TablaStyle.btnDelete}`}
                            title={
                              planificacion.estado === "Programado" ||
                              planificacion.estado === "Activo" ||
                              planificacion.estado === "Finalizado"
                                ? "No se puede eliminar: planificación " +
                                  planificacion.estado.toLowerCase()
                                : "Eliminar"
                            }
                            onClick={() =>
                              handleDelete(planificacion.id_planificacion)
                            }
                            disabled={
                              planificacion.estado === "Programado" ||
                              planificacion.estado === "Activo" ||
                              planificacion.estado === "Finalizado"
                            }
                            style={{
                              display:
                                planificacion.estado === "Programado" ||
                                planificacion.estado === "Activo" ||
                                planificacion.estado === "Finalizado"
                                  ? "none"
                                  : "block",
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className={TablaStyle.pagination}>
                  <button
                    className={TablaStyle.paginationButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  {getPaginationNumbers().map((page) => (
                    <button
                      key={page}
                      className={`${TablaStyle.paginationButton} ${currentPage === page ? TablaStyle.active : ""}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className={TablaStyle.paginationButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal &&
        createPortal(
          <div className={FormularioStyle.modal}>
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
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
                  </h5>
                  <button
                    className={FormularioStyle.modalClose}
                    onClick={closeModal}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={FormularioStyle.modalBody}>
                  <PlanificacionMenuForm
                    planificacion={selectedPlanificacion}
                    mode={modalMode}
                    onSave={handleSavePlanificacion}
                    onCancel={closeModal}
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

export default PlanificacionSemanal;
