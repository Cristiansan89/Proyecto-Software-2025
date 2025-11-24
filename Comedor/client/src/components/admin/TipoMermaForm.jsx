import { useState, useEffect } from "react";
import tipoMermaService from "../../services/tipoMermaService.js";

const TipoMermaForm = ({ tipoMerma, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: tipoMerma?.nombre || "",
    descripcion: tipoMerma?.descripcion || "",
    estado: tipoMerma?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Actualizar datos del formulario cuando cambie el tipo recibido
  useEffect(() => {
    if (tipoMerma) {
      setFormData({
        nombre: tipoMerma.nombre || "",
        descripcion: tipoMerma.descripcion || "",
        estado: tipoMerma.estado || "Activo",
      });
    }
  }, [tipoMerma]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (formData.nombre.length > 50) {
      newErrors.nombre = "El nombre no puede tener más de 50 caracteres";
    }

    if (formData.descripcion && formData.descripcion.length > 200) {
      newErrors.descripcion =
        "La descripción no puede tener más de 200 caracteres";
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
      if (mode === "crear") {
        await tipoMermaService.create(formData);
      } else if (mode === "editar" && tipoMerma) {
        await tipoMermaService.update(tipoMerma.id_tipo_merma, formData);
      }
      onSave();
    } catch (error) {
      console.error("Error al guardar el tipo de merma:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Error desconocido";
      alert(`Ocurrió un error al guardar el tipo de merma: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <div className="form-sections">
        {/* Información del Tipo de Merma */}
        <div>
          <h5 className="section-title">
            <i className="fas fa-magnifying-glass-minus"></i>
            Información del Tipo de Merma
          </h5>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              maxLength={50}
              placeholder="Ingrese el nombre del tipo de merma"
              disabled={loading}
              required
            />
            {errors.nombre && (
              <div className="invalid-feedback">{errors.nombre}</div>
            )}
            <div className="form-text">Máximo 50 caracteres</div>
          </div>

          <div className="mb-3">
            <label htmlFor="descripcion" className="form-label">
              Descripción
            </label>
            <textarea
              className={`form-control ${
                errors.descripcion ? "is-invalid" : ""
              }`}
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              maxLength={200}
              rows={3}
              placeholder="Descripción opcional del tipo de merma"
              disabled={loading}
            />
            {errors.descripcion && (
              <div className="invalid-feedback">{errors.descripcion}</div>
            )}
            <div className="form-text">Máximo 200 caracteres</div>
          </div>

          <div className="mb-3">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              className="form-select"
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="form-actions mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <i className="fas fa-save"></i>
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Guardando...
                </>
              ) : mode === "crear" ? (
                "Crear Tipo"
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TipoMermaForm;
