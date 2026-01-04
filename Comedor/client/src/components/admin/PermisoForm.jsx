import React, { useState, useEffect } from "react";

const PermisoForm = ({
  permiso,
  onSave,
  onCancel,
  mode = "create",
  serverError = null,
  onServerErrorClear = null,
  permisosExistentes = [],
}) => {
  const [formData, setFormData] = useState({
    nombrePermiso: "",
    descripcionPermiso: "",
    modulo: "Sin Módulo",
    accion: "Sin Acción",
    estado: "Activo",
  });

  const [errors, setErrors] = useState({});
  const [localServerError, setLocalServerError] = useState(serverError);

  // Opciones para los selectores - basadas en la base de datos
  const accionesDisponibles = [
    { value: "Sin Acción", label: "Sin Acción" },
    { value: "Registrar", label: "Registrar" },
    { value: "Modificar", label: "Modificar" },
    { value: "Eliminar", label: "Eliminar" },
    { value: "Buscar", label: "Buscar" },
    { value: "Consultar", label: "Consultar" },
    { value: "Exportar", label: "Exportar" },
  ];

  const modulosDisponibles = [
    { value: "Sin Módulo", label: "Sin Módulo" },
    { value: "Asistencias", label: "Asistencias" },
    { value: "Auditoria", label: "Auditoría" },
    { value: "Consumos", label: "Consumos" },
    { value: "Insumos", label: "Insumos" },
    { value: "Inventarios", label: "Inventarios" },
    { value: "Parámetros", label: "Parámetros" },
    { value: "Pedidos", label: "Pedidos" },
    { value: "Permisos", label: "Permisos" },
    { value: "Personas", label: "Personas" },
    { value: "Planificación de Menús", label: "Planificación de Menús" },
    { value: "Proveedores", label: "Proveedores" },
    { value: "Recetas", label: "Recetas" },
    { value: "Reportes", label: "Reportes" },
    { value: "Roles", label: "Roles" },
    { value: "Seguridad", label: "Seguridad" },
    { value: "Turnos", label: "Turnos" },
    { value: "Usuarios", label: "Usuarios" },
  ];

  useEffect(() => {
    if (permiso && mode !== "create") {
      setFormData({
        nombrePermiso: permiso.nombrePermiso || "",
        descripcionPermiso: permiso.descripcionPermiso || "",
        modulo: permiso.modulo || "Sin Módulo",
        accion: permiso.accion || "Sin Acción",
        estado: permiso.estado || "Activo",
      });
    }
    setLocalServerError(serverError);
  }, [permiso, mode, serverError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value;

    // Validar solo letras y espacios para el nombre del permiso
    if (name === "nombrePermiso") {
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
    if (name === "nombrePermiso" && localServerError) {
      setLocalServerError(null);
      if (onServerErrorClear) {
        onServerErrorClear();
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombrePermiso.trim()) {
      newErrors.nombrePermiso = "El nombre del permiso es requerido";
    } else if (formData.nombrePermiso.length > 100) {
      newErrors.nombrePermiso =
        "El nombre del permiso no puede tener más de 100 caracteres";
    } else {
      // Validar que no exista un permiso con el mismo nombre (excepto si está editando el mismo)
      const permisoDuplicado = permisosExistentes.find(
        (p) =>
          p.nombrePermiso.toLowerCase() ===
            formData.nombrePermiso.toLowerCase() &&
          (mode === "create" || p.idPermiso !== permiso?.idPermiso)
      );
      if (permisoDuplicado) {
        newErrors.nombrePermiso = `El permiso "${formData.nombrePermiso}" ya existe en el sistema`;
      }
    }

    if (!formData.descripcionPermiso.trim()) {
      newErrors.descripcionPermiso = "La descripción del permiso es requerida";
    } else if (formData.descripcionPermiso.length > 100) {
      newErrors.descripcionPermiso =
        "La descripción del permiso no puede tener más de 100 caracteres";
    }

    if (!formData.modulo.trim() || formData.modulo === "Sin Módulo") {
      newErrors.modulo = "Debe seleccionar un módulo específico";
    }

    if (!formData.accion.trim() || formData.accion === "Sin Acción") {
      newErrors.accion = "Debe seleccionar una acción específica";
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
        idPermiso: permiso?.idPermiso || permiso?.id_permiso, // Incluir ID solo si estamos editando
      };

      await onSave(dataToSend);
    } catch (error) {}
  };

  const isReadOnly = mode === "view";

  return (
    <form onSubmit={handleSubmit} className="permiso-form">
      {localServerError && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong>Error:</strong> {localServerError}
          <button
            type="button"
            className="btn-close"
            onClick={() => {
              setLocalServerError(null);
              if (onServerErrorClear) {
                onServerErrorClear();
              }
            }}
            aria-label="Close"
          ></button>
        </div>
      )}
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="nombrePermiso" className="form-label">
            Nombre del Permiso *
          </label>
          <input
            type="text"
            id="nombrePermiso"
            name="nombrePermiso"
            value={formData.nombrePermiso}
            onChange={handleChange}
            className={`form-control ${errors.nombrePermiso ? "error" : ""}`}
            placeholder="Ingrese el nombre del permiso"
            maxLength={100}
            readOnly={isReadOnly}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descripcionPermiso" className="form-label">
            Descripción del Permiso *
          </label>
          <textarea
            id="descripcionPermiso"
            name="descripcionPermiso"
            value={formData.descripcionPermiso}
            onChange={handleChange}
            className={`form-control ${
              errors.descripcionPermiso ? "error" : ""
            }`}
            placeholder="Ingrese la descripción del permiso..."
            rows={3}
            maxLength={100}
            readOnly={isReadOnly}
            required
          />
          {errors.descripcionPermiso && (
            <span className="error-message">{errors.descripcionPermiso}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="modulo" className="form-label">
            Módulo del Sistema *
          </label>
          <select
            id="modulo"
            name="modulo"
            value={formData.modulo}
            onChange={handleChange}
            className={`form-select ${errors.modulo ? "error" : ""}`}
            disabled={isReadOnly}
            required
          >
            {modulosDisponibles.map((modulo) => (
              <option key={modulo.value} value={modulo.value}>
                {modulo.label}
              </option>
            ))}
          </select>
          {errors.modulo && (
            <span className="error-message">{errors.modulo}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="accion" className="form-label">
            Acción *
          </label>
          <select
            id="accion"
            name="accion"
            value={formData.accion}
            onChange={handleChange}
            className={`form-select ${errors.accion ? "error" : ""}`}
            disabled={isReadOnly}
            required
          >
            {accionesDisponibles.map((accion) => (
              <option key={accion.value} value={accion.value}>
                {accion.label}
              </option>
            ))}
          </select>
          {errors.accion && (
            <span className="error-message">{errors.accion}</span>
          )}
        </div>

        {mode !== "create" && (
          <div className="form-group">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="form-select"
              disabled={isReadOnly}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        )}
      </div>

      {errors.nombrePermiso && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-3"
          role="alert"
        >
          <div>
            <i className="fas fa-exclamation-circle me-2"></i>
            <strong className="me-1">Error al guardar:</strong>

            {errors.nombrePermiso}
          </div>
        </div>
      )}

      {!isReadOnly && (
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            <i className="fas fa-times mr-1"></i>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save mr-1"></i>
            {mode === "create" ? "Crear Permiso" : "Actualizar Permiso"}
          </button>
        </div>
      )}

      {isReadOnly && (
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            <i className="fas fa-times mr-1"></i>
            Cerrar
          </button>
        </div>
      )}
    </form>
  );
};

export default PermisoForm;
