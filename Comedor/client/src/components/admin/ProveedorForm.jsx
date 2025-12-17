import { useState } from "react";

const ProveedorForm = ({ proveedor, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    razonSocial: proveedor?.razonSocial || "",
    CUIT: proveedor?.CUIT || "",
    direccion: proveedor?.direccion || "",
    telefono: proveedor?.telefono || "",
    mail: proveedor?.mail || "",
    estado: proveedor?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = "La razón social es requerida";
    } else if (formData.razonSocial.length > 100) {
      newErrors.razonSocial = "La razón social no puede exceder 100 caracteres";
    }

    if (!formData.CUIT.trim()) {
      newErrors.CUIT = "El CUIT es requerido";
    } else if (formData.CUIT.length < 11 || formData.CUIT.length > 13) {
      newErrors.CUIT = "El CUIT debe tener entre 11 y 13 caracteres";
    }

    if (!formData.mail.trim()) {
      newErrors.mail = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
      newErrors.mail = "El formato del email no es válido";
    }

    if (formData.direccion && formData.direccion.length > 100) {
      newErrors.direccion = "La dirección no puede exceder 100 caracteres";
    }

    if (formData.telefono && formData.telefono.length > 20) {
      newErrors.telefono = "El teléfono no puede exceder 20 caracteres";
    }

    if (!formData.estado) {
      newErrors.estado = "El estado es requerido";
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
      // Preparar datos para enviar al backend
      const proveedorData = {
        razonSocial: formData.razonSocial.trim(),
        CUIT: formData.CUIT.trim(),
        direccion: formData.direccion.trim() || null,
        telefono: formData.telefono.trim() || null,
        mail: formData.mail.trim(),
        estado: formData.estado,
      };

      onSave(proveedorData);
    } catch (error) {
      // Mostrar error al usuario
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        alert(`Errores de validación:\n${errorMessages}`);
      } else {
        alert("Error al guardar el proveedor. Por favor, inténtelo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <div className="proveedor-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Información Básica */}
          <div>
            <h5 className="section-title">Información del Proveedor</h5>

            <div className="form-group">
              <label htmlFor="razonSocial" className="form-label required ">
                Razón Social
              </label>
              <input
                type="text"
                id="razonSocial"
                name="razonSocial"
                className={`form-control ${
                  errors.razonSocial ? "is-invalid" : ""
                }`}
                value={formData.razonSocial}
                onChange={handleInputChange}
                disabled={isViewMode}
                placeholder="Ingrese la razón social del proveedor"
                maxLength="100"
              />
              {errors.razonSocial && (
                <div className="invalid-feedback">{errors.razonSocial}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="CUIT" className="form-label required ">
                CUIT
              </label>
              <input
                type="text"
                id="CUIT"
                name="CUIT"
                className={`form-control ${errors.CUIT ? "is-invalid" : ""}`}
                value={formData.CUIT}
                onChange={handleInputChange}
                disabled={isViewMode}
                placeholder="Ingrese el CUIT del proveedor (ej: 20-12345678-9)"
                maxLength="13"
              />
              {errors.CUIT && (
                <div className="invalid-feedback">{errors.CUIT}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="direccion" className="form-label ">
                Dirección
              </label>
              <textarea
                id="direccion"
                name="direccion"
                className={`form-control ${
                  errors.direccion ? "is-invalid" : ""
                }`}
                value={formData.direccion}
                onChange={handleInputChange}
                disabled={isViewMode}
                placeholder="Ingrese la dirección completa del proveedor (opcional)"
                rows="3"
                maxLength="100"
              />
              {errors.direccion && (
                <div className="invalid-feedback">{errors.direccion}</div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono" className="form-label ">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  className={`form-control ${
                    errors.telefono ? "is-invalid" : ""
                  }`}
                  value={formData.telefono}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="Ingrese número teléfono"
                  maxLength="20"
                />
                {errors.telefono && (
                  <div className="invalid-feedback">{errors.telefono}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="mail" className="form-label required ">
                  Email
                </label>
                <input
                  type="email"
                  id="mail"
                  name="mail"
                  className={`form-control ${errors.mail ? "is-invalid" : ""}`}
                  value={formData.mail}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="proveedor@empresa.com"
                  maxLength="100"
                />
                {errors.mail && (
                  <div className="invalid-feedback">{errors.mail}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="estado" className="form-label required ">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                className={`form-control ${errors.estado ? "is-invalid" : ""}`}
                value={formData.estado}
                onChange={handleInputChange}
                disabled={isViewMode}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              {errors.estado && (
                <div className="invalid-feedback">{errors.estado}</div>
              )}
            </div>
          </div>

          {/* Información adicional en modo vista */}
          {isViewMode && proveedor && (
            <div className="mt-4">
              <div className="separar-secciones-info"></div>
              <h5 className="section-title">
                <i className="fas fa-info-circle me-2"></i>
                Información Adicional
              </h5>

              <div className="info-card">
                <div className="info-row">
                  <span className="info-label">CUIT:</span>
                  <span className="info-value">{proveedor.CUIT}</span>
                </div>
                {proveedor.fechaAlta && (
                  <div className="info-row">
                    <span className="info-label">Fecha de Registro:</span>
                    <span className="info-value">
                      {new Date(proveedor.fechaAlta).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {proveedor.fechaModificacion && (
                  <div className="info-row">
                    <span className="info-label">Última Modificación:</span>
                    <span className="info-value">
                      {new Date(
                        proveedor.fechaModificacion
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Total de Insumos:</span>
                  <span className="info-value">
                    {proveedor.insumos?.length || 0} insumos asignados
                  </span>
                </div>
              </div>

              {/* Lista de insumos asignados */}
              {proveedor.insumos && proveedor.insumos.length > 0 && (
                <div className="">
                  <h6 className="info-title">Insumos Asignados:</h6>
                  <div className="insumos-assigned-list">
                    {proveedor.insumos.map((insumo, index) => (
                      <div key={index} className="insumo-assigned-item">
                        <div className="insumo-info">
                          <i className="fas fa-box me-2"></i>
                          <span className="insumo-name">
                            {insumo.nombreInsumo}
                          </span>
                        </div>
                        <div className="calificacion-info">
                          <span
                            className={`badge ${
                              insumo.calificacion === "Excelente"
                                ? "bg-success"
                                : insumo.calificacion === "Aceptable"
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                          >
                            {insumo.calificacion}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="form-actions">
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
                  {isCreateMode ? "Crear Proveedor" : "Actualizar Proveedor"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProveedorForm;
