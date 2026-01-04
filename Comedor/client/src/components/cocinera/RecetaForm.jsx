import { useState, useEffect } from "react";
import Select from "react-select";
import API from "../../services/api";
import recetasServiciosService from "../../services/serviciosRecetasService";
import { showSuccess, showError, showWarning, showInfo, showToast, showConfirm } from "../../utils/alertService";

const RecetaForm = ({ receta, mode, insumos, onSave, onCancel }) => {
  // Función helper para formatear cantidades
  const formatCantidad = (cantidad) => {
    return parseInt(cantidad) || 0;
  };

  // Función para normalizar unidades (convertir minúsculas a mayúsculas correctas)
  const normalizarUnidad = (unidad) => {
    const unidadesMap = {
      gramos: "Gramos",
      kilogramos: "Kilogramos",
      mililitros: "Mililitros",
      litros: "Litros",
      unidades: "Unidades",
    };
    return unidadesMap[unidad?.toLowerCase()] || unidad;
  };
  const [formData, setFormData] = useState({
    nombreReceta: receta?.nombreReceta || "",
    instrucciones: receta?.instrucciones || "",
    unidadSalida: receta?.unidadSalida || "Porcion",
    estado: receta?.estado || "Activo",
    servicios: receta?.servicios || [], // Array de IDs de servicios
  });

  const [serviciosDisponibles, setServiciosDisponibles] = useState([
    { id_servicio: 1, nombre: "Desayuno" },
    { id_servicio: 2, nombre: "Almuerzo" },
    { id_servicio: 3, nombre: "Merienda" },
  ]);

  const [ingredientes, setIngredientes] = useState([]);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({
    id_insumo: "",
    cantidadPorPorcion: "",
    unidadPorPorcion: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingInsumos, setLoadingInsumos] = useState(false);

  // Cargar ingredientes existentes si estamos editando
  useEffect(() => {
    if (receta && mode !== "create") {
      loadRecetaIngredientes();
      loadRecetaServicios();
    }
  }, [receta, mode]);

  const loadRecetaIngredientes = async () => {
    try {
      const response = await API.get(`/recetas/${receta.id_receta}/insumos`);
      if (response.data && response.data.insumos) {
        // Formatear los ingredientes para evitar exceso de decimales y normalizar unidades
        const ingredientesFormateados = response.data.insumos.map((ing) => ({
          ...ing,
          cantidadPorPorcion: formatCantidad(ing.cantidadPorPorcion),
          unidadPorPorcion: normalizarUnidad(ing.unidadPorPorcion),
        }));
        setIngredientes(ingredientesFormateados);
      } else {
        setIngredientes([]);
      }
    } catch (error) {
      setIngredientes([]);
    }
  };

  const loadRecetaServicios = async () => {
    try {
      const servicios = await recetasServiciosService.getServiciosPorReceta(
        receta.id_receta
      );

      if (servicios && Array.isArray(servicios)) {
        // Extraer los IDs de servicios del response
        const serviciosIds = servicios.map((srv) => srv.id_servicio);
        setFormData((prev) => ({
          ...prev,
          servicios: serviciosIds,
        }));
      }
    } catch (error) {
      console.error("❌ Error cargando servicios:", error);
      // No es crítico si falla, continuar sin servicios
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let nombrePermitido = value;

    if (name === "nombreReceta") {
      // Limitar el nombre de la receta a 25 caracteres solo letra y número
      nombrePermitido = value
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚ0-9]/g, " ")
        .slice(0, 25);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: nombrePermitido,
    }));

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

    // Validaciones requeridas
    if (!formData.nombreReceta.trim()) {
      newErrors.nombreReceta = "El nombre de la receta es requerido";
    } else if (formData.nombreReceta.length < 3) {
      newErrors.nombreReceta = "El nombre debe tener al menos 3 caracteres";
    }

    if (!formData.instrucciones.trim()) {
      newErrors.instrucciones = "Las instrucciones son requeridas";
    } else if (formData.instrucciones.length < 10) {
      newErrors.instrucciones =
        "Las instrucciones deben ser más detalladas (mínimo 10 caracteres)";
    }

    if (!formData.unidadSalida) {
      newErrors.unidadSalida = "Debe seleccionar una unidad de salida";
    }

    // Validar servicios
    if (formData.servicios.length === 0) {
      newErrors.servicios = "Debe seleccionar al menos un servicio";
    }

    // Validar ingredientes
    if (ingredientes.length === 0) {
      newErrors.ingredientes = "La receta debe tener al menos un ingrediente";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const agregarIngrediente = () => {
    try {
      if (
        !nuevoIngrediente.id_insumo ||
        !nuevoIngrediente.cantidadPorPorcion ||
        !nuevoIngrediente.unidadPorPorcion
      ) {
        showToast("Complete todos los campos del ingrediente", "info", 2000);
        return;
      }

      const insumoSeleccionado = insumos.find(
        (ins) => ins.idInsumo === nuevoIngrediente.id_insumo
      );

      // Verificar si el ingrediente ya existe
      const yaExiste = ingredientes.some(
        (ing) => ing.id_insumo === nuevoIngrediente.id_insumo
      );
      if (yaExiste) {
        showToast("Este ingrediente ya está en la lista", "info", 2000);
        return;
      }

      const nuevoIngredienteCompleto = {
        id_insumo: nuevoIngrediente.id_insumo,
        nombreInsumo: insumoSeleccionado?.nombreInsumo || "Insumo desconocido",
        cantidadPorPorcion: parseInt(nuevoIngrediente.cantidadPorPorcion),
        unidadPorPorcion: nuevoIngrediente.unidadPorPorcion,
      };

      setIngredientes((prev) => [...prev, nuevoIngredienteCompleto]);

      setNuevoIngrediente({
        id_insumo: "",
        cantidadPorPorcion: "",
        unidadPorPorcion: "",
      });

      // Limpiar error de ingredientes si existe
      if (errors.ingredientes) {
        setErrors((prev) => ({
          ...prev,
          ingredientes: "",
        }));
      }
    } catch (error) {
      showError("Error", "Error al agregar ingrediente");
    }
  };

  const eliminarIngrediente = (index) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let savedReceta;
      const recetaData = {
        nombreReceta: formData.nombreReceta,
        instrucciones: formData.instrucciones,
        unidadSalida: formData.unidadSalida,
        estado: formData.estado,
        fechaAlta:
          mode === "create" ? new Date().toISOString() : receta.fechaAlta,
      };

      if (mode === "create") {
        // Crear receta
        const recetaResponse = await API.post("/recetas", recetaData);
        savedReceta = recetaResponse.data;

        // Guardar servicios en la tabla ServicioReceta
        if (formData.servicios.length > 0) {
          try {
            await recetasServiciosService.actualizarServiciosReceta(
              savedReceta.id_receta,
              formData.servicios
            );
          } catch (servicioError) {
            console.error("❌ Error guardando servicios:", servicioError);
            throw servicioError;
          }
        }

        // Agregar ingredientes
        for (const ingrediente of ingredientes) {
          const payload = {
            id_insumo: ingrediente.id_insumo,
            cantidadPorPorcion: parseInt(ingrediente.cantidadPorPorcion) || 0,
            unidadPorPorcion: normalizarUnidad(ingrediente.unidadPorPorcion),
          };

          try {
            await API.post(
              `/recetas/${savedReceta.id_receta}/insumos`,
              payload
            );
          } catch (addError) {
            console.error("❌ Error completo:", addError);
            console.error("Response:", addError.response?.data);
            throw addError;
          }
        }
      } else {
        // Actualizar receta
        await API.patch(`/recetas/${receta.id_receta}`, recetaData);

        // Actualizar servicios en la tabla ServicioReceta
        try {
          await recetasServiciosService.actualizarServiciosReceta(
            receta.id_receta,
            formData.servicios
          );
        } catch (servicioError) {
          console.error("❌ Error actualizando servicios:", servicioError);
          throw servicioError;
        }

        // Primero obtenemos los ingredientes existentes para eliminarlos uno por uno
        try {
          const existingIngredients = await API.get(
            `/recetas/${receta.id_receta}/insumos`
          );

          if (existingIngredients.data && existingIngredients.data.insumos) {
            for (const ingrediente of existingIngredients.data.insumos) {
              try {
                await API.delete(`/recetas/insumos/${ingrediente.id_item}`);
              } catch (delError) {
                // Continuar con el siguiente ingrediente
              }
            }
          }
        } catch (deleteError) {
          // Continuar con la adición de nuevos ingredientes
        }

        // Agregar ingredientes actualizados

        for (const ingrediente of ingredientes) {
          try {
            const payload = {
              id_insumo: ingrediente.id_insumo,
              cantidadPorPorcion: parseInt(ingrediente.cantidadPorPorcion) || 0,
              unidadPorPorcion: normalizarUnidad(ingrediente.unidadPorPorcion),
            };

            await API.post(`/recetas/${receta.id_receta}/insumos`, payload);
          } catch (addError) {
            console.error("❌ Error completo:", addError);
            console.error("Response completa:", addError.response?.data);
            throw addError; // Re-lanzar para abortar el proceso
          }
        }

        savedReceta = { ...receta, ...recetaData };
      }

      onSave(savedReceta);
    } catch (error) {
      // Mostrar errores específicos
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach((err) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
        showError("Error", "Error de validación. Revise los campos marcados en rojo.");
      } else if (error.response?.data?.message) {
        showInfo("Información", `Error: ${error.response.data.message}`);
      } else if (error.response) {
        showInfo("Información", `Error del servidor (${error.response.status}): ${error.response.statusText}`);
      } else if (error.request) {
        showError("Error", "Error de conexión. Verifique su conexión a internet.");
      } else {
        showInfo("Información", `Error inesperado: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <div className="receta-form">
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Columna izquierda - Información de la receta */}
          <div className="col-lg-6">
            <div className="form-section">
              <h4 className="section-title">
                <i className="fas fa-utensils me-2"></i>
                Información de la Receta
              </h4>

              <div className="form-group">
                <label htmlFor="nombreReceta" className="form-label required">
                  Nombre de la receta
                </label>
                <input
                  type="text"
                  id="nombreReceta"
                  name="nombreReceta"
                  className={`form-control ${
                    errors.nombreReceta ? "is-invalid" : ""
                  }`}
                  value={formData.nombreReceta}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="Ej: Arroz con pollo"
                />
                {errors.nombreReceta && (
                  <div className="invalid-feedback">{errors.nombreReceta}</div>
                )}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label
                      htmlFor="unidadSalida"
                      className="form-label required"
                    >
                      Unidad de Salida
                    </label>
                    <select
                      id="unidadSalida"
                      name="unidadSalida"
                      className={`form-control ${
                        errors.unidadSalida ? "is-invalid" : ""
                      }`}
                      value={formData.unidadSalida}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                    >
                      <option value="Porcion">Porción</option>
                      <option value="Litro">Litro</option>
                      <option value="Kilogramo">Kilogramo</option>
                      <option value="Unidad">Unidad</option>
                    </select>
                    {errors.unidadSalida && (
                      <div className="invalid-feedback">
                        {errors.unidadSalida}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
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
                <div className="col-12">
                  <div className="form-group">
                    <label className="form-label">
                      <strong>Servicios Disponibles</strong>
                    </label>
                    <div className="d-flex gap-3">
                      {serviciosDisponibles.map((servicio) => (
                        <div key={servicio.id_servicio} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`servicio-${servicio.id_servicio}`}
                            checked={formData.servicios.includes(
                              servicio.id_servicio
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  servicios: [
                                    ...prev.servicios,
                                    servicio.id_servicio,
                                  ],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  servicios: prev.servicios.filter(
                                    (id) => id !== servicio.id_servicio
                                  ),
                                }));
                              }
                            }}
                            disabled={isViewMode}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`servicio-${servicio.id_servicio}`}
                          >
                            {servicio.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.servicios && (
                      <div className="text-danger small mt-1">
                        {errors.servicios}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="instrucciones" className="form-label required">
                  Instrucciones de preparación
                </label>
                <textarea
                  id="instrucciones"
                  name="instrucciones"
                  className={`form-control ${
                    errors.instrucciones ? "is-invalid" : ""
                  }`}
                  rows="8"
                  value={formData.instrucciones}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="Describe paso a paso cómo preparar esta receta..."
                />
                {errors.instrucciones && (
                  <div className="invalid-feedback">{errors.instrucciones}</div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Gestión de ingredientes */}
          <div className="col-lg-6">
            <div className="form-section">
              <h4 className="section-title">
                <i className="fas fa-list me-2"></i>
                Ingredientes de la Receta
                {errors.ingredientes && (
                  <span className="text-danger ms-2 small">
                    ({errors.ingredientes})
                  </span>
                )}
              </h4>

              {!isViewMode && (
                <>
                  {/* Formulario para agregar ingredientes */}
                  <div className="form-group">
                    <label htmlFor="ingrediente_insumo" className="form-label">
                      Seleccionar insumo
                    </label>
                    <Select
                      inputId="ingrediente_insumo"
                      options={
                        insumos?.map((insumo) => ({
                          value: insumo.idInsumo,
                          label: insumo.nombreInsumo,
                          data: insumo,
                        })) || []
                      }
                      value={
                        nuevoIngrediente.id_insumo
                          ? {
                              value: nuevoIngrediente.id_insumo,
                              label:
                                insumos?.find(
                                  (ins) =>
                                    ins.idInsumo === nuevoIngrediente.id_insumo
                                )?.nombreInsumo || "Seleccionar...",
                              data: insumos?.find(
                                (ins) =>
                                  ins.idInsumo === nuevoIngrediente.id_insumo
                              ),
                            }
                          : null
                      }
                      onChange={(option) =>
                        setNuevoIngrediente({
                          ...nuevoIngrediente,
                          id_insumo: option ? option.value : "",
                        })
                      }
                      placeholder="Buscar insumo..."
                      isSearchable
                      isClearable
                      noOptionsMessage={() => "No hay insumos disponibles"}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#ced4da",
                          borderRadius: "0.375rem",
                          "&:hover": {
                            borderColor: "#86b7fe",
                          },
                          "&:focus-within": {
                            borderColor: "#86b7fe",
                            boxShadow: "0 0 0 0.25rem rgba(13, 110, 253, 0.25)",
                          },
                        }),
                      }}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label
                          htmlFor="ingrediente_cantidad"
                          className="form-label mt-3"
                        >
                          Cantidad
                        </label>
                        <input
                          type="number"
                          id="ingrediente_cantidad"
                          className="form-control"
                          step="1"
                          min="1"
                          value={nuevoIngrediente.cantidadPorPorcion}
                          onChange={(e) =>
                            setNuevoIngrediente({
                              ...nuevoIngrediente,
                              cantidadPorPorcion: e.target.value,
                            })
                          }
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label
                          htmlFor="ingrediente_unidad"
                          className="form-label mt-3"
                        >
                          Unidad
                        </label>
                        <select
                          id="ingrediente_unidad"
                          className="form-control"
                          value={nuevoIngrediente.unidadPorPorcion}
                          onChange={(e) =>
                            setNuevoIngrediente({
                              ...nuevoIngrediente,
                              unidadPorPorcion: e.target.value,
                            })
                          }
                        >
                          <option value="">Seleccione unidad</option>
                          <option value="Gramos">Gramos</option>
                          <option value="Kilogramos">Kilogramos</option>
                          <option value="Mililitros">Mililitros</option>
                          <option value="Litros">Litros</option>
                          <option value="Unidades">Unidades</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <button
                      type="button"
                      className="btn btn-success w-100"
                      onClick={agregarIngrediente}
                      disabled={
                        !nuevoIngrediente.id_insumo ||
                        !nuevoIngrediente.cantidadPorPorcion ||
                        !nuevoIngrediente.unidadPorPorcion
                      }
                    >
                      <i className="fas fa-plus me-2"></i>
                      Agregar Ingrediente
                    </button>
                  </div>
                </>
              )}

              {/* Lista de ingredientes */}
              <div className="mt-4">
                <h6 className="small">
                  Ingredientes agregados
                  <span className="badge bg-info ms-2">
                    {ingredientes.length}
                  </span>
                </h6>

                {ingredientes.length === 0 ? (
                  <div className="text-center py-3 text-muted">
                    <i className="fas fa-list fa-2x mb-2"></i>
                    <p>No hay ingredientes agregados</p>
                    {!isViewMode && (
                      <small>
                        Agrega al menos un ingrediente para continuar
                      </small>
                    )}
                  </div>
                ) : (
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                  >
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Ingrediente</th>
                          <th>Cant.</th>
                          <th>Unidad</th>
                          {!isViewMode && <th>Acción</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {ingredientes.map((ingrediente, index) => (
                          <tr key={index}>
                            <td className="small">
                              {ingrediente.nombreInsumo}
                            </td>
                            <td className="small">
                              {formatCantidad(ingrediente.cantidadPorPorcion)}
                            </td>
                            <td className="small">
                              {ingrediente.unidadPorPorcion}
                            </td>
                            {!isViewMode && (
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => eliminarIngrediente(index)}
                                  title="Eliminar ingrediente"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
            <i className="fas fa-times me-2"></i>
            {isViewMode ? "Cerrar" : "Cancelar"}
          </button>

          {!isViewMode && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  {isCreateMode ? "Crear Receta" : "Actualizar Receta"}
                  {ingredientes.length > 0 && (
                    <span className="badge bg-light text-dark ms-2">
                      {ingredientes.length} ingredientes
                    </span>
                  )}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RecetaForm;
