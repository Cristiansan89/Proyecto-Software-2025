import { useState, useEffect } from "react";
import gradoService from "../../services/gradoService";
import turnoService from "../../services/turnoService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ComponenteStyle from "../../styles/Componentes.module.css";

const GradoForm = ({ grado, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombreGrado: grado?.nombreGrado || "",
    idTurno: grado?.idTurno || "",
    estado: grado?.estado || "Activo",
  });

  const [turnos, setTurnos] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Cargar turnos al montar el componente
  useEffect(() => {
    const loadTurnos = async () => {
      try {
        const turnosData = await turnoService.getActivos();
        setTurnos(turnosData);
      } catch (error) {
      } finally {
        setLoadingTurnos(false);
      }
    };

    loadTurnos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Limpiar error del servidor cuando el usuario empiece a editar
    if (serverError) {
      setServerError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.nombreGrado.trim()) {
      newErrors.nombreGrado = "El nombre del grado es requerido";
    } else if (formData.nombreGrado.length < 2) {
      newErrors.nombreGrado = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.idTurno) {
      newErrors.idTurno = "Debe seleccionar un turno";
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
      if (mode === "create") {
        await gradoService.create(formData);
      } else {
        await gradoService.update(grado.idGrado, formData);
      }

      // Solo notificar éxito, no pasar datos
      // La recarga de datos será manejada por el componente padre
      onSave();
    } catch (error) {
      // Mostrar errores específicos
      if (error.response?.status === 409) {
        // Error de duplicación - mostrar solo en el alert del formulario
        setServerError(error.response?.data?.message || "El grado ya existe");
      } else if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach((err) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      } else if (error.response?.status === 404) {
        // Ignorar errores 404 durante update - la operación fue exitosa
        // solo puede fallar una llamada GET posterior del padre
        onSave();
        return;
      } else if (error.response?.data?.message) {
        setServerError(error.response.data.message);
        showError("Error", error.response.data.message);
      } else {
        showError(
          "Error",
          "Error al guardar el grado. Por favor, intente nuevamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <form onSubmit={handleSubmit}>
      <h4 className={ComponenteStyle.sectionTitle}>
        <i className="fas fa-info-circle me-2"></i>Información del Grado
      </h4>

      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="nombreGrado"
          className={`${ComponenteStyle.formLabel} required`}
        >
          Nombre del Grado
        </label>
        <input
          type="text"
          id="nombreGrado"
          name="nombreGrado"
          className={`${ComponenteStyle.formControl} ${errors.nombreGrado ? ComponenteStyle.isInvalid : ""}`}
          value={formData.nombreGrado}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Ej: 1° A, 1° B, 2° A, 3° A..."
        />
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="idTurno"
          className={`${ComponenteStyle.formLabel} required `}
        >
          Turno
        </label>
        {loadingTurnos ? (
          <div className={ComponenteStyle.formControl}>
            <i className="fas fa-spinner fa-spin me-2"></i>
            Cargando turnos...
          </div>
        ) : (
          <select
            id="idTurno"
            name="idTurno"
            className={`${ComponenteStyle.formControl} ${errors.idTurno ? ComponenteStyle.isInvalid : ""}`}
            value={formData.idTurno}
            onChange={handleInputChange}
            disabled={isViewMode}
          >
            <option value="">Seleccionar turno...</option>
            {turnos.map((turno) => (
              <option key={turno.idTurno} value={turno.idTurno}>
                {turno.nombre} ({turno.horaInicio} - {turno.horaFin})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="estado" className={`${ComponenteStyle.formLabel} `}>
          Estado del Grado
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
        <small className={`${ComponenteStyle.formText} text-muted`}>
          Los grados inactivos no aparecerán disponibles para nuevos registros
        </small>
      </div>

      {/* Mensaje de error */}
      {serverError && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {serverError}
        </div>
      )}

      {errors.nombreGrado && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.nombreGrado}
        </div>
      )}

      {errors.idTurno && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.idTurno}
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
                <span className="spinner-border spinner-border-sm me-2"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                {isCreateMode ? "Crear Grado" : "Actualizar Grado"}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default GradoForm;
