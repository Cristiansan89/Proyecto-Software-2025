import React, { useState, useEffect } from "react";
import ComponenteStyle from "../../styles/Componentes.module.css";

const RolForm = ({
  rol,
  onSave,
  onCancel,
  mode = "create",
  serverError = null,
  onServerErrorClear = null,
  rolesExistentes = [],
}) => {
  const [formData, setFormData] = useState({
    nombreRol: "",
    descripcionRol: "",
    habilitaCuentaUsuario: "No",
    estado: "Activo",
  });

  const [errors, setErrors] = useState({});
  const [localServerError, setLocalServerError] = useState(serverError);

  useEffect(() => {
    if (rol && mode !== "create") {
      setFormData({
        nombreRol: rol.nombreRol || "",
        descripcionRol: rol.descripcionRol || "",
        habilitaCuentaUsuario: rol.habilitaCuentaUsuario || "No",
        estado: rol.estado || "Activo",
      });
    }
    setLocalServerError(serverError);
  }, [rol, mode, serverError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value;

    if (name === "nombreRol") {
      // Permitir solo letras y espacios en el campo nombreRol
      valorPermitido = value.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ\s]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: valorPermitido,
    }));

    // Limpiar error del campo si existía
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Limpiar error de servidor al editar el nombre
    if (name === "nombreRol" && localServerError) {
      setLocalServerError(null);
      if (onServerErrorClear) {
        onServerErrorClear();
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombreRol.trim()) {
      newErrors.nombreRol = "El nombre del rol es requerido";
    } else if (formData.nombreRol.length > 100) {
      newErrors.nombreRol =
        "El nombre del rol no puede tener más de 100 caracteres";
    } else {
      // Validar que no exista un rol con el mismo nombre (excepto si está editando el mismo)
      const rolDuplicado = rolesExistentes.find(
        (r) =>
          r.nombreRol.toLowerCase() === formData.nombreRol.toLowerCase() &&
          (mode === "create" || r.idRol !== rol?.idRol),
      );
      if (rolDuplicado) {
        newErrors.nombreRol = `El rol "${formData.nombreRol}" ya existe en el sistema`;
      }
    }

    if (!formData.descripcionRol.trim()) {
      newErrors.descripcionRol = "La descripción del rol es requerida";
    } else if (formData.descripcionRol.length > 100) {
      newErrors.descripcionRol =
        "La descripción del rol no puede tener más de 100 caracteres";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        idRol: rol?.idRol, // Incluir ID solo si estamos editando
      };

      await onSave(dataToSend);
    } catch (error) {}
  };

  const isReadOnly = mode === "view";

  return (
    <form onSubmit={handleSubmit}>
      <div className={ComponenteStyle.formGrid}>
        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="nombreRol" className={ComponenteStyle.formLabel}>
            Nombre del Rol *
          </label>
          <input
            type="text"
            id="nombreRol"
            name="nombreRol"
            value={formData.nombreRol}
            onChange={handleChange}
            className={`${ComponenteStyle.formControl} ${errors.nombreRol ? "error" : ""}`}
            placeholder="Ej: Administrador, Cocinero, Nutricionista"
            maxLength={100}
            readOnly={isReadOnly}
            required
          />
        </div>

        <div className={ComponenteStyle.formGroup}>
          <label htmlFor="descripcionRol" className={ComponenteStyle.formLabel}>
            Descripción del Rol *
          </label>
          <textarea
            id="descripcionRol"
            name="descripcionRol"
            value={formData.descripcionRol}
            onChange={handleChange}
            className={`${ComponenteStyle.formControl} ${errors.descripcionRol ? "error" : ""}`}
            placeholder="Descripción detallada del rol y sus responsabilidades..."
            rows={3}
            maxLength={100}
            readOnly={isReadOnly}
            required
          />
          {errors.descripcionRol && <span>{errors.descripcionRol}</span>}
          <small className={ComponenteStyle.formHelp}>
            {formData.descripcionRol.length}/100 caracteres
          </small>
        </div>

        <div className={ComponenteStyle.formGroup}>
          <label
            htmlFor="habilitaCuentaUsuario"
            className={ComponenteStyle.formLabel}
          >
            ¿Habilita Cuenta de Usuario?
          </label>
          <select
            id="habilitaCuentaUsuario"
            name="habilitaCuentaUsuario"
            value={formData.habilitaCuentaUsuario}
            onChange={handleChange}
            className={ComponenteStyle.formSelect}
            disabled={isReadOnly}
          >
            <option value="No">No</option>
            <option value="Si">Sí</option>
          </select>
          <small className={ComponenteStyle.formHelp}>
            Determina si las personas con este rol pueden tener cuenta de
            usuario en el sistema
          </small>
        </div>

        {localServerError && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
            role="alert"
          >
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong className="me-1">Error:</strong> {localServerError}
          </div>
        )}

        {errors.nombreRol && (
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
            role="alert"
          >
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong className="me-1">Error:</strong> {errors.nombreRol}
          </div>
        )}

        {mode !== "create" && (
          <div className={ComponenteStyle.formGroup}>
            <label htmlFor="estado" className={ComponenteStyle.formLabel}>
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className={ComponenteStyle.formSelect}
              disabled={isReadOnly}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        )}
      </div>

      {!isReadOnly && (
        <div className={ComponenteStyle.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel}`}
          >
            <i className="fas fa-times mr-1"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
          >
            <i className="fas fa-save mr-1"></i>
            {mode === "create" ? "Crear Rol" : "Actualizar Rol"}
          </button>
        </div>
      )}
    </form>
  );
};

export default RolForm;
