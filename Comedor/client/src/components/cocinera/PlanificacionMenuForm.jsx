import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import planificacionMenuService from "../../services/planificacionMenuService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const PlanificacionMenuForm = ({ planificacion, mode, onSave, onCancel }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fechaInicio: "",
    fechaFin: "",
    comensalesEstimados: "",
    estado: "Pendiente",
  });

  const [loading, setLoading] = useState(false);
  const [calculatingDiners, setCalculatingDiners] = useState(false);
  const [dinersCalculated, setDinersCalculated] = useState(null);
  const [showDinersDetail, setShowDinersDetail] = useState(false);

  const estados = [
    { value: "Pendiente", label: "Pendiente" },
    { value: "Activo", label: "Activo" },
    { value: "Finalizado", label: "Finalizado" },
    { value: "Cancelado", label: "Cancelado" },
  ];

  // Función para formatear fechas
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() + offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (mode === "create") {
      setFormData({
        fechaInicio: "",
        fechaFin: "",
        comensalesEstimados: "",
        estado: "Pendiente",
      });
    } else if (planificacion) {
      setFormData({
        fechaInicio: formatDateForInput(planificacion.fechaInicio),
        fechaFin: formatDateForInput(planificacion.fechaFin),
        comensalesEstimados: planificacion.comensalesEstimados || "",
        estado: planificacion.estado || "Activo",
      });
    }
    setDinersCalculated(null);
    setShowDinersDetail(false);
  }, [planificacion, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateDinersAutomatically = async () => {
    if (!formData.fechaInicio) {
      showToast(
        "Por favor seleccione primero la fecha de inicio",
        "info",
        2000
      );
      return;
    }

    setCalculatingDiners(true);
    try {
      const dataDiners =
        await planificacionMenuService.calcularComensalesPorFecha(
          formData.fechaInicio
        );

      setDinersCalculated(dataDiners);

      const totalDiners = dataDiners.resumen?.totalDia || 0;
      setFormData((prev) => ({
        ...prev,
        comensalesEstimados: totalDiners.toString(),
      }));

      setShowDinersDetail(true);
    } catch (error) {
      // Manejar error 401
      if (error.response?.status === 401) {
        showToast(
          "Sesión expirada. Por favor, inicia sesión nuevamente.",
          "info",
          2000
        );
        navigate("/login");
        return;
      }
      showError(
        "Error",
        "Error al calcular comensales automáticamente: " + error.message
      );
    } finally {
      setCalculatingDiners(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que fecha de fin sea posterior a fecha de inicio
    if (formData.fechaInicio && formData.fechaFin) {
      if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
        showToast(
          "La fecha de fin debe ser posterior a la fecha de inicio",
          "info",
          2000
        );
        return;
      }
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        id_usuario: user?.idUsuario || user?.id_usuario || null,
        comensalesEstimados: parseInt(formData.comensalesEstimados) || 0,
        estado: formData.estado || "Pendiente",
      };

      console.log("Enviando datos:", dataToSend);

      if (mode === "create") {
        await planificacionMenuService.create(dataToSend);
        showToast("Planificación creada correctamente", "info", 2000);
      } else {
        await planificacionMenuService.update(
          planificacion.id_planificacion,
          dataToSend
        );
        showToast("Planificación actualizada correctamente", "info", 2000);
      }

      onSave();
    } catch (error) {
      console.error("Error al guardar planificación:", error);

      // Manejar error 401
      if (error.response?.status === 401) {
        showToast(
          "Sesión expirada. Por favor, inicia sesión nuevamente.",
          "info",
          2000
        );
        navigate("/login");
        return;
      }

      const errorMessage = error.response?.data?.message || error.message;
      showInfo("Información", `Error al guardar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";

  return (
    <div>
      <form onSubmit={handleSubmit} id="planificacionForm">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="fechaInicio" className="form-label">
              Fecha de Inicio
            </label>
            <input
              type="date"
              className="form-control"
              id="fechaInicio"
              name="fechaInicio"
              value={formData.fechaInicio}
              onChange={handleInputChange}
              required
              readOnly={isViewMode}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="fechaFin" className="form-label">
              Fecha de Fin
            </label>
            <input
              type="date"
              className="form-control"
              id="fechaFin"
              name="fechaFin"
              value={formData.fechaFin}
              onChange={handleInputChange}
              required
              readOnly={isViewMode}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              className="form-control"
              id="estado"
              name="estado"
              value={formData.estado || "Pendiente"}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
            >
              <option value="">-- Seleccionar estado --</option>
              {estados.map((estado) => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="comensalesEstimados" className="form-label">
              Comensales Estimados
            </label>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                id="comensalesEstimados"
                name="comensalesEstimados"
                value={formData.comensalesEstimados}
                onChange={handleInputChange}
                min="0"
                required
                readOnly={isViewMode}
                placeholder="Ingrese número de comensales"
              />
              {!isViewMode && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={calculateDinersAutomatically}
                  disabled={calculatingDiners || !formData.fechaInicio}
                  title="Calcular automáticamente según matrícula actual"
                >
                  {calculatingDiners ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    <i className="fas fa-calculator"></i>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detalles del cálculo de comensales */}
        {showDinersDetail && dinersCalculated && (
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0 text-black">
                <i className="fas fa-chart-bar me-2"></i>
                Detalle del Cálculo de Comensales Estimados
                <small className="text-muted ms-2">
                  ({dinersCalculated.fecha})
                </small>
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                {dinersCalculated.servicios?.map((servicio, index) => (
                  <div key={index} className="col-md-4 mb-3">
                    <div className="border rounded p-3">
                      <h6 className="text-primary">
                        <i className="fas fa-utensils me-1"></i>
                        {servicio.nombreServicio}
                      </h6>
                      <p className="mb-1">
                        <strong>Total: {servicio.totalComensales}</strong>
                      </p>
                      {servicio.turnos?.map((turno, tIndex) => (
                        <div key={tIndex} className="small text-muted">
                          <strong>{turno.turno}:</strong> {turno.comensales}{" "}
                          estudiantes
                          <div className="ms-2">
                            {turno.grados?.map((grado, gIndex) => (
                              <div key={gIndex} className="text-xs">
                                • {grado.grado}: {grado.cantidadEstudiantes}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="alert alert-info mt-3">
                <div>
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Total de comensales para el día:</strong>{" "}
                  <strong>{dinersCalculated.resumen?.totalDia}</strong>
                  <small className="d-block mt-1 me-2">
                    Este cálculo se basa en la matrícula actual de estudiantes
                    por grado y turno.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            <i className="fas fa-times me-2"></i>
            {isViewMode ? "Cerrar" : "Cancelar"}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  {mode === "create"
                    ? "Crear Planificación"
                    : "Guardar Cambios"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PlanificacionMenuForm;
