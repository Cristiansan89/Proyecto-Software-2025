import { useState, useEffect } from "react";
import personaService from "../../services/personaService.js";
import usuarioService from "../../services/usuarioService.js";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showInfoError,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const ProveedorForm = ({ proveedor, mode, onSave, onCancel }) => {
  // Función para formatear el CUIT
  const formatCUIT = (cuit) => {
    // Eliminar caracteres no numéricos
    const digits = cuit.replace(/\D/g, "");

    // Limitar a 11 dígitos
    const limitedDigits = digits.slice(0, 11);

    // Aplicar máscara
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 10) {
      return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(
        2,
        limitedDigits.length - 1
      )}-${limitedDigits.slice(-1)}`;
    } else {
      return `${limitedDigits.slice(0, 2)}-${limitedDigits.slice(
        2,
        10
      )}-${limitedDigits.slice(10)}`;
    }
  };

  const [formData, setFormData] = useState({
    razonSocial: proveedor?.razonSocial || "",
    CUIT: proveedor?.CUIT ? formatCUIT(proveedor.CUIT) : "",
    direccion: proveedor?.direccion || "",
    telefono: proveedor?.telefono || "",
    mail: proveedor?.mail || "",
    estado: proveedor?.estado || "Activo",
  });

  // Datos para el formulario de usuario
  const [userFormData, setUserFormData] = useState({
    nombreUsuario: proveedor?.usuario?.nombreUsuario || "",
    password: "",
    confirmPassword: "",
    mail: proveedor?.mail || "",
    telefono: proveedor?.telefono || "",
    estado: proveedor?.usuario?.estado || "Activo",
  });

  const [errors, setErrors] = useState({});
  const [userErrors, setUserErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sincronizar email y teléfono del usuario con el proveedor
  useEffect(() => {
    setUserFormData((prev) => ({
      ...prev,
      mail: formData.mail,
      telefono: formData.telefono,
    }));
  }, [formData.mail, formData.telefono]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorPermitido = value;

    // Validaciones específicas por campo
    if (name === "razonSocial") {
      // Permitir solo letras, números, guiones y espacios para razón social
      valorPermitido = value.replace(/[^A-ZáéíóúÁÉÍÓÚÑñ0-9\s_-]/gi, "");
    } else if (name === "CUIT") {
      // Permitir solo números y guiones para CUIT
      valorPermitido = formatCUIT(value);
    } else if (name === "telefono") {
      // Permitir solo números y espacios en el campo teléfono
      if (!value.startsWith("+54")) {
        valorPermitido = "+54";
      }
      const numeros = value.substring(3).replace(/\D/g, ""); // \D quita todo lo que no sea número
      const numerosLimitados = numeros.slice(0, 10); // Limitar a 10 dígitos después del +54
      valorPermitido = "+54" + numerosLimitados;
    } else if (name === "mail") {
      // Permitir solo caracteres válidos para email
      valorPermitido = value.replace(/[^a-zA-Z0-9@._-]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: valorPermitido,
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

  // Manejar cambios en los campos del formulario de usuario
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;

    setUserFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (userErrors[name]) {
      setUserErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Extraemos solo los números para validar la longitud real del CUIT
    const cuitDigits = formData.CUIT.replace(/\D/g, "");

    // Validaciones requeridas
    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = "La razón social es requerida";
    } else if (formData.razonSocial.length > 100) {
      newErrors.razonSocial = "La razón social no puede exceder 100 caracteres";
    }

    if (!formData.CUIT.trim()) {
      newErrors.CUIT = "El CUIT es requerido";
    } else if (cuitDigits.length !== 11) {
      newErrors.CUIT = "El CUIT debe tener 11 dígitos";
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

  const validateUserForm = () => {
    const newUserErrors = {};

    if (!userFormData.nombreUsuario.trim()) {
      newUserErrors.nombreUsuario = "El nombre de usuario es requerido";
    } else if (userFormData.nombreUsuario.length < 3) {
      newUserErrors.nombreUsuario =
        "El nombre de usuario debe tener al menos 3 caracteres";
    }

    if (!userFormData.password) {
      newUserErrors.password = "La contraseña es requerida";
    } else if (userFormData.password.length < 6) {
      newUserErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!userFormData.confirmPassword) {
      newUserErrors.confirmPassword = "Confirme la contraseña";
    } else if (userFormData.password !== userFormData.confirmPassword) {
      newUserErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setUserErrors(newUserErrors);
    return Object.keys(newUserErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // En modo create: siempre validar usuario
    if (mode === "create" && !validateUserForm()) {
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      // Preparar datos para enviar al backend
      const proveedorData = {
        razonSocial: formData.razonSocial.trim(),
        CUIT: formData.CUIT.replace(/\D/g, ""), // Enviar solo números al backend
        direccion: formData.direccion.trim() || null,
        telefono: formData.telefono.trim() || null,
        mail: formData.mail.trim(),
        estado: formData.estado,
      };

      // En modo create, agregar datos de usuario al objeto proveedor
      if (mode === "create") {
        proveedorData.usuario = {
          nombreUsuario: userFormData.nombreUsuario,
          contrasena: userFormData.password,
        };
      }

      // Guardar proveedor
      const savedProveedor = await onSave(proveedorData);

      // Mensaje de éxito
      if (mode === "create") {
        showSuccess("Éxito", "Proveedor y usuario creados correctamente");
      } else {
        showSuccess("Éxito", "Proveedor actualizado correctamente");
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);

      if (error.response?.status === 409) {
        setServerError(
          error.response?.data?.message ||
            "Ya existe un proveedor con estos datos"
        );
      } else if (error.response?.data?.message) {
        showInfoError("Información", `Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        showInfoError(
          "Información",
          `Errores de validación:\n${errorMessages}`
        );
      } else if (error.message) {
        showError("Error", `Error: ${error.message}`);
      } else {
        showError(
          "Error",
          "Error al guardar el proveedor. Por favor, inténtelo de nuevo."
        );
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
                placeholder="Ingrese el CUIT del proveedor 30-12345678-9"
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
                  maxLength="13"
                  inputMode="tel"
                  placeholder="Teléfono"
                />
                {errors.telefono && (
                  <div className="invalid-feedback">{errors.telefono}</div>
                )}
                <small className="form-text text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Ingrese el número de teléfono luego del +54 con la
                  caracteristica de área sin 15.
                </small>
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

            {/* Sección para crear usuario - Solo visible en modo create */}
            {mode === "create" && (
              <div>
                {/* Datos de Usuario */}
                <h5 className="section-title mt-5">
                  Cuenta de Usuario del Proveedor
                </h5>
                <div className="alert alert-warning" role="alert">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong className="me-1">Nota:</strong> El email y teléfono se
                  tomarán de la información del proveedor
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label
                      htmlFor="nombreUsuario"
                      className="form-label required"
                    >
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      id="nombreUsuario"
                      name="nombreUsuario"
                      className={`form-control ${
                        userErrors.nombreUsuario ? "is-invalid" : ""
                      }`}
                      value={userFormData.nombreUsuario}
                      onChange={handleUserInputChange}
                      disabled={mode === "view"}
                      placeholder="Nombre de usuario único"
                    />
                    {userErrors.nombreUsuario && (
                      <div className="invalid-feedback">
                        {userErrors.nombreUsuario}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label required">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className={`form-control ${
                        userErrors.password ? "is-invalid" : ""
                      }`}
                      value={userFormData.password}
                      onChange={handleUserInputChange}
                      disabled={mode === "view"}
                      placeholder="Mínimo 6 caracteres"
                    />
                    {userErrors.password && (
                      <div className="invalid-feedback">
                        {userErrors.password}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label required"
                    >
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form-control ${
                        userErrors.confirmPassword ? "is-invalid" : ""
                      }`}
                      value={userFormData.confirmPassword}
                      onChange={handleUserInputChange}
                      disabled={mode === "view"}
                      placeholder="Confirme la contraseña"
                    />
                    {userErrors.confirmPassword && (
                      <div className="invalid-feedback">
                        {userErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label
                      htmlFor="mailUsuario"
                      className="form-label required"
                    >
                      Email del Usuario
                    </label>
                    <input
                      type="email"
                      id="mailUsuario"
                      name="mail"
                      className="form-control"
                      value={userFormData.mail}
                      onChange={() => {}}
                      disabled={true}
                      placeholder="Se toma del email del proveedor"
                    />
                    <small className="form-text text-muted">
                      Se actualiza automáticamente con el email del proveedor
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="telefonoUsuario" className="form-label">
                      Teléfono del Usuario
                    </label>
                    <input
                      type="tel"
                      id="telefonoUsuario"
                      name="telefono"
                      className="form-control"
                      value={userFormData.telefono}
                      onChange={() => {}}
                      disabled={true}
                      placeholder="Se toma del teléfono del proveedor"
                    />
                    <small className="form-text text-muted">
                      Se actualiza automáticamente con el teléfono del proveedor
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label
                      htmlFor="estadoUsuario"
                      className="form-label required"
                    >
                      Estado del Usuario
                    </label>
                    <select
                      id="estadoUsuario"
                      name="estado"
                      className="form-control"
                      value={userFormData.estado}
                      onChange={handleUserInputChange}
                      disabled={mode === "view"}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
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

        {/* Alerta de error del servidor */}
        {serverError && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <i className="fas fa-exclamation-circle me-2"></i>
            {serverError}
          </div>
        )}

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
                  {isCreateMode
                    ? "Crear Proveedor y Usuario"
                    : "Actualizar Proveedor"}
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
