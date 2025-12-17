import { useState, useEffect } from "react";
import personaService from "../../services/personaService.js";
import { rolService } from "../../services/rolService.js";
import usuarioService from "../../services/usuarioService.js";

const PersonaForm = ({ persona, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: persona?.nombre || "",
    apellido: persona?.apellido || "",
    dni: persona?.dni || "",
    fechaNacimiento: persona?.fechaNacimiento
      ? persona.fechaNacimiento.split("T")[0]
      : "",
    genero: persona?.genero || "",
    idRol: persona?.idRol || "",
    estado: persona?.estado || "Activo",
  });

  // Datos para el formulario de usuario
  const [userFormData, setUserFormData] = useState({
    nombreUsuario: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    estado: "Activo",
    rol: "",
  });

  const [errors, setErrors] = useState({});
  const [userErrors, setUserErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [habilitaCuentaUsuario, setHabilitaCuentaUsuario] = useState(false);

  // Cargar roles al montar el componente
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const rolesData = await rolService.getActivos();
        setRoles(rolesData);
      } catch (error) {
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []); // Solo se ejecuta al montar

  // Efecto separado para manejar el rol inicial cuando se cargan los roles
  useEffect(() => {
    if (roles.length > 0 && !rolSeleccionado) {
      let rol = null;

      // Si estamos editando o visualizando, buscar por nombreRol
      if ((mode === "edit" || mode === "view") && persona?.nombreRol) {
        rol = roles.find((r) => r.nombreRol === persona.nombreRol);
        if (rol) {
          // Actualizar formData con el idRol correcto
          setFormData((prev) => ({ ...prev, idRol: rol.idRol }));
        }
      }
      // Si estamos creando y ya hay un idRol seleccionado
      else if (formData.idRol) {
        const rolId = parseInt(formData.idRol);
        rol = roles.find((r) => r.idRol === rolId);
      }

      if (rol) {
        setRolSeleccionado(rol);
        const habilita = rol.habilitaCuentaUsuario === "Si";
        setHabilitaCuentaUsuario(habilita);
      }
    }
  }, [roles, persona, mode, formData.idRol, rolSeleccionado]);

  // Generar nombre de usuario basado en nombre y apellido
  const generateUsername = (nombre, apellido) => {
    if (!nombre || !apellido) return "";
    return `${nombre.toLowerCase().trim()}.${apellido
      .toLowerCase()
      .trim()}`.replace(/\s+/g, "");
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Si cambia el rol, verificar si habilita cuenta de usuario
      if (name === "idRol") {
        const rolId = parseInt(value);
        const rol = roles.find((r) => r.idRol === rolId);

        if (rol) {
          setRolSeleccionado(rol);
          const habilita = rol.habilitaCuentaUsuario === "Si";
          setHabilitaCuentaUsuario(habilita);
          if (habilita) {
            // Si habilita cuenta, generar nombre de usuario si tenemos nombre y apellido
            const nombreUsuario = generateUsername(
              newData.nombre,
              newData.apellido
            );
            setUserFormData((prevUser) => ({
              ...prevUser,
              nombreUsuario: nombreUsuario,
              rol: rol.nombreRol,
            }));
          } else {
            // Si no habilita cuenta, limpiar formulario de usuario
            setUserFormData({
              nombreUsuario: "",
              email: "",
              telefono: "",
              password: "",
              confirmPassword: "",
              estado: "Activo",
              rol: "",
            });
          }
        } else {
          setRolSeleccionado(null);
          setHabilitaCuentaUsuario(false);
        }
      }

      return newData;
    });

    // Actualizar nombre de usuario si cambia nombre o apellido y el rol habilita cuenta
    if ((name === "nombre" || name === "apellido") && habilitaCuentaUsuario) {
      const nombre = name === "nombre" ? value : formData.nombre;
      const apellido = name === "apellido" ? value : formData.apellido;
      const nombreUsuario = generateUsername(nombre, apellido);

      setUserFormData((prevUser) => ({
        ...prevUser,
        nombreUsuario: nombreUsuario,
      }));
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Manejar cambios en los campos del formulario de usuario
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (userErrors[name]) {
      setUserErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El número de documento es requerido";
    } else if (formData.dni.length < 6) {
      newErrors.dni = "El documento debe tener al menos 6 caracteres";
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = "La fecha de nacimiento es requerida";
    } else {
      const fechaNac = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNac.getFullYear();
      if (edad < 3 || edad > 100) {
        newErrors.fechaNacimiento = "La edad debe estar entre 3 y 100 años";
      }
    }

    if (!formData.genero) {
      newErrors.genero = "El género es requerido";
    }

    if (!formData.idRol) {
      newErrors.idRol = "El rol es requerido";
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

    if (!userFormData.email.trim()) {
      newUserErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      newUserErrors.email = "El formato del email no es válido";
    }

    if (!userFormData.telefono.trim()) {
      newUserErrors.telefono = "El teléfono es requerido";
    } else if (!/^\d{8,15}$/.test(userFormData.telefono.replace(/\s/g, ""))) {
      newUserErrors.telefono = "El teléfono debe tener entre 8 y 15 dígitos";
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

    // Si el rol habilita cuenta de usuario, también validar formulario de usuario
    if (habilitaCuentaUsuario && !isViewMode) {
      if (!validateUserForm()) {
        return;
      }
    }

    setLoading(true);

    try {
      // Preparar datos para enviar al backend
      const rolSeleccionadoActual = roles.find(
        (r) => r.idRol == formData.idRol
      );
      const personaData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        dni: formData.dni.trim(),
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        nombreRol: rolSeleccionadoActual?.nombreRol || "",
        estado: formData.estado,
      };

      let savedPersona;

      // Crear o actualizar persona
      if (mode === "create") {
        savedPersona = await personaService.create(personaData);
      } else {
        savedPersona = await personaService.update(
          persona.idPersona,
          personaData
        );
      }

      // Si el rol habilita cuenta de usuario y es modo crear, también crear usuario
      let usuarioCreado = null;
      if (habilitaCuentaUsuario && mode === "create") {
        const usuarioData = {
          idPersona: savedPersona.idPersona,
          nombreUsuario: userFormData.nombreUsuario,
          contrasena: userFormData.password, // El modelo espera 'contrasena', no 'contrasenia'
          mail: userFormData.email,
          telefono: userFormData.telefono,
          estado: userFormData.estado,
        };

        usuarioCreado = await usuarioService.create(usuarioData);
      }

      // Pasar datos al callback del componente padre
      onSave(savedPersona, usuarioCreado);
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
        alert("Error al guardar la persona. Por favor, inténtelo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <div className="persona-form">
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Información Personal */}
          <div>
            <h4 className="section-title">Información Personal</h4>

            <div className="form-group">
              <label htmlFor="idRol" className="form-label required">
                Rol de la Persona
              </label>
              <select
                id="idRol"
                name="idRol"
                className={`form-control ${errors.idRol ? "is-invalid" : ""}`}
                value={formData.idRol}
                onChange={handleInputChange}
                disabled={isViewMode || loadingRoles}
              >
                <option value="">
                  {loadingRoles ? "Cargando roles..." : "Seleccionar Rol"}
                </option>
                {roles.map((rol) => (
                  <option key={rol.idRol} value={rol.idRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>
              {errors.idRol && (
                <div className="invalid-feedback">{errors.idRol}</div>
              )}
              {rolSeleccionado && (
                <small className="form-text text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  {rolSeleccionado.descripcionRol}
                  {rolSeleccionado.habilitaCuentaUsuario === "Si" && (
                    <span className="text-success ms-2">
                      <i className="fas fa-user-check"></i> Incluye cuenta de
                      usuario
                    </span>
                  )}
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre" className="form-label required">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  className={`form-control ${
                    errors.nombre ? "is-invalid" : ""
                  }`}
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="Ingrese el nombre"
                />
                {errors.nombre && (
                  <div className="invalid-feedback">{errors.nombre}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="apellido" className="form-label required">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  className={`form-control ${
                    errors.apellido ? "is-invalid" : ""
                  }`}
                  value={formData.apellido}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="Ingrese el apellido"
                />
                {errors.apellido && (
                  <div className="invalid-feedback">{errors.apellido}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dni" className="form-label required">
                  Número de Documento
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  className={`form-control ${errors.dni ? "is-invalid" : ""}`}
                  value={formData.dni}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  placeholder="Ingrese el número de documento"
                />
                {errors.dni && (
                  <div className="invalid-feedback">{errors.dni}</div>
                )}
              </div>

              <div className="form-group">
                <label
                  htmlFor="fechaNacimiento"
                  className="form-label required"
                >
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  className={`form-control ${
                    errors.fechaNacimiento ? "is-invalid" : ""
                  }`}
                  value={formData.fechaNacimiento}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                  max={new Date().toISOString().split("T")[0]}
                />
                {errors.fechaNacimiento && (
                  <div className="invalid-feedback">
                    {errors.fechaNacimiento}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="genero" className="form-label required">
                  Género
                </label>
                <select
                  id="genero"
                  name="genero"
                  className={`form-control ${
                    errors.genero ? "is-invalid" : ""
                  }`}
                  value={formData.genero}
                  onChange={handleInputChange}
                  disabled={isViewMode}
                >
                  <option value="">Seleccionar Género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenina">Femenina</option>
                  <option value="Otros">Otros</option>
                </select>
                {errors.genero && (
                  <div className="invalid-feedback">{errors.genero}</div>
                )}
              </div>
              {/* Estado */}

              <div className="form-group">
                <label htmlFor="estado" className="form-label required">
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

          {/* Formulario de Usuario - Solo para roles que habilitan cuenta */}
          {habilitaCuentaUsuario && !isViewMode && (
            <div className="mt-4">
              <h5 className="section-title">
                <i className="fas fa-user-shield me-2"></i>
                Cuenta de Usuario
              </h5>
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
                    value={userFormData.nombreUsuario || ""}
                    onChange={handleUserInputChange}
                    placeholder={
                      formData.nombre && formData.apellido
                        ? "Se genera automáticamente: nombre.apellido"
                        : "Complete nombre y apellido primero"
                    }
                  />
                  {userErrors.nombreUsuario && (
                    <div className="invalid-feedback">
                      {userErrors.nombreUsuario}
                    </div>
                  )}
                  {!userFormData.nombreUsuario &&
                    formData.nombre &&
                    formData.apellido && (
                      <small className="form-text text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        El nombre de usuario se generará como:{" "}
                        {generateUsername(formData.nombre, formData.apellido)}
                      </small>
                    )}
                </div>

                <div className="form-group">
                  <label htmlFor="userEmail" className="form-label required">
                    Email de Usuario
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    name="email"
                    className={`form-control ${
                      userErrors.email ? "is-invalid" : ""
                    }`}
                    value={userFormData.email}
                    onChange={handleUserInputChange}
                    placeholder="Email para la cuenta de usuario"
                  />
                  {userErrors.email && (
                    <div className="invalid-feedback">{userErrors.email}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="userTelefono" className="form-label required">
                    Teléfono de Usuario
                  </label>
                  <input
                    type="text"
                    id="userTelefono"
                    name="telefono"
                    className={`form-control ${
                      userErrors.telefono ? "is-invalid" : ""
                    }`}
                    value={userFormData.telefono}
                    onChange={handleUserInputChange}
                    placeholder="Teléfono para la cuenta de usuario"
                  />
                  {userErrors.telefono && (
                    <div className="invalid-feedback">
                      {userErrors.telefono}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    La fecha de alta se establecerá automáticamente
                  </small>
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
                    placeholder="Contraseña (mínimo 6 caracteres)"
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
                  <label htmlFor="estadoUsuario" className="form-label">
                    Estado de Usuario
                  </label>
                  <select
                    id="estadoUsuario"
                    name="estado"
                    className="form-control"
                    value={userFormData.estado}
                    onChange={handleUserInputChange}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                  <small className="form-text text-muted">
                    La fecha de última actividad se actualizará automáticamente
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Información de Usuario - Solo en modo visualización para roles que habilitan cuenta */}
          {habilitaCuentaUsuario && isViewMode && (
            <div className="mt-2">
              <h5 className="section-title">
                <i className="fas fa-user-shield me-2"></i>
                Información de Cuenta de Usuario
              </h5>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Esta persona tiene un rol que habilita cuenta de usuario. Para
                ver los detalles específicos de la cuenta, consulte la sección
                de gestión de usuarios.
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="form-actions mt-4">
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
                    ? habilitaCuentaUsuario
                      ? "Crear Persona y Usuario"
                      : "Crear Persona"
                    : "Actualizar Persona"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PersonaForm;
