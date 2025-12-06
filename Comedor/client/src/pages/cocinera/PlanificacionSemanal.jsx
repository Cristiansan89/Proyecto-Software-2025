import { useState, useEffect } from "react";
import planificacionMenuService from "../../services/planificacionMenuService";
import PlanificacionMenuForm from "../../components/cocinera/PlanificacionMenuForm";
import "../../styles/PlanificacionMenus.css";

const PlanificacionSemanal = () => {
  const [planificaciones, setPlanificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState("crear");
  const [planificacionSeleccionada, setPlanificacionSeleccionada] =
    useState(null);
  const [formularioPlanificacion, setFormularioPlanificacion] = useState({
    fechaInicio: "",
    fechaFin: "",
    comensalesEstimados: "",
    estado: "Pendiente",
  });

  // Función para formatear fechas para inputs de tipo date
  const formatearFechaParaInput = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    // Ajustar para zona horaria local
    const offset = date.getTimezoneOffset();
    const fechaLocal = new Date(date.getTime() + offset * 60 * 1000);
    return fechaLocal.toISOString().split("T")[0];
  };

  useEffect(() => {
    cargarPlanificaciones();
  }, []);

  const cargarPlanificaciones = async () => {
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

  const abrirModalNuevaPlanificacion = () => {
    setModalTipo("crear");
    setPlanificacionSeleccionada(null);
    setFormularioPlanificacion({
      fechaInicio: "",
      fechaFin: "",
      comensalesEstimados: "",
      estado: "Pendiente",
    });
    setModalVisible(true);
  };

  const handleVerPlanificacion = (planificacion) => {
    setPlanificacionSeleccionada(planificacion);
    setFormularioPlanificacion({
      fechaInicio: formatearFechaParaInput(planificacion.fechaInicio),
      fechaFin: formatearFechaParaInput(planificacion.fechaFin),
      comensalesEstimados: planificacion.comensalesEstimados || "",
      estado: planificacion.estado || "Activo",
    });
    setModalTipo("ver");
    setModalVisible(true);
  };

  const handleEditarPlanificacion = (planificacion) => {
    setPlanificacionSeleccionada(planificacion);
    setFormularioPlanificacion({
      fechaInicio: formatearFechaParaInput(planificacion.fechaInicio),
      fechaFin: formatearFechaParaInput(planificacion.fechaFin),
      comensalesEstimados: planificacion.comensalesEstimados || "",
      estado: planificacion.estado || "Activo",
    });
    setModalTipo("editar");
    setModalVisible(true);
  };

  const handleEliminarPlanificacion = async (planificacion) => {
    if (
      !confirm(
        `¿Está seguro de que desea eliminar la planificación del ${planificacion.fechaInicio} al ${planificacion.fechaFin}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const resultado = await planificacionMenuService.delete(
        planificacion.id_planificacion
      );

      await cargarPlanificaciones();
      alert("Planificación eliminada exitosamente");
    } catch (error) {
      console.error("❌ Error al eliminar planificación:", error);
      alert("Error al eliminar la planificación: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setModalTipo("crear");
    setPlanificacionSeleccionada(null);
    setFormularioPlanificacion({
      fechaInicio: "",
      fechaFin: "",
      comensalesEstimados: "",
      estado: "Pendiente",
    });
  };

  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target;
    setFormularioPlanificacion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSuccessForm = async () => {
    await cargarPlanificaciones();
    cerrarModal();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <i className="fas fa-calendar-week me-2"></i>
          Planificaciones Semanales
        </h4>
        <div className="header-actions">
          <button
            className="btn btn-success"
            onClick={() => abrirModalNuevaPlanificacion()}
          >
            <i className="fas fa-plus me-2"></i>
            Nueva Planificación
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
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
            onClick={() => abrirModalNuevaPlanificacion()}
          >
            <i className="fas fa-plus me-2"></i>
            Crear Primera Planificación
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
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
                    <span className="badge bg-info fs-6">
                      {planificacion.comensalesEstimados}
                    </span>
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
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        title="Ver detalle"
                        onClick={() => handleVerPlanificacion(planificacion)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="btn btn-outline-warning"
                        title="Editar"
                        onClick={() => handleEditarPlanificacion(planificacion)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        title="Eliminar"
                        onClick={() =>
                          handleEliminarPlanificacion(planificacion)
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
        </div>
      )}

      <PlanificacionMenuForm
        visible={modalVisible}
        modalTipo={modalTipo}
        planificacionSeleccionada={planificacionSeleccionada}
        formularioPlanificacion={formularioPlanificacion}
        onFormChange={manejarCambioFormulario}
        onClose={cerrarModal}
        onSuccess={onSuccessForm}
      />
    </div>
  );
};

export default PlanificacionSemanal;
