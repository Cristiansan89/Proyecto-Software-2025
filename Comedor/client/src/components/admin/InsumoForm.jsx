import { useState, useEffect } from "react";
import insumoService from "../../services/insumoService.js";
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

const InsumoForm = ({ insumo, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombreInsumo: insumo?.nombreInsumo || "",
    descripcion: insumo?.descripcion || "",
    unidadMedida: insumo?.unidadMedida || "",
    categoria: insumo?.categoria || "Otros",
    stockMinimo: insumo?.stockMinimo || 0,
    stockActual: insumo?.stockActual || 0,
    stockMaximo: insumo?.stockMaximo || 0,
    estado: insumo?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Categorías disponibles (según la base de datos)
  const categorias = [
    { value: "Carnes y proteina", label: "Carnes y proteinas" },
    { value: "Bebidas", label: "Bebidas" },
    { value: "Frutas", label: "Frutas" },
    { value: "Enlatados", label: "Enlatados" },
    { value: "Legumbres", label: "Legumbres" },
    { value: "Conservas", label: "Conservas" },
    { value: "Descartables", label: "Descartables" },
    { value: "Limpieza", label: "Limpieza" },
    { value: "Lacteos", label: "Lácteos" },
    { value: "Cereales", label: "Cereales" },
    { value: "Verduras", label: "Verduras" },
    { value: "Condimentos", label: "Condimentos" },
    { value: "Otros", label: "Otros" },
  ];

  // Unidades de medida comunes
  const unidadesMedida = [
    { value: "Kilogramos", label: "Kilogramos" },
    { value: "Gramos", label: "Gramos" },
    { value: "Litros", label: "Litros" },
    { value: "Mililitros", label: "Mililitros" },
    { value: "Unidades", label: "Unidades" },
    { value: "Metros", label: "Metros" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
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
    if (!formData.nombreInsumo.trim()) {
      newErrors.nombreInsumo = "El nombre del insumo es requerido";
    } else if (formData.nombreInsumo.length > 100) {
      newErrors.nombreInsumo = "El nombre no puede exceder 100 caracteres";
    }

    if (!formData.unidadMedida.trim()) {
      newErrors.unidadMedida = "La unidad de medida es requerida";
    }

    if (formData.descripcion && formData.descripcion.length > 255) {
      newErrors.descripcion = "La descripción no puede exceder 255 caracteres";
    }

    // Validaciones numéricas
    if (formData.stockMinimo < 0) {
      newErrors.stockMinimo = "El stock mínimo no puede ser negativo";
    }

    if (formData.stockActual < 0) {
      newErrors.stockActual = "El stock actual no puede ser negativo";
    }

    if (formData.stockMaximo < 0) {
      newErrors.stockMaximo = "El stock máximo no puede ser negativo";
    }

    if (
      formData.stockMaximo > 0 &&
      formData.stockMinimo > 0 &&
      formData.stockMaximo < formData.stockMinimo
    ) {
      newErrors.stockMaximo =
        "El stock máximo no puede ser menor que el stock mínimo";
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
      const insumoData = {
        nombreInsumo: formData.nombreInsumo.trim(),
        descripcion: formData.descripcion.trim() || null,
        unidadMedida: formData.unidadMedida,
        categoria: formData.categoria,
        stockMinimo: Number(formData.stockMinimo),
        estado: formData.estado,
        // Datos de inventario
        cantidadActual: Number(formData.stockActual),
        nivelMinimoAlerta: Number(formData.stockMinimo),
        stockMaximo: Number(formData.stockMaximo),
      };

      let savedInsumo;

      if (mode === "create") {
        savedInsumo = await insumoService.create(insumoData);
      } else {
        savedInsumo = await insumoService.update(insumo.idInsumo, insumoData);
      }

      onSave(savedInsumo);
    } catch (error) {
      // Mostrar error al usuario
      if (error.response?.status === 409) {
        setServerError(
          error.response?.data?.message ||
            "Ya existe un insumo con estos datos",
        );
      } else if (error.response?.data?.message) {
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
          "Error al guardar el insumo. Por favor, inténtelo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (insumo) {
      setFormData({
        nombreInsumo: insumo.nombreInsumo || "",
        descripcion: insumo.descripcion || "",
        unidadMedida: insumo.unidadMedida || "",
        categoria: insumo.categoria || "Otros",
        stockMinimo: insumo.stockMinimo || 0,
        stockActual: insumo.stockActual || 0,
        stockMaximo: insumo.stockMaximo || 0,
        estado: insumo.estado || "Activo",
      });
    }
  }, [insumo]);

  return (
    <form onSubmit={handleSubmit}>
      <h4 className={ComponenteStyle.sectionTitle}>
        <i className="fas fa-info-circle me-2"></i>Información Básica
      </h4>

      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="nombreInsumo"
          className={`${ComponenteStyle.formLabel} required`}
        >
          Nombre del Insumo
        </label>
        <input
          type="text"
          id="nombreInsumo"
          name="nombreInsumo"
          className={`${ComponenteStyle.formControl} ${errors.nombreInsumo ? ComponenteStyle.isInvalid : ""}`}
          value={formData.nombreInsumo}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Ingrese el nombre del insumo"
          maxLength="100"
        />
        {errors.nombreInsumo && (
          <div className={ComponenteStyle.invalidFeedback}>
            {errors.nombreInsumo}
          </div>
        )}
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="descripcion" className={ComponenteStyle.formLabel}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          className={`${ComponenteStyle.formControl} ${errors.descripcion ? ComponenteStyle.isInvalid : ""}`}
          value={formData.descripcion}
          onChange={handleInputChange}
          disabled={isViewMode}
          placeholder="Ingrese una descripción del insumo (opcional)"
          rows="3"
          maxLength="255"
        />
        {errors.descripcion && (
          <div className={ComponenteStyle.invalidFeedback}>
            {errors.descripcion}
          </div>
        )}
        <small className={`${ComponenteStyle.formText} text-muted`}>
          {formData.descripcion.length}/255 caracteres
        </small>
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="categoria" className={ComponenteStyle.formLabel}>
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          className={ComponenteStyle.formSelect}
          value={formData.categoria}
          onChange={handleInputChange}
          disabled={isViewMode}
        >
          {categorias.map((categoria) => (
            <option key={categoria.value} value={categoria.value}>
              {categoria.label}
            </option>
          ))}
        </select>
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label
          htmlFor="unidadMedida"
          className={`${ComponenteStyle.formLabel} required`}
        >
          Unidad de Medida
        </label>
        <select
          id="unidadMedida"
          name="unidadMedida"
          className={`${ComponenteStyle.formSelect} ${errors.unidadMedida ? ComponenteStyle.isInvalid : ""}`}
          value={formData.unidadMedida}
          onChange={handleInputChange}
          disabled={isViewMode}
        >
          <option value="">Seleccionar unidad de medida</option>
          {unidadesMedida.map((unidad) => (
            <option key={unidad.value} value={unidad.value}>
              {unidad.label}
            </option>
          ))}
        </select>
        {errors.unidadMedida && (
          <div className={ComponenteStyle.invalidFeedback}>
            {errors.unidadMedida}
          </div>
        )}
      </div>

      {/* Información de Stock */}

      <h4 className={`${ComponenteStyle.sectionTitle} mt-5`}>
        Control de Stock
      </h4>

      <div className={ComponenteStyle.formRow}>
        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="stockMinimo" className={ComponenteStyle.formLabel}>
            Stock Mínimo
          </label>
          <input
            type="number"
            id="stockMinimo"
            name="stockMinimo"
            className={`${ComponenteStyle.formControl} ${errors.stockMinimo ? ComponenteStyle.isInvalid : ""}`}
            value={formData.stockMinimo}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="0.000"
            min="0"
            step="0.001"
          />
          {errors.stockMinimo && (
            <div className={ComponenteStyle.invalidFeedback}>
              {errors.stockMinimo}
            </div>
          )}
          <small className={`${ComponenteStyle.formText} text-muted`}>
            Cantidad mínima antes de requerir reposición
          </small>
        </div>
        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="stockMaximo" className={ComponenteStyle.formLabel}>
            Stock Máximo
          </label>
          <input
            type="number"
            id="stockMaximo"
            name="stockMaximo"
            className={`${ComponenteStyle.formControl} ${errors.stockMaximo ? ComponenteStyle.isInvalid : ""}`}
            value={formData.stockMaximo}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="0.000"
            min="0"
            step="0.001"
          />
          {errors.stockMaximo && (
            <div className={ComponenteStyle.invalidFeedback}>
              {errors.stockMaximo}
            </div>
          )}
          <small className={`${ComponenteStyle.formText} text-muted`}>
            Cantidad máxima permitida en inventario
          </small>
        </div>
        <div>
          <div className={ComponenteStyle.formGroup}>
            <label htmlFor="stockActual" className={ComponenteStyle.formLabel}>
              Stock Actual
            </label>
            <input
              type="number"
              id="stockActual"
              name="stockActual"
              className={`${ComponenteStyle.formControl} ${
                errors.stockActual ? ComponenteStyle.isInvalid : ""
              }`}
              value={formData.stockActual}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="0.000"
              min="0"
              step="0.001"
            />
            {errors.stockActual && (
              <div className={ComponenteStyle.invalidFeedback}>
                {errors.stockActual}
              </div>
            )}
            <small className={`${ComponenteStyle.formText} text-muted`}>
              Cantidad disponible en inventario
            </small>
          </div>
        </div>
      </div>

      {/* Alerta de stock bajo */}
      {Number(formData.stockActual) >= 0 &&
        Number(formData.stockMinimo) > 0 &&
        Number(formData.stockActual) <= Number(formData.stockMinimo) && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertWarning}`}
          >
            <p>
              <i className="fas fa-exclamation-triangle mx-1"></i>
              <b>Atención: </b> El stock actual está por debajo o igual al
              mínimo establecido.
            </p>
          </div>
        )}

      {/* Estado */}
      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="estado" className={ComponenteStyle.formLabel}>
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          className={ComponenteStyle.formControl}
          value={formData.estado}
          onChange={handleInputChange}
          disabled={isViewMode}
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      {/* Alerta de error del servidor */}
      {serverError && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          {serverError}
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
                {isCreateMode ? "Crear Insumo" : "Actualizar Insumo"}
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

export default InsumoForm;
