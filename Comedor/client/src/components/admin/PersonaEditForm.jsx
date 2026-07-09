import { useState } from "react";
import personaService from "../../services/personaService.js";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showInfoError,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ComponenteStyle from "../../styles/Componentes.module.css";

const PersonaForm = ({ persona, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: persona?.nombre || "",
    apellido: persona?.apellido || "",
    dni: persona?.dni || "",
    fechaNacimiento: persona?.fechaNacimiento
      ? persona.fechaNacimiento.split("T")[0]
      : "",
    genero: persona?.genero || "",
    estado: persona?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value;

    if (name === "nombre" || name === "apellido") {
      // Permitir solo letras y espacios en los campos nombre y apellido
      valorPermitido = value.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ\s]/g, "");
    } else if (name === "dni") {
      // Permitir solo números en el campo dni
      const soloNumeros = value.replace(/[^0-9]/g, "");
      valorPermitido = soloNumeros.slice(0, 8); // Máximo 8 caracteres
    }

    setFormData((prev) => ({
      ...prev,
      [name]: valorPermitido,
    }));
    // Clear any validation error for this field while the user types
    setErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      return { ...prev, [name]: undefined };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El número de documento es requerido";
    } else if (formData.dni.length < 6) {
      newErrors.dni = "El documento debe tener al menos 6 caracteres";
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = "La fecha de nacimiento es requerida";
    } else {
      const fechaNac = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNac.getFullYear();
      if (edad < 3 || edad > 100) {
        newErrors.fechaNacimiento = "La edad debe estar entre 3 y 100 años";
      }
    }

    if (!formData.genero) {
      newErrors.genero = "El género es requerido";
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
      const personaData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: formData.dni.trim(),
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        estado: formData.estado,
      };

      let savedPersona;

      // Actualizar persona
      savedPersona = await personaService.update(
        persona.idPersona,
        personaData,
      );

      // Pasar datos al callback del componente padre
      if (onSave) {
        onSave(savedPersona);
        // No llamar onCancel aquí, el componente padre se encargará de cerrar
      }
    } catch (error) {
      // Mostrar error al usuario
      if (error.response?.data?.message) {
        showInfoError("Información", `Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        showInfoError(
          "Información",
          `Errores de validación:\n${errorMessages}`,
        );
      } else {
        showError(
          "Error",
          "Error al guardar la persona. Por favor, inténtelo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";

  return (
    <form onSubmit={handleSubmit}>
      <h4 className={ComponenteStyle.sectionTitle}>
        <i className="fas fa-user-edit me-2"></i>
        Información Personal
      </h4>
      <div className={ComponenteStyle.formGrid}>
        <div className={ComponenteStyle.formRow}>
          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="nombre"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className={`${ComponenteStyle.formControl} ${errors.nombre ? ComponenteStyle.isInvalid : ""}`}
              value={formData.nombre}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="Ingrese el nombre"
            />
            {errors.nombre && (
              <div className={ComponenteStyle.invalidFeedback}>
                {errors.nombre}
              </div>
            )}
          </div>

          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="apellido"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Apellido
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              className={`${ComponenteStyle.formControl} ${errors.apellido ? ComponenteStyle.isInvalid : ""}`}
              value={formData.apellido}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="Ingrese el apellido"
            />
            {errors.apellido && (
              <div className={ComponenteStyle.invalidFeedback}>
                {errors.apellido}
              </div>
            )}
          </div>
        </div>

        <div className={ComponenteStyle.formRow}>
          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="dni"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Número de Documento
            </label>
            <input
              type="text"
              id="dni"
              name="dni"
              className={`${ComponenteStyle.formControl} ${errors.dni ? ComponenteStyle.isInvalid : ""}`}
              value={formData.dni}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="Ingrese el número de documento"
            />
            {errors.dni && (
              <div className={ComponenteStyle.invalidFeedback}>
                {errors.dni}
              </div>
            )}
          </div>

          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="fechaNacimiento"
              className={ComponenteStyle.formLabel}
            >
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              className={`${ComponenteStyle.formControl} ${errors.fechaNacimiento ? ComponenteStyle.isInvalid : ""}`}
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              disabled={isViewMode}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.fechaNacimiento && (
              <div className={ComponenteStyle.invalidFeedback}>
                {errors.fechaNacimiento}
              </div>
            )}
          </div>
        </div>

        <div className={ComponenteStyle.formRow}>
          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="genero"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Género
            </label>
            <select
              id="genero"
              name="genero"
              className={`${ComponenteStyle.formControl} ${errors.genero ? ComponenteStyle.isInvalid : ""}`}
              value={formData.genero}
              onChange={handleInputChange}
              disabled={isViewMode}
            >
              <option value="">Seleccionar Género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenina">Femenina</option>
              <option value="Otros">Otros</option>
            </select>
            {errors.genero && (
              <div className={ComponenteStyle.invalidFeedback}>
                {errors.genero}
              </div>
            )}
          </div>

          <div className={ComponenteStyle.formGroup}>
            <label htmlFor="estado" className={ComponenteStyle.formLabel}>
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              className={`${ComponenteStyle.formControl} ${errors.estado ? ComponenteStyle.isInvalid : ""}`}
              value={formData.estado}
              onChange={handleInputChange}
              disabled={isViewMode}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

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
                  Actualizar Persona
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default PersonaForm;
