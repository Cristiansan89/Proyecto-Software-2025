import { useEffect, useState } from "react";
import estadoPedidoService from "../../services/estadoPedidoService.js";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const EstadoPedidoForm = ({ estadoPedido, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: estadoPedido?.nombreEstado || "",
    descripcion: estadoPedido?.descripcion || "",
    estado: estadoPedido?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Actualizar datos del formulario cuando cambie el estado recibido
  useEffect(() => {
    if (estadoPedido) {
      setFormData({
        nombre: estadoPedido.nombreEstado || estadoPedido.nombre || "",
        descripcion: estadoPedido.descripcion || "",
        estado: estadoPedido.estado || "Activo",
      });
      setServerError(null);
    }
  }, [estadoPedido]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value; // Variable para almacenar el valor procesado

    if (name === "nombre") {
      // Permitir solo letras y espacios en el campo nombre
      valorPermitido = value.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ\s]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: valorPermitido }));

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
    setServerError(null);
    try {
      if (mode === "create") {
        await estadoPedidoService.create(formData);
      } else if (mode === "edit") {
        await estadoPedidoService.update(
          estadoPedido.id_estado_pedido,
          formData
        );
      }
      onSave();
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);

      let errorMessage = "";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error.response?.data === "string") {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log("Mensaje de error extraído:", errorMessage);

      if (errorMessage.toLowerCase().includes("existe")) {
        setServerError("Ya existe un estado de pedido con este nombre");
      } else if (errorMessage) {
        setServerError(errorMessage);
      } else {
        setServerError(
          "Error al guardar el estado de pedido. Por favor, inténtelo de nuevo."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <div className="form-sections">
        {/* Información del Estado de Pedido */}
        <div>
          <h5 className="section-title">Información del Estado de Pedido</h5>
          <div className="form-group">
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
              placeholder="Ingrese el nombre del estado"
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
              placeholder="Descripción opcional del estado"
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

          {/* Mostrar error del servidor */}
          {serverError && (
            <div
              className="alert alert-danger alert-dismissible fade show mb-3"
              role="alert"
            >
              <i className="fas fa-exclamation-circle me-2"></i>
              <strong className="me-1">Error al guardar:</strong>
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {serverError}
              </div>
            </div>
          )}

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
              ) : mode === "create" ? (
                "Crear Estado"
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

export default EstadoPedidoForm;
