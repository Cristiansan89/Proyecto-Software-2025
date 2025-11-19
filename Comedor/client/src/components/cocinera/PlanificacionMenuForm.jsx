import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import planificacionMenuService from "../../services/planificacionMenuService";

const PlanificacionMenuForm = ({
  visible,
  modalTipo,
  planificacionSeleccionada,
  formularioPlanificacion,
  onFormChange,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const estados = [
    { value: "Activo", label: "Activo" },
    { value: "Finalizado", label: "Finalizado" },
    { value: "Cancelado", label: "Cancelado" },
  ];

  const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const datosParaEnviar = {
        ...formularioPlanificacion,
        id_usuario: user.id_usuario,
        comensalesEstimados:
          parseInt(formularioPlanificacion.comensalesEstimados) || 0,
        estado: formularioPlanificacion.estado || "Activo",
      };

      let resultado;
      if (modalTipo === "crear") {
        resultado = await planificacionMenuService.create(datosParaEnviar);
        alert("Planificación creada exitosamente");
      } else {
        resultado = await planificacionMenuService.update(
          planificacionSeleccionada.id_planificacion,
          datosParaEnviar
        );
        alert("Planificación actualizada exitosamente");
      }

      onSuccess();
    } catch (error) {
      alert(
        "Error al guardar la planificación: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div>
      <div className="modal-overlay">
        <div>
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-calendar-alt me-2"></i>
              {modalTipo === "crear"
                ? "Nueva Planificación"
                : modalTipo === "editar"
                ? "Editar Planificación"
                : "Detalles de Planificación"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form id="formPlanificacion" onSubmit={manejarSubmitFormulario}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="fechaInicio" className="form-label">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="fechaInicio"
                    name="fechaInicio"
                    value={formularioPlanificacion.fechaInicio}
                    onChange={onFormChange}
                    required
                    readOnly={modalTipo === "ver"}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="fechaFin" className="form-label">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="fechaFin"
                    name="fechaFin"
                    value={formularioPlanificacion.fechaFin}
                    onChange={onFormChange}
                    required
                    readOnly={modalTipo === "ver"}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="comensalesEstimados" className="form-label">
                    Comensales *
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="comensalesEstimados"
                    name="comensalesEstimados"
                    value={formularioPlanificacion.comensalesEstimados}
                    onChange={onFormChange}
                    min="1"
                    required
                    readOnly={modalTipo === "ver"}
                    placeholder="Ej: 150"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="estado" className="form-label">
                    Estado *
                  </label>
                  <select
                    className="form-control"
                    id="estado"
                    name="estado"
                    value={formularioPlanificacion.estado || "Activo"}
                    onChange={onFormChange}
                    required
                    disabled={modalTipo === "ver"}
                  >
                    <option value="">-- Seleccionar estado --</option>
                    {estados.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {modalTipo === "ver" ? "Cerrar" : "Cancelar"}
            </button>
            {modalTipo !== "ver" && (
              <button
                type="submit"
                className="btn btn-primary"
                form="formPlanificacion"
                disabled={loading}
                onClick={manejarSubmitFormulario}
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
                    {modalTipo === "crear"
                      ? "Crear Planificación"
                      : "Guardar Cambios"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanificacionMenuForm;
