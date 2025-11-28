import { useState, useEffect } from "react";
import Select from "react-select";
import docenteGradoService from "../../services/docenteGradoService.js";

const DocenteGradoForm = ({ docenteGrado, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    idPersona: docenteGrado?.idPersona || "",
    nombreGrado: docenteGrado?.nombreGrado || "",
    fechaAsignado:
      docenteGrado?.fechaAsignado || new Date().toISOString().split("T")[0],
    cicloLectivo: docenteGrado?.cicloLectivo || new Date().getFullYear(),
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [docentes, setDocentes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [cicloInput, setCicloInput] = useState(
    docenteGrado?.cicloLectivo ||
      docenteGrado?.ciclo_lectivo ||
      new Date().getFullYear()
  );
  const isEditMode = mode === "edit";

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [docentesData, gradosData] = await Promise.all([
          docenteGradoService.getDocentesDisponibles(cicloInput),
          docenteGradoService.getGradosDisponibles(cicloInput),
        ]);

        const normalizedDocentes = Array.isArray(docentesData)
          ? docentesData.map((d) => ({
              id: d.idPersona ?? d.id_persona ?? d.id ?? null,
              nombre: d.nombre ?? d.firstName ?? d.nombrePersona ?? "",
              apellido: d.apellido ?? d.lastName ?? d.apellidoPersona ?? "",
              dni: d.dni ?? d.numeroDocumento ?? d.doc ?? "",
            }))
          : [];

        setDocentes(normalizedDocentes);
        setGrados(Array.isArray(gradosData) ? gradosData : []);
      } catch (error) {
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [cicloInput, mode]);

  // Debounce ciclo input to avoid reloading on every keystroke
  useEffect(() => {
    if (!docenteGrado) {
      const t = setTimeout(() => {
        setFormData((prev) => ({ ...prev, cicloLectivo: cicloInput }));
      }, 400);
      return () => clearTimeout(t);
    }
  }, [cicloInput, docenteGrado]);

  // Sync formData and cicloInput from prop when editing
  useEffect(() => {
    if (docenteGrado) {
      let cicloValue =
        docenteGrado.cicloLectivo ??
        docenteGrado.ciclo_lectivo ??
        new Date().getFullYear();
      if (
        typeof cicloValue === "string" &&
        cicloValue.length >= 4 &&
        cicloValue.match(/\d{4}-\d{2}-\d{2}/)
      ) {
        cicloValue = new Date(cicloValue).getFullYear();
      }
      let fechaValue =
        docenteGrado.fechaAsignado ?? docenteGrado.fecha_asignado;
      // Si la fecha es inválida o vacía, usar la fecha actual
      if (!fechaValue || isNaN(new Date(fechaValue).getTime())) {
        fechaValue = new Date().toISOString().split("T")[0];
      } else {
        // Si viene en formato ISO completo (con hora), convertir a YYYY-MM-DD para el input type=date
        if (typeof fechaValue === "string" && fechaValue.includes("T")) {
          try {
            fechaValue = new Date(fechaValue).toISOString().split("T")[0];
          } catch (e) {
            fechaValue = new Date().toISOString().split("T")[0];
          }
        }
      }
      setFormData((prev) => ({
        ...prev,
        idPersona:
          docenteGrado.idPersona ?? docenteGrado.id_persona ?? prev.idPersona,
        nombreGrado:
          docenteGrado.nombreGrado ??
          docenteGrado.nombre_grado ??
          prev.nombreGrado,
        fechaAsignado: fechaValue,
        cicloLectivo: cicloValue,
      }));
      setCicloInput(cicloValue);
    }
  }, [docenteGrado]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "cicloLectivo") {
      setCicloInput(value);
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.idPersona)
      newErrors.idPersona = "Debe seleccionar un docente";
    if (!formData.nombreGrado)
      newErrors.nombreGrado = "Debe seleccionar un grado";
    if (!formData.fechaAsignado)
      newErrors.fechaAsignado = "La fecha de asignación es requerida";
    if (!formData.cicloLectivo)
      newErrors.cicloLectivo = "El ciclo lectivo es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let result;
      if (mode === "create") {
        result = await docenteGradoService.create({
          idPersona: parseInt(formData.idPersona),
          nombreGrado: formData.nombreGrado,
          fechaAsignado: formData.fechaAsignado,
          cicloLectivo: formData.cicloLectivo,
        });
      } else {
        result = await docenteGradoService.update(
          docenteGrado.idDocenteTitular,
          docenteGrado.idPersona,
          docenteGrado.nombreGrado,
          {
            newIdPersona: parseInt(formData.idPersona),
            newNombreGrado: formData.nombreGrado,
            fechaAsignado: formData.fechaAsignado,
            cicloLectivo: formData.cicloLectivo,
          }
        );
      }

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
    <div className="docente-grado-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          <div>
            <div className="form-group">
              <label htmlFor="idPersona" className="form-label required mt-3">
                Docente
              </label>
              {isCreateMode ? (
                <Select
                  isDisabled={isViewMode}
                  isClearable
                  options={docentes
                    .filter((d) => d.id !== null && d.id !== undefined)
                    .map((docente) => ({
                      value: docente.id,
                      label: `${docente.nombre} ${docente.apellido} - DNI: ${docente.dni}`,
                    }))}
                  value={
                    docentes
                      .filter((d) => d.id !== null && d.id !== undefined)
                      .map((docente) => ({
                        value: docente.id,
                        label: `${docente.nombre} ${docente.apellido} - DNI: ${docente.dni}`,
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
                  placeholder="Buscar y seleccionar docente..."
                />
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={
                    docentes.find(
                      (d) => String(d.id) === String(formData.idPersona)
                    )
                      ? `${
                          docentes.find(
                            (d) => String(d.id) === String(formData.idPersona)
                          ).nombre
                        } ${
                          docentes.find(
                            (d) => String(d.id) === String(formData.idPersona)
                          ).apellido
                        } - DNI: ${
                          docentes.find(
                            (d) => String(d.id) === String(formData.idPersona)
                          ).dni
                        }`
                      : `${docenteGrado?.nombre || ""}`
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
                  Solo se muestran docentes disponibles (sin grado asignado)
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nombreGrado" className="form-label required mt-3">
                Grado
              </label>
              <Select
                isDisabled={isViewMode}
                isClearable
                options={grados.map((g) => ({
                  value: g.nombreGrado,
                  label: `${g.nombreGrado} - ${g.turno || ""}`,
                }))}
                value={
                  grados
                    .map((g) => ({
                      value: g.nombreGrado,
                      label: `${g.nombreGrado} - ${g.turno || ""}`,
                    }))
                    .find((o) => o.value === formData.nombreGrado) || null
                }
                onChange={(opt) =>
                  setFormData((prev) => ({
                    ...prev,
                    nombreGrado: opt ? opt.value : "",
                  }))
                }
                placeholder="Seleccionar grado..."
              />

              {errors.nombreGrado && (
                <div className="invalid-feedback">{errors.nombreGrado}</div>
              )}
              {formData.nombreGrado && (
                <small className="form-text text-muted">
                  <i className="fas fa-warning me-1"></i>
                  Solo puede haber un docente por grado
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label
                  htmlFor="fechaAsignado"
                  className="form-label required mt-3"
                >
                  Fecha de Asignación
                </label>
                <input
                  type="date"
                  id="fechaAsignado"
                  name="fechaAsignado"
                  className={`form-control ${
                    errors.fechaAsignado ? "is-invalid" : ""
                  }`}
                  value={formData.fechaAsignado}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.fechaAsignado && (
                  <div className="invalid-feedback">{errors.fechaAsignado}</div>
                )}
              </div>

              <div className="form-group">
                <label
                  htmlFor="cicloLectivo"
                  className="form-label required mt-3"
                >
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
        </div>

        <div className="form-actions mt-4">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={onCancel}
            disabled={loading}
          >
            <i className="fas fa-times"></i>{" "}
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
                  <i className="fas fa-save"></i>{" "}
                  {isCreateMode ? "Asignar Docente" : "Actualizar Asignación"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DocenteGradoForm;
