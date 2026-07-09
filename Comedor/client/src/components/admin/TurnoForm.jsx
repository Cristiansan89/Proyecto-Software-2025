import { useState, useEffect } from "react";
import turnoService from "../../services/turnoService.js";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ComponenteStyle from "../../styles/Componentes.module.css";

const TurnoForm = ({ turno, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: turno?.nombre || "",
    horaInicio: turno?.horaInicio || "",
    horaFin: turno?.horaFin || "",
    estado: turno?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
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
    setServerError(null);

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
      console.error("Error completo:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);

      let errorMessage = "";

      // Intentar extraer el mensaje de error de diferentes estructuras
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error.response?.data === "string") {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log("Mensaje de error extraído:", errorMessage);

      // Verificar si es un error de duplicidad
      if (
        errorMessage.toLowerCase().includes("existe") &&
        errorMessage.toLowerCase().includes("turno")
      ) {
        setServerError("Ya existe un turno con este nombre");
      } else if (errorMessage) {
        setServerError(errorMessage);
      } else {
        setServerError(
          "Error al guardar el turno. Por favor, inténtelo de nuevo.",
        );
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
    <form onSubmit={handleSubmit}>
      <h4 className={ComponenteStyle.sectionTitle}>
        <i className="fas fa-info-circle me-2"></i>
        Información del Turno
      </h4>
      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="nombre"
          className={`${ComponenteStyle.formLabel} required`}
        >
          Nombre del Turno
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          className={`${ComponenteStyle.formControl} ${errors.nombre ? ComponenteStyle.isInvalid : ""}`}
          value={formData.nombre}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Ej: Mañana, Tarde, Noche"
          maxLength="16"
        />
        {errors.nombre && (
          <div className={`${ComponenteStyle.invalidFeedback}`}>
            {errors.nombre}
          </div>
        )}
      </div>

      <div className={ComponenteStyle.formRow}>
        <div className={ComponenteStyle.formGroup} mt-2>
          <label
            htmlFor="horaInicio"
            className={`${ComponenteStyle.formLabel} required`}
          >
            Hora de Inicio
          </label>
          <input
            type="time"
            id="horaInicio"
            name="horaInicio"
            className={`${ComponenteStyle.formControl} ${errors.horaInicio ? ComponenteStyle.isInvalid : ""}`}
            value={formData.horaInicio}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          {errors.horaInicio && (
            <div className={`${ComponenteStyle.invalidFeedback}`}>
              {errors.horaInicio}
            </div>
          )}
        </div>

        <div className={ComponenteStyle.formGroup} mt-2>
          <label
            htmlFor="horaFin"
            className={`${ComponenteStyle.formLabel} required`}
          >
            Hora de Fin
          </label>
          <input
            type="time"
            id="horaFin"
            name="horaFin"
            className={`${ComponenteStyle.formControl} ${errors.horaFin ? ComponenteStyle.isInvalid : ""}`}
            value={formData.horaFin}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          {errors.horaFin && (
            <div className={`${ComponenteStyle.invalidFeedback}`}>
              {errors.horaFin}
            </div>
          )}
        </div>
      </div>

      {/* Estado */}
      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="estado" className={`${ComponenteStyle.formLabel}`}>
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          className={`${ComponenteStyle.formControl}`}
          value={formData.estado}
          onChange={handleInputChange}
          disabled={isViewMode}
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      {/* Mostrar error del servidor */}
      {serverError && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-3"
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error al guardar:</strong>
          <div
            className="me-1"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {serverError}
          </div>
        </div>
      )}

      {/* Botones */}
      <div className={ComponenteStyle.formActions}>
        <button
          type="button"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
          onClick={onCancel}
          disabled={loading}
        >
          <i className="fas fa-times"></i>
          {isViewMode ? "Cerrar" : "Cancelar"}
        </button>

        {!isViewMode && (
          <button
            type="submit"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                <p>Guardando...</p>
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
  );
};

export default TurnoForm;
