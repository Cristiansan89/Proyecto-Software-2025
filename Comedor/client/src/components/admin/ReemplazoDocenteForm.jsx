import { useState, useEffect } from "react";
import Select from "react-select";
import reemplazoDocenteService from "../../services/reemplazoDocenteService.js";
import { showSuccess, showError, showWarning, showInfo, showToast, showConfirm } from "../../utils/alertService";

const ReemplazoDocenteForm = ({ reemplazo, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    idPersona: reemplazo?.idPersona || "",
    idDocenteTitular: reemplazo?.idDocenteTitular || "",
    nombreGrado: reemplazo?.nombreGrado || "",
    cicloLectivo: reemplazo?.cicloLectivo || new Date().getFullYear(),
    fechaInicio:
      reemplazo?.fechaInicio || new Date().toISOString().split("T")[0],
    fechaFin: reemplazo?.fechaFin || "",
    motivo: reemplazo?.motivo || "",
    estado: reemplazo?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [suplentes, setSuplentes] = useState([]);
  const [titulares, setTitulares] = useState([]);
  const [options, setOptions] = useState({ motivos: [], estados: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [searchSuplente, setSearchSuplente] = useState("");
  const [searchTitular, setSearchTitular] = useState("");
  const [cicloInput, setCicloInput] = useState(
    reemplazo?.cicloLectivo ||
      reemplazo?.ciclo_lectivo ||
      new Date().getFullYear()
  );
  const isEditMode = mode === "edit";

  // Debounce cicloInput to avoid reloading options on every keystroke
  useEffect(() => {
    if (!reemplazo) {
      const t = setTimeout(() => {
        setFormData((prev) => ({ ...prev, cicloLectivo: cicloInput }));
      }, 400);
      return () => clearTimeout(t);
    }
  }, [cicloInput, reemplazo]);

  // Sync formData and cicloInput from prop when editing an existing reemplazo
  useEffect(() => {
    if (reemplazo) {
      let cicloValue =
        reemplazo.cicloLectivo ??
        reemplazo.ciclo_lectivo ??
        new Date().getFullYear();
      if (
        typeof cicloValue === "string" &&
        cicloValue.length >= 4 &&
        cicloValue.match(/\d{4}-\d{2}-\d{2}/)
      ) {
        cicloValue = new Date(cicloValue).getFullYear();
      }
      let fechaInicioValue =
        reemplazo.fechaInicio ??
        reemplazo.fecha_inicio ??
        new Date().toISOString().split("T")[0];
      // Si viene en formato ISO con hora, convertir a YYYY-MM-DD
      if (
        typeof fechaInicioValue === "string" &&
        fechaInicioValue.includes("T")
      ) {
        try {
          fechaInicioValue = new Date(fechaInicioValue)
            .toISOString()
            .split("T")[0];
        } catch (e) {
          fechaInicioValue = new Date().toISOString().split("T")[0];
        }
      }
      setFormData((prev) => ({
        ...prev,
        idPersona:
          reemplazo.idPersona ?? reemplazo.id_persona ?? prev.idPersona,
        idDocenteTitular:
          reemplazo.idDocenteTitular ??
          reemplazo.id_docente_titular ??
          prev.idDocenteTitular,
        nombreGrado:
          reemplazo.nombreGrado ?? reemplazo.nombre_grado ?? prev.nombreGrado,
        fechaInicio: fechaInicioValue,
        fechaFin: reemplazo.fechaFin ?? reemplazo.fecha_fin ?? prev.fechaFin,
        motivo: reemplazo.motivo ?? prev.motivo,
        estado: reemplazo.estado ?? prev.estado,
        cicloLectivo: cicloValue,
      }));
      setCicloInput(cicloValue);
    }
  }, [reemplazo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "cicloLectivo") {
      setCicloInput(value);
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const v = {};
    if (!formData.idPersona) v.idPersona = "Docente suplente requerido";
    if (!formData.idDocenteTitular)
      v.idDocenteTitular = "Docente titular requerido";
    if (!formData.fechaInicio) v.fechaInicio = "Fecha inicio requerida";
    if (!formData.motivo) v.motivo = "Motivo requerido";
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  // Cargar opciones al montar el componente
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [suplentesData, titularesData, optionsData] = await Promise.all([
          reemplazoDocenteService.getDocentesSupletesDisponibles(),
          reemplazoDocenteService.getDocentesTitulares(cicloInput),
          reemplazoDocenteService.getOptions(),
        ]);

        // Normalizar suplentes
        const normalizedSuplentes = Array.isArray(suplentesData)
          ? suplentesData.map((s) => ({
              id: s.idPersona ?? s.id_persona ?? s.id ?? null,
              nombre: s.nombre ?? s.firstName ?? s.nombrePersona ?? "",
              apellido: s.apellido ?? s.lastName ?? s.apellidoPersona ?? "",
              dni: s.dni ?? s.numeroDocumento ?? s.doc ?? "",
            }))
          : [];

        // Normalizar titulares (mantener nombreGrado si existe)
        const normalizedTitulares = Array.isArray(titularesData)
          ? titularesData.map((t) => ({
              id:
                t.idDocenteTitular ??
                t.idDocente ??
                t.idPersona ??
                t.id ??
                null,
              nombre: t.nombre ?? t.firstName ?? "",
              apellido: t.apellido ?? t.lastName ?? "",
              nombreGrado:
                t.nombreGrado ?? t.grado ?? t.nombreGradoAsignado ?? "",
            }))
          : [];

        setSuplentes(normalizedSuplentes);
        setTitulares(normalizedTitulares);
        setOptions(optionsData);
      } catch (error) {
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [cicloInput, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        idPersona: parseInt(formData.idPersona),
        idDocenteTitular: parseInt(formData.idDocenteTitular),
        nombreGrado: formData.nombreGrado,
        cicloLectivo: formData.cicloLectivo,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || null,
        motivo: formData.motivo,
        estado: formData.estado,
      };

      let result;
      if (mode === "create") {
        result = await reemplazoDocenteService.create(submitData);
      } else {
        result = await reemplazoDocenteService.update(
          reemplazo.idReemplazoDocente,
          {
            idPersona: parseInt(formData.idPersona),
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin || null,
            motivo: formData.motivo,
            estado: formData.estado,
          }
        );
      }

      onSave(result);
    } catch (error) {
      if (error.response?.data?.message) {
        showInfo("Información", `Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        showInfo("Información", `Errores de validación:\n${errorMessages}`);
      } else {
        showError("Error", "Error al guardar el reemplazo. Por favor, inténtelo de nuevo.");
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
    <div className="reemplazo-docente-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          <div>
            <h5 className="section-title">Reemplazo de Docente</h5>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="idPersona" className="form-label required">
                  Docente Suplente
                </label>
                {isCreateMode ? (
                  <Select
                    isDisabled={isViewMode}
                    isClearable
                    options={suplentes
                      .filter((s) => s.id !== null && s.id !== undefined)
                      .map((suplente) => ({
                        value: suplente.id,
                        label: `${suplente.nombre} ${suplente.apellido} - DNI: ${suplente.dni}`,
                      }))}
                    value={
                      suplentes
                        .filter((s) => s.id !== null && s.id !== undefined)
                        .map((suplente) => ({
                          value: suplente.id,
                          label: `${suplente.nombre} ${suplente.apellido} - DNI: ${suplente.dni}`,
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
                    placeholder="Buscar y seleccionar docente suplente..."
                  />
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={
                      suplentes.find(
                        (s) => String(s.id) === String(formData.idPersona)
                      )
                        ? `${
                            suplentes.find(
                              (s) => String(s.id) === String(formData.idPersona)
                            ).nombre
                          } ${
                            suplentes.find(
                              (s) => String(s.id) === String(formData.idPersona)
                            ).apellido
                          } - DNI: ${
                            suplentes.find(
                              (s) => String(s.id) === String(formData.idPersona)
                            ).dni
                          }`
                        : ""
                    }
                    readOnly
                  />
                )}
                {errors.idPersona && (
                  <div className="invalid-feedback">{errors.idPersona}</div>
                )}
              </div>
              <div className="form-group">
                <label
                  htmlFor="idDocenteTitular"
                  className="form-label required "
                >
                  Docente Titular a Reemplazar
                </label>
                {isCreateMode ? (
                  <Select
                    isDisabled={isViewMode}
                    isClearable
                    options={titulares
                      .filter((t) => t.id !== null && t.id !== undefined)
                      .map((titular) => ({
                        value: titular.id,
                        label: `${titular.nombre} ${titular.apellido} - ${titular.nombreGrado}`,
                      }))}
                    value={
                      titulares
                        .filter((t) => t.id !== null && t.id !== undefined)
                        .map((titular) => ({
                          value: titular.id,
                          label: `${titular.nombre} ${titular.apellido} - ${titular.nombreGrado}`,
                        }))
                        .find(
                          (o) =>
                            String(o.value) ===
                            String(formData.idDocenteTitular)
                        ) || null
                    }
                    onChange={(opt) => {
                      setFormData((prev) => ({
                        ...prev,
                        idDocenteTitular: opt ? opt.value : "",
                        nombreGrado: opt
                          ? titulares.find((t) => t.id === opt.value)
                              ?.nombreGrado || ""
                          : "",
                      }));
                    }}
                    placeholder="Buscar y seleccionar docente titular..."
                  />
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={
                      titulares.find(
                        (t) =>
                          String(t.id) === String(formData.idDocenteTitular)
                      )
                        ? `${
                            titulares.find(
                              (t) =>
                                String(t.id) ===
                                String(formData.idDocenteTitular)
                            ).nombre
                          } ${
                            titulares.find(
                              (t) =>
                                String(t.id) ===
                                String(formData.idDocenteTitular)
                            ).apellido
                          } - ${
                            titulares.find(
                              (t) =>
                                String(t.id) ===
                                String(formData.idDocenteTitular)
                            ).nombreGrado
                          }`
                        : ""
                    }
                    readOnly
                  />
                )}
                {errors.idDocenteTitular && (
                  <div className="invalid-feedback">
                    {errors.idDocenteTitular}
                  </div>
                )}
              </div>
            </div>

            {formData.nombreGrado && (
              <div className="form-group">
                <label className="form-label ">Grado</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombreGrado}
                  disabled
                />
                <small className="form-text text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  El grado se asigna automáticamente según el docente titular
                  seleccionado
                </small>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fechaInicio" className="form-label required ">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  className={`form-control ${
                    errors.fechaInicio ? "is-invalid" : ""
                  }`}
                  value={formData.fechaInicio}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                />
                {errors.fechaInicio && (
                  <div className="invalid-feedback">{errors.fechaInicio}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="fechaFin" className="form-label ">
                  Fecha de Fin (opcional)
                </label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  className={`form-control ${
                    errors.fechaFin ? "is-invalid" : ""
                  }`}
                  value={formData.fechaFin}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  min={formData.fechaInicio}
                />
                {errors.fechaFin && (
                  <div className="invalid-feedback">{errors.fechaFin}</div>
                )}
                <small className="form-text text-muted">
                  Si no se especifica, el reemplazo queda abierto
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="motivo" className="form-label required ">
                  Motivo del Reemplazo
                </label>
                <select
                  id="motivo"
                  name="motivo"
                  className={`form-control ${
                    errors.motivo ? "is-invalid" : ""
                  }`}
                  value={formData.motivo}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                >
                  <option value="">Seleccionar motivo</option>
                  {options.motivos.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
                {errors.motivo && (
                  <div className="invalid-feedback">{errors.motivo}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cicloLectivo" className="form-label ">
                Ciclo Lectivo
              </label>
              <input
                type="number"
                id="cicloLectivo"
                name="cicloLectivo"
                className="form-control"
                value={cicloInput}
                onChange={handleInputChange}
                disabled={isViewMode || isEditMode}
                min="2020"
                max="2030"
              />
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
                  {isCreateMode ? "Crear Reemplazo" : "Actualizar Reemplazo"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReemplazoDocenteForm;
