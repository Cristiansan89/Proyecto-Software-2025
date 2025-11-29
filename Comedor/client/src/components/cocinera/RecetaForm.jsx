import { useState, useEffect } from "react";
import Select from "react-select";
import API from "../../services/api";

const RecetaForm = ({ receta, mode, insumos, onSave, onCancel }) => {
  // Función helper para formatear cantidades
  const formatCantidad = (cantidad) => {
    return parseFloat(cantidad).toFixed(2);
  };

  // Función para normalizar unidades (convertir minúsculas a mayúsculas correctas)
  const normalizarUnidad = (unidad) => {
    const unidadesMap = {
      gramo: "Gramo",
      gramos: "Gramos",
      kilogramo: "Kilogramo",
      kilogramos: "Kilogramos",
      mililitro: "Mililitro",
      mililitros: "Mililitros",
      litro: "Litro",
      litros: "Litros",
      unidad: "Unidad",
      unidades: "Unidades",
    };
    return unidadesMap[unidad?.toLowerCase()] || unidad;
  };
  const [formData, setFormData] = useState({
    nombreReceta: receta?.nombreReceta || "",
    instrucciones: receta?.instrucciones || "",
    unidadSalida: receta?.unidadSalida || "Porcion",
    estado: receta?.estado || "Activo",
  });

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
        alert("Complete todos los campos del ingrediente");
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
        alert("Este ingrediente ya está en la lista");
        return;
      }

      const nuevoIngredienteCompleto = {
        id_insumo: nuevoIngrediente.id_insumo,
        nombreInsumo: insumoSeleccionado?.nombreInsumo || "Insumo desconocido",
        cantidadPorPorcion: parseFloat(nuevoIngrediente.cantidadPorPorcion),
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
      alert("Error al agregar ingrediente");
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
        ...formData,
        fechaAlta:
          mode === "create" ? new Date().toISOString() : receta.fechaAlta,
      };

      if (mode === "create") {
        // Crear receta
        const recetaResponse = await API.post("/recetas", recetaData);
        savedReceta = recetaResponse.data;

        // Agregar ingredientes
        for (const ingrediente of ingredientes) {
          const payload = {
            id_insumo: ingrediente.id_insumo,
            cantidadPorPorcion: parseFloat(ingrediente.cantidadPorPorcion) || 0,
            unidadPorPorcion: normalizarUnidad(ingrediente.unidadPorPorcion),
          };
          console.log("📤 Enviando ingrediente:", payload);
          try {
            await API.post(
              `/recetas/${savedReceta.id_receta}/insumos`,
              payload
            );
          } catch (addError) {
            console.error("❌ Error completo:", addError);
            console.error("Response:", addError.response?.data);
            if (addError.response?.data?.errors) {
              console.log(
                "❌ Errores de validación detallados:",
                addError.response.data.errors
              );
              addError.response.data.errors.forEach((err, idx) => {
                console.log(`  Error ${idx}:`, err);
              });
            } else {
              console.log(
                "❌ Error sin detalles de validación:",
                addError.response?.data?.message || addError.message
              );
            }
            throw addError;
          }
        }
      } else {
        // Actualizar receta
        await API.patch(`/recetas/${receta.id_receta}`, recetaData);

        // Primero obtenemos los ingredientes existentes para eliminarlos uno por uno
        try {
          const existingIngredients = await API.get(
            `/recetas/${receta.id_receta}/insumos`
          );
          console.log(
            "📋 Ingredientes existentes completos:",
            existingIngredients.data
          );

          if (existingIngredients.data && existingIngredients.data.insumos) {
            console.log(
              `🗑️ Eliminando ${existingIngredients.data.insumos.length} ingredientes existentes...`
            );
            for (const ingrediente of existingIngredients.data.insumos) {
              try {
                await API.delete(`/recetas/insumos/${ingrediente.id_item}`);
                console.log(
                  "✅ Ingrediente eliminado exitosamente:",
                  ingrediente.id_item
                );
              } catch (delError) {
                console.log(
                  "❌ Error eliminando ingrediente individual:",
                  delError
                );
                // Continuar con el siguiente ingrediente
              }
            }
          } else {
          }
        } catch (deleteError) {
          console.log(
            "❌ Error general al eliminar ingredientes existentes:",
            deleteError
          );
          // Continuar con la adición de nuevos ingredientes
        }

        // Agregar ingredientes actualizados
        console.log(
          `➕ Agregando ${ingredientes.length} ingredientes actualizados...`
        );
        for (const ingrediente of ingredientes) {
          console.log({
            id_insumo: ingrediente.id_insumo,
            cantidadPorPorcion: ingrediente.cantidadPorPorcion,
            unidadPorPorcion: ingrediente.unidadPorPorcion,
          });
          try {
            const payload = {
              id_insumo: ingrediente.id_insumo,
              cantidadPorPorcion:
                parseFloat(ingrediente.cantidadPorPorcion) || 0,
              unidadPorPorcion: normalizarUnidad(ingrediente.unidadPorPorcion),
            };
            console.log("📤 Enviando ingrediente:", payload);
            await API.post(`/recetas/${receta.id_receta}/insumos`, payload);
          } catch (addError) {
            console.error("❌ Error completo:", addError);
            console.error("Response completa:", addError.response?.data);
            console.log("📋 Payload enviado fue:", payload);
            if (addError.response?.data?.errors) {
              console.log(
                "❌ Errores de validación detallados:",
                addError.response.data.errors
              );
              addError.response.data.errors.forEach((err, idx) => {
                console.log(
                  `  Error ${idx}: Campo "${err.field}" - ${err.message}`
                );
              });
            } else {
              console.log(
                "❌ Error sin detalles de validación:",
                addError.response?.data?.message || addError.message
              );
            }
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
        alert("Error de validación. Revise los campos marcados en rojo.");
      } else if (error.response?.data?.message) {
        console.log(
          "❌ Mensaje de error de la API:",
          error.response.data.message
        );
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response) {
        console.log(
          "❌ Error de respuesta HTTP:",
          error.response.status,
          error.response.data
        );
        alert(
          `Error del servidor (${error.response.status}): ${error.response.statusText}`
        );
      } else if (error.request) {
        alert("Error de conexión. Verifique su conexión a internet.");
      } else {
        alert(`Error inesperado: ${error.message}`);
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
                      className="form-label required mt-3"
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
                    <label htmlFor="estado" className="form-label mt-3">
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

              <div className="form-group">
                <label
                  htmlFor="instrucciones"
                  className="form-label required mt-3"
                >
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
                          step="0.01"
                          min="0"
                          value={nuevoIngrediente.cantidadPorPorcion}
                          onChange={(e) =>
                            setNuevoIngrediente({
                              ...nuevoIngrediente,
                              cantidadPorPorcion: e.target.value,
                            })
                          }
                          placeholder="0.00"
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
                          <option value="Gramo">Gramo</option>
                          <option value="Gramos">Gramos</option>
                          <option value="Kilogramo">Kilogramo</option>
                          <option value="Kilogramos">Kilogramos</option>
                          <option value="Mililitro">Mililitro</option>
                          <option value="Mililitros">Mililitros</option>
                          <option value="Litro">Litro</option>
                          <option value="Litros">Litros</option>
                          <option value="Unidad">Unidad</option>
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
