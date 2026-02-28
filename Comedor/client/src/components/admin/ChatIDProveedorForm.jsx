import { useState } from "react";
import api from "../../services/api";
import {
  showSuccess,
  showError,
} from "../../utils/alertService";
import PropTypes from "prop-types";

const ChatIDProveedorForm = ({ proveedor, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    chatId: proveedor?.chatId || "",
    telegramUsuario: proveedor?.telegramUsuario || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "chatId") {
      // Solo permitir números y el signo negativo al inicio
      const valorPermitido = value.replace(/[^0-9-]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: valorPermitido,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

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

    if (!formData.chatId.trim()) {
      newErrors.chatId = "El Chat ID es requerido";
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
      const response = await api.post("/telegram/proveedor-chat-id", {
        proveedorId: proveedor.id,
        chatId: formData.chatId.trim(),
        telegramUsuario: formData.telegramUsuario.trim(),
      });

      if (response.data.success) {
        showSuccess(
          "Chat ID guardado",
          `Chat ID del proveedor ${proveedor.nombre} guardado correctamente`
        );
        onSave();
      } else {
        setServerError("Error al guardar el Chat ID del proveedor");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else {
        setServerError("Error al guardar. Por favor, intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proveedor-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-3">
          <label className="text-dark fw-bold">
            Chat ID de Telegram
          </label>
          <input
            type="text"
            className="form-control mt-2"
            name="chatId"
            value={formData.chatId}
            onChange={handleInputChange}
            placeholder="Ej: 123456789 o -1001234567890"
            disabled={loading}
          />
          <small className="text-muted d-block mt-2">
            El Chat ID que recibió el proveedor al ejecutar /chatid en el bot
          </small>
          {errors.chatId && (
            <div className="alert alert-danger mt-2" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {errors.chatId}
            </div>
          )}
        </div>

        <div className="form-group mb-3">
          <label className="text-dark fw-bold">
            Usuario de Telegram (opcional)
          </label>
          <input
            type="text"
            className="form-control mt-2"
            name="telegramUsuario"
            value={formData.telegramUsuario}
            onChange={handleInputChange}
            placeholder="Ej: @nombreUsuario"
            disabled={loading}
          />
          <small className="text-muted d-block mt-2">
            Usuario de Telegram del proveedor (sin el @)
          </small>
        </div>

        {serverError && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong className="me-1">Error:</strong> {serverError}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={onCancel}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Guardar Chat ID
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

ChatIDProveedorForm.propTypes = {
  proveedor: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ChatIDProveedorForm;