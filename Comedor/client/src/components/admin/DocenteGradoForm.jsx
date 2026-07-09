import { useState, useEffect } from "react";
import Select from "react-select";
import docenteGradoService from "../../services/docenteGradoService.js";
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
      new Date().getFullYear(),
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
          },
        );
      }

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
        <i className="fas fa-info-circle me-2"></i>Asignación de Docente a Grado
      </h4>

      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="idPersona"
          className={`${ComponenteStyle.formLabel} required`}
        >
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
                .find((o) => String(o.value) === String(formData.idPersona)) ||
              null
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
            className={ComponenteStyle.formControl}
            value={
              docentes.find((d) => String(d.id) === String(formData.idPersona))
                ? `${
                    docentes.find(
                      (d) => String(d.id) === String(formData.idPersona),
                    ).nombre
                  } ${
                    docentes.find(
                      (d) => String(d.id) === String(formData.idPersona),
                    ).apellido
                  } - DNI: ${
                    docentes.find(
                      (d) => String(d.id) === String(formData.idPersona),
                    ).dni
                  }`
                : `${docenteGrado?.nombre || ""}`
            }
            readOnly
          />
        )}

        {errors.idPersona && (
          <div className={ComponenteStyle.invalidadFeedback}>
            {errors.idPersona}
          </div>
        )}
        {formData.idPersona && (
          <small className={`${ComponenteStyle.formText} text-muted`}>
            <i className="fas fa-info-circle me-1"></i>
            Solo se muestran docentes disponibles (sin grado asignado)
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
          <div className={ComponenteStyle.invalidadFeedback}>
            {errors.nombreGrado}
          </div>
        )}
        {formData.nombreGrado && (
          <small className={`${ComponenteStyle.formText} text-muted`}>
            <i className="fas fa-warning me-1"></i>
            Solo puede haber un docente por grado
          </small>
        )}
      </div>

      <div className={ComponenteStyle.formRow}>
        <div className={ComponenteStyle.formGroup}>
          <label
            htmlFor="fechaAsignado"
            className={`${ComponenteStyle.formLabel} required`}
          >
            Fecha de Asignación
          </label>
          <input
            type="date"
            id="fechaAsignado"
            name="fechaAsignado"
            className={`${ComponenteStyle.formControl} ${
              errors.fechaAsignado ? ComponeneteStyle.isInvalid : ""
            }`}
            value={formData.fechaAsignado}
            onChange={handleInputChange}
            disabled={isViewMode}
            max={new Date().toISOString().split("T")[0]}
          />
          {errors.fechaAsignado && (
            <div className={ComponenteStyle.invalidFeedback}>
              {errors.fechaAsignado}
            </div>
          )}
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
            className={`${ComponenteStyle.formControl} ${
              errors.cicloLectivo ? ComponenteStyle.isInvalid : ""
            }`}
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
      </div>

      <div className={ComponenteStyle.formActions}>
        <button
          type="button"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
          onClick={onCancel}
          disabled={loading}
        >
          <i className="fas fa-times"></i> {isViewMode ? "Cerrar" : "Cancelar"}
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
                <i className="fas fa-save"></i>{" "}
                {isCreateMode ? "Asignar Docente" : "Actualizar Asignación"}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default DocenteGradoForm;
