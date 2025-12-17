import { useState, useEffect } from "react";
import Select from "react-select";
import alumnoGradoService from "../../services/alumnoGradoService.js";
import { gradoService } from "../../services/gradoService.js";

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
      new Date().getFullYear()
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
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        alert(`Errores de validación:\n${errorMessages}`);
      } else {
        alert("Error al guardar la asignación. Por favor, inténtelo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  if (loadingOptions) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="alumno-grado-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          <div>
            <h5 className="section-title">Asignación de Alumno a Grado</h5>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="idPersona" className="form-label required ">
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
                          (o) => String(o.value) === String(formData.idPersona)
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
                    className="form-control"
                    value={
                      alumnos.find(
                        (a) => String(a.id) === String(formData.idPersona)
                      )
                        ? `${
                            alumnos.find(
                              (a) => String(a.id) === String(formData.idPersona)
                            ).nombre
                          } ${
                            alumnos.find(
                              (a) => String(a.id) === String(formData.idPersona)
                            ).apellido
                          } - DNI: ${
                            alumnos.find(
                              (a) => String(a.id) === String(formData.idPersona)
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
                  <div className="invalid-feedback">{errors.idPersona}</div>
                )}
                {formData.idPersona && (
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Solo se muestran alumnos disponibles para el ciclo lectivo
                    actual
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="nombreGrado" className="form-label required ">
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
                  <div className="invalid-feedback">{errors.nombreGrado}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cicloLectivo" className="form-label required ">
                Ciclo Lectivo
              </label>
              <input
                type="number"
                id="cicloLectivo"
                name="cicloLectivo"
                className={`form-control ${
                  errors.cicloLectivo ? "is-invalid" : ""
                }`}
                value={cicloInput}
                onChange={handleInputChange}
                disabled={isViewMode || isEditMode}
                min="2020"
                max="2030"
              />
              {errors.cicloLectivo && (
                <div className="invalid-feedback">{errors.cicloLectivo}</div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="form-actions mt-4">
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
                  {isCreateMode ? "Asignar Alumno" : "Actualizar Asignación"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AlumnoGradoForm;
