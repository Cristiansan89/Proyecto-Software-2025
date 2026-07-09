import { useState, useEffect } from "react";
import Select from "react-select";
import alumnoGradoService from "../../services/alumnoGradoService.js";
import { gradoService } from "../../services/gradoService.js";
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

const AlumnoGradoForm = ({ alumnoGrado, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    idPersona: alumnoGrado?.idPersona || "",
    nombreGrado: alumnoGrado?.nombreGrado || "",
    cicloLectivo: alumnoGrado?.cicloLectivo || new Date().getFullYear(),
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [alumnos, setAlumnos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [cicloInput, setCicloInput] = useState(
    alumnoGrado?.cicloLectivo ||
      alumnoGrado?.ciclo_lectivo ||
      new Date().getFullYear(),
  );
  const isEditMode = mode === "edit";

  // Cargar opciones al montar el componente
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [alumnosData, gradosData] = await Promise.all([
          alumnoGradoService.getAlumnosDisponibles(cicloInput),
          gradoService.getActivos(),
        ]);

        // Normalizar estructura de alumnos para evitar discrepancias de nombres de campo
        const normalized = Array.isArray(alumnosData)
          ? alumnosData.map((a) => ({
              id: a.idPersona ?? a.id_persona ?? a.id ?? null,
              nombre: a.nombre ?? a.firstName ?? a.nombrePersona ?? "",
              apellido: a.apellido ?? a.lastName ?? a.apellidoPersona ?? "",
              dni: a.dni ?? a.numeroDocumento ?? a.doc ?? "",
            }))
          : [];

        setAlumnos(normalized);
        setGrados(gradosData.filter((g) => g.estado === "Activo"));
      } catch (error) {
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [cicloInput, mode]);

  // Debounce input for cicloLectivo to avoid reloading options on every keystroke
  useEffect(() => {
    if (!alumnoGrado) {
      const t = setTimeout(() => {
        setFormData((prev) => ({ ...prev, cicloLectivo: cicloInput }));
      }, 400);
      return () => clearTimeout(t);
    }
  }, [cicloInput, alumnoGrado]);

  // Ensure formData and cicloInput reflect the prop when opening in edit mode
  useEffect(() => {
    if (alumnoGrado) {
      let cicloValue =
        alumnoGrado.cicloLectivo ??
        alumnoGrado.ciclo_lectivo ??
        new Date().getFullYear();
      // Si cicloValue es una fecha tipo '2025-01-01T03:00:00.000Z', extraer el año
      if (
        typeof cicloValue === "string" &&
        cicloValue.length >= 4 &&
        cicloValue.match(/\d{4}-\d{2}-\d{2}/)
      ) {
        cicloValue = new Date(cicloValue).getFullYear();
      }
      setFormData((prev) => ({
        ...prev,
        idPersona:
          alumnoGrado.idPersona ?? alumnoGrado.id_persona ?? prev.idPersona,
        nombreGrado:
          alumnoGrado.nombreGrado ??
          alumnoGrado.nombre_grado ??
          prev.nombreGrado,
        cicloLectivo: cicloValue,
      }));
      setCicloInput(cicloValue);
    }
  }, [alumnoGrado]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // For cicloLectivo, update a local input state to debounce API calls
    if (name === "cicloLectivo") {
      setCicloInput(value);

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.idPersona) {
      newErrors.idPersona = "Debe seleccionar un alumno";
    }

    if (!formData.nombreGrado) {
      newErrors.nombreGrado = "Debe seleccionar un grado";
    }

    if (!formData.cicloLectivo) {
      newErrors.cicloLectivo = "El ciclo lectivo es requerido";
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
      let result;
      if (mode === "create") {
        result = await alumnoGradoService.create({
          idPersona: parseInt(formData.idPersona),
          nombreGrado: formData.nombreGrado,
          cicloLectivo: formData.cicloLectivo,
        });
      } else {
        result = await alumnoGradoService.update(alumnoGrado.idAlumnoGrado, {
          idPersona: parseInt(formData.idPersona),
          nombreGrado: formData.nombreGrado,
          cicloLectivo: formData.cicloLectivo,
        });
      }

      // Normalizar cicloLectivo en la respuesta para evitar formatos ISO con hora
      const normalizeCycle = (obj) => {
        if (!obj) return obj;
        const target = obj.data ? obj.data : obj;
        let cv = target.cicloLectivo ?? target.ciclo_lectivo;
        if (cv) {
          if (typeof cv === "string") {
            // Si viene como ISO datetime o YYYY-MM-DD, extraer año
            if (cv.includes("T") || cv.match(/\d{4}-\d{2}-\d{2}/)) {
              try {
                target.cicloLectivo = new Date(cv).getFullYear();
              } catch (e) {
                target.cicloLectivo = cv;
              }
            } else {
              target.cicloLectivo = cv;
            }
          } else if (typeof cv === "object" && cv instanceof Date) {
            target.cicloLectivo = cv.getFullYear();
          } else {
            target.cicloLectivo = cv;
          }
        }
        return obj;
      };

      result = normalizeCycle(result);

      onSave(result);
    } catch (error) {
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
          "Error al guardar la asignación. Por favor, inténtelo de nuevo.",
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
        <i className="fas fa-info-circle me-2"></i>Asignación de Alumno a Grado
      </h4>

      <div className={ComponenteStyle.formRow}>
        <div className={ComponenteStyle.formGroup}>
          <label
            htmlFor="idPersona"
            className={`${ComponenteStyle.formLabel} required`}
          >
            Alumno
          </label>
          {isCreateMode ? (
            <Select
              isDisabled={isViewMode}
              isClearable
              options={alumnos
                .filter((a) => a.id !== null && a.id !== undefined)
                .map((alumno) => ({
                  value: alumno.id,
                  label: `${alumno.nombre} ${alumno.apellido} - DNI: ${alumno.dni}`,
                }))}
              value={
                alumnos
                  .filter((a) => a.id !== null && a.id !== undefined)
                  .map((alumno) => ({
                    value: alumno.id,
                    label: `${alumno.nombre} ${alumno.apellido} - DNI: ${alumno.dni}`,
                  }))
                  .find(
                    (o) => String(o.value) === String(formData.idPersona),
                  ) || null
              }
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  idPersona: opt ? opt.value : "",
                }))
              }
              placeholder="Buscar y seleccionar alumno..."
            />
          ) : (
            <input
              type="text"
              className={ComponenteStyle.formControl}
              value={
                alumnos.find((a) => String(a.id) === String(formData.idPersona))
                  ? `${
                      alumnos.find(
                        (a) => String(a.id) === String(formData.idPersona),
                      ).nombre
                    } ${
                      alumnos.find(
                        (a) => String(a.id) === String(formData.idPersona),
                      ).apellido
                    } - DNI: ${
                      alumnos.find(
                        (a) => String(a.id) === String(formData.idPersona),
                      ).dni
                    }`
                  : `${alumnoGrado?.nombre || ""} ${
                      alumnoGrado?.apellido || ""
                    }`
              }
              readOnly
            />
          )}
          {errors.idPersona && (
            <div className={ComponenteStyle.invalidFeedback}>
              {errors.idPersona}
            </div>
          )}
          {formData.idPersona && (
            <small className={`${ComponenteStyle.formText} text-muted`}>
              <i className="fas fa-info-circle me-1"></i>
              Solo se muestran alumnos disponibles para el ciclo lectivo actual
            </small>
          )}
        </div>

        <div className={ComponenteStyle.formGroup}>
          <label
            htmlFor="nombreGrado"
            className={`${ComponenteStyle.formLabel} required`}
          >
            Grado
          </label>
          <Select
            isDisabled={isViewMode}
            isClearable
            options={grados.map((grado) => ({
              value: grado.nombreGrado,
              label: grado.nombreGrado,
            }))}
            value={
              grados
                .map((grado) => ({
                  value: grado.nombreGrado,
                  label: grado.nombreGrado,
                }))
                .find((o) => o.value === formData.nombreGrado) || null
            }
            onChange={(opt) =>
              setFormData((prev) => ({
                ...prev,
                nombreGrado: opt ? opt.value : "",
              }))
            }
            placeholder="Seleccionar Grado..."
          />
          {errors.nombreGrado && (
            <div className={ComponenteStyle.invalidFeedback}>
              {errors.nombreGrado}
            </div>
          )}
        </div>
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="cicloLectivo"
          className={`${ComponenteStyle.formLabel} required`}
        >
          Ciclo Lectivo
        </label>
        <input
          type="number"
          id="cicloLectivo"
          name="cicloLectivo"
          className={`${ComponenteStyle.formControl} ${errors.cicloLectivo ? ComponenteStyle.isInvalid : ""}`}
          value={cicloInput}
          onChange={handleInputChange}
          disabled={isViewMode || isEditMode}
          min="2020"
          max="2030"
        />
        {errors.cicloLectivo && (
          <div className={ComponenteStyle.invalidFeedback}>
            {errors.cicloLectivo}
          </div>
        )}
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
                {isCreateMode ? "Asignar Alumno" : "Actualizar Asignación"}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default AlumnoGradoForm;
