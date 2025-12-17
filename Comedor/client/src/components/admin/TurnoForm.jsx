import { useState, useEffect } from "react";
import turnoService from "../../services/turnoService.js";

const TurnoForm = ({ turno, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: turno?.nombre || "",
    horaInicio: turno?.horaInicio || "",
    horaFin: turno?.horaFin || "",
    estado: turno?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value; // Variable para almacenar el valor procesado

    if (name === "nombre") {
      // Permitir solo letras y espacios en el campo nombre
      valorPermitido = value.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ\s]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: valorPermitido }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (formData.nombre.length > 16) {
      newErrors.nombre = "El nombre no puede tener más de 16 caracteres";
    }

    if (!formData.horaInicio.trim()) {
      newErrors.horaInicio = "La hora de inicio es requerida";
    }

    if (!formData.horaFin.trim()) {
      newErrors.horaFin = "La hora de fin es requerida";
    }

    // Validar que la hora de fin sea mayor que la hora de inicio
    if (formData.horaInicio && formData.horaFin) {
      if (formData.horaInicio >= formData.horaFin) {
        newErrors.horaFin =
          "La hora de fin debe ser mayor que la hora de inicio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar al backend
      const turnoData = {
        nombre: formData.nombre.trim(),
        horaInicio: formData.horaInicio + ":00", // Agregar segundos
        horaFin: formData.horaFin + ":00", // Agregar segundos
        estado: formData.estado,
      };

      let savedTurno;

      // Crear o actualizar turno
      if (mode === "create") {
        savedTurno = await turnoService.create(turnoData);
      } else {
        savedTurno = await turnoService.update(turno.idTurno, turnoData);
      }

      onSave(savedTurno);
    } catch (error) {
      // Mostrar error al usuario
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\\n");
        alert(`Errores de validación:\\n${errorMessages}`);
      } else {
        alert("Error al guardar el turno. Por favor, inténtelo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  // Convertir formato de hora de HH:MM:SS a HH:MM para los inputs
  useEffect(() => {
    if (turno) {
      setFormData({
        nombre: turno.nombre || "",
        horaInicio: turno.horaInicio ? turno.horaInicio.substring(0, 5) : "",
        horaFin: turno.horaFin ? turno.horaFin.substring(0, 5) : "",
        estado: turno.estado || "Activo",
      });
    }
  }, [turno]);

  return (
    <div className="turno-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Información del Turno */}
          <div>
            <h5 className="section-title">Información del Turno</h5>

            <div className="form-group">
              <label htmlFor="nombre" className="form-label required">
                Nombre del Turno
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
                value={formData.nombre}
                onChange={handleInputChange}
                disabled={isViewMode}
                placeholder="Ej: Mañana, Tarde, Noche"
                maxLength="16"
              />
              {errors.nombre && (
                <div className="invalid-feedback">{errors.nombre}</div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="horaInicio" className="form-label required">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  id="horaInicio"
                  name="horaInicio"
                  className={`form-control ${
                    errors.horaInicio ? "is-invalid" : ""
                  }`}
                  value={formData.horaInicio}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                />
                {errors.horaInicio && (
                  <div className="invalid-feedback">{errors.horaInicio}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="horaFin" className="form-label required">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  id="horaFin"
                  name="horaFin"
                  className={`form-control ${
                    errors.horaFin ? "is-invalid" : ""
                  }`}
                  value={formData.horaFin}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                />
                {errors.horaFin && (
                  <div className="invalid-feedback">{errors.horaFin}</div>
                )}
              </div>
            </div>

            {/* Estado */}
            <div className="form-group">
              <label htmlFor="estado" className="form-label">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                className="form-control"
                value={formData.estado}
                onChange={handleInputChange}
                disabled={isViewMode}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="form-actions mt-3">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={onCancel}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
            {isViewMode ? "Cerrar" : "Cancelar"}
          </button>

          {!isViewMode && (
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  {isCreateMode ? "Crear Turno" : "Actualizar Turno"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TurnoForm;
