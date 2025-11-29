import { useState, useEffect } from "react";
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
  const [calculandoComensales, setCalculandoComensales] = useState(false);
  const [comensalesCalculados, setComensalesCalculados] = useState(null);
  const [mostrarDetalleComensales, setMostrarDetalleComensales] =
    useState(false);

  const estados = [
    { value: "Activo", label: "Activo" },
    { value: "Finalizado", label: "Finalizado" },
    { value: "Cancelado", label: "Cancelado" },
  ];

  const calcularComensalesAutomaticos = async () => {
    if (!formularioPlanificacion.fechaInicio) {
      alert("Por favor seleccione primero la fecha de inicio");
      return;
    }

    setCalculandoComensales(true);
    try {
      const datosComensales =
        await planificacionMenuService.calcularComensalesPorFecha(
          formularioPlanificacion.fechaInicio
        );

      setComensalesCalculados(datosComensales);

      // Actualizar el formulario con el total calculado
      const totalComensales = datosComensales.resumen?.totalDia || 0;
      onFormChange({
        target: {
          name: "comensalesEstimados",
          value: totalComensales.toString(),
        },
      });

      setMostrarDetalleComensales(true);
    } catch (error) {
      alert("Error al calcular comensales automáticamente: " + error.message);
    } finally {
      setCalculandoComensales(false);
    }
  };

  // Resetear comensales calculados cuando cambia el modal
  useEffect(() => {
    if (!visible) {
      setComensalesCalculados(null);
      setMostrarDetalleComensales(false);
    }
  }, [visible]);

  const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const datosParaEnviar = {
        ...formularioPlanificacion,
        id_usuario: user?.idUsuario || user?.id_usuario || null,
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
    <div className="modal-overlay">
      <div className="modal-contenedor">
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
                  Fecha de Inicio
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
                  Fecha de Fin
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
                <label htmlFor="estado" className="form-label">
                  Estado
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

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="comensalesEstimados" className="form-label">
                  Comensales Estimados
                </label>

                {modalTipo !== "ver" && (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={calcularComensalesAutomaticos}
                    disabled={
                      calculandoComensales ||
                      !formularioPlanificacion.fechaInicio
                    }
                    title="Calcular automáticamente según matrícula actual"
                  >
                    {calculandoComensales ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <i className="fas fa-calculator"></i>
                    )}
                    Obtener Comensales
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Detalles del cálculo de comensales */}
          {mostrarDetalleComensales && comensalesCalculados && (
            <div>
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">
                    <i className="fas fa-chart-bar me-2"></i>
                    Detalle del Cálculo de Comensales Estimados
                    <small className="text-muted ms-2">
                      ({comensalesCalculados.fecha})
                    </small>
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    {comensalesCalculados.servicios?.map((servicio, index) => (
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
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Total de comensales para el día:</strong>{" "}
                    <strong>{comensalesCalculados.resumen?.totalDia}</strong>
                    <div className="small mt-1">
                      Este cálculo se basa en la matrícula actual de estudiantes
                      por grado y turno.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
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
  );
};

export default PlanificacionMenuForm;
