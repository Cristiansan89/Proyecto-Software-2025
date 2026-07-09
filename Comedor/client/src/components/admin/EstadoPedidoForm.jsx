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
import ComponenteStyle from "../../styles/Componentes.module.css";

const EstadoPedidoForm = ({ estadoPedido, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: estadoPedido?.nombreEstado || "",
    descripcion: estadoPedido?.descripcion || "",
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
        onSave("created");
      } else if (mode === "edit") {
        await estadoPedidoService.update(
          estadoPedido.id_estadoPedido,
          formData,
        );
        onSave("updated");
      }
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
          "Error al guardar el estado de pedido. Por favor, inténtelo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      <h4 className={ComponenteStyle.sectionTitle}>
        <i className="fas fa-info-circle me-2"></i>Información del Estado de
        Pedido
      </h4>
      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="nombre" className={ComponenteStyle.formLabel}>
          Nombre <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`${ComponenteStyle.formControl} ${errors.nombre ? ComponenteStyle.isInvalid : ""}`}
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
          <div className={ComponenteStyle.invalidFeedback}>{errors.nombre}</div>
        )}
        <div className={ComponenteStyle.formText}>Máximo 50 caracteres</div>
      </div>

      <div className={ComponenteStyle.formGroup}>
        <label htmlFor="descripcion" className={ComponenteStyle.formLabel}>
          Descripción
        </label>
        <textarea
          className={`${ComponenteStyle.formControl} ${errors.descripcion ? ComponenteStyle.isInvalid : ""}`}
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
          <div className={ComponenteStyle.invalidFeedback}>
            {errors.descripcion}
          </div>
        )}
        <div className={ComponenteStyle.formText}>Máximo 200 caracteres</div>
      </div>

      {/* Eliminado campo Estado porque no existe en backend */}

      {/* Mostrar error del servidor */}
      {serverError && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error al guardar:</strong>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {serverError}
          </div>
        </div>
      )}

      <div className={ComponenteStyle.formActions}>
        <button
          type="button"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
          onClick={onCancel}
          disabled={loading}
        >
          <i className="fas fa-times"></i>
          Cancelar
        </button>
        <button
          type="submit"
          className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
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
    </form>
  );
};

export default EstadoPedidoForm;
