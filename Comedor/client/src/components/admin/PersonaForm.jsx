import { useState, useEffect } from "react";
import personaService from "../../services/personaService.js";
import { rolService } from "../../services/rolService.js";
import usuarioService from "../../services/usuarioService.js";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ComponenteStyle from "../../styles/Componentes.module.css";

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
  const [serverError, setServerError] = useState(null);

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
    let valorPermitido = value;

    if (name === "nombre" || name === "apellido") {
      // Permitir solo letras y espacios en los campos nombre y apellido
      valorPermitido = value.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ\s]/g, "");
    } else if (name === "dni") {
      // Permitir solo números en el campo dni
      const soloNumeros = value.replace(/[^0-9]/g, "");
      valorPermitido = soloNumeros.slice(0, 8); // Máximo 8 caracteres
      // Limpiar error de servidor cuando el usuario edita el DNI
      setServerError(null);
      setErrors((prev) => ({ ...prev, dni: "" }));
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: valorPermitido };

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
              newData.apellido,
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
    let valorPermitido = value;

    if (name === "telefono") {
      // Permitir solo números y espacios en el campo teléfono
      let processedValue = value;

      // Asegurar que empiece con +54
      if (!processedValue.startsWith("+54")) {
        // Si no empieza con +54, asumir que el usuario está escribiendo solo números
        const soloNumeros = processedValue.replace(/\D/g, ""); // \D quita todo lo que no sea número
        processedValue = "+54" + soloNumeros;
      } else {
        // Si ya empieza con +54, extraer solo números después de +54
        const soloNumeros = processedValue.substring(3).replace(/\D/g, "");
        processedValue = "+54" + soloNumeros;
      }

      // Limitar a 10 dígitos después del +54
      const numerosLimitados = processedValue.substring(3).slice(0, 10);
      valorPermitido = "+54" + numerosLimitados;
    }

    setUserFormData((prev) => ({
      ...prev,
      [name]: valorPermitido,
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
    } else {
      // Extraer solo los dígitos del teléfono (sin +54)
      const soloDigitos = userFormData.telefono.replace(/\D/g, "");
      if (soloDigitos.length < 8 || soloDigitos.length > 15) {
        newUserErrors.telefono = "El teléfono debe tener entre 8 y 15 dígitos";
      }
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
        (r) => r.idRol == formData.idRol,
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
          personaData,
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
      const errorMessage = error.response?.data?.message || error.message;

      // Verificar si es error de DNI duplicado
      if (
        error.response?.status === 409 ||
        errorMessage.toLowerCase().includes("dni") ||
        errorMessage.toLowerCase().includes("duplicado")
      ) {
        setServerError(errorMessage);
        setErrors((prev) => ({ ...prev, dni: errorMessage }));
      } else if (error.response?.data?.message) {
        showError("Error", `${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        showError("Error", `Errores de validación:\n${errorMessages}`);
      } else {
        showError(
          "Error",
          "Error al guardar la persona. Por favor, inténtelo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <form onSubmit={handleSubmit}>
      <h4 className={ComponenteStyle.sectionTitle}>
        <i className="fas fa-info-circle me-2"></i>
        Información Personal
      </h4>
      <div className={ComponenteStyle.formGrid}>
        <div className={ComponenteStyle.formGroup}>
          <label
            htmlFor="idRol"
            className={`${ComponenteStyle.formLabel} required`}
          >
            Rol de la Persona
          </label>
          <select
            id="idRol"
            name="idRol"
            className={`${ComponenteStyle.formControl} ${errors.idRol ? ComponenteStyle.isInvalid : ""}`}
            value={formData.idRol}
            onChange={handleInputChange}
            disabled={isViewMode || loadingRoles}
          >
            <option value="">
              {loadingRoles ? "Cargando roles..." : "Seleccionar Rol"}
            </option>
            {roles
              .filter((rol) => rol.nombreRol?.toLowerCase() !== "proveedor")
              .map((rol) => (
                <option key={rol.idRol} value={rol.idRol}>
                  {rol.nombreRol}
                </option>
              ))}
          </select>

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

        <div className={ComponenteStyle.formRow}>
          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="nombre"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className={`${ComponenteStyle.formControl} ${errors.nombre ? ComponenteStyle.isInvalid : ""}`}
              value={formData.nombre}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="Ingrese el nombre"
            />
          </div>

          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="apellido"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Apellido
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              className={`${ComponenteStyle.formControl} ${errors.apellido ? ComponenteStyle.isInvalid : ""}`}
              value={formData.apellido}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="Ingrese el apellido"
            />
          </div>
        </div>

        <div className={ComponenteStyle.formRow}>
          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="dni"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Número de Documento
            </label>
            <input
              type="text"
              id="dni"
              name="dni"
              className={`${ComponenteStyle.formControl} ${errors.dni ? ComponenteStyle.isInvalid : ""}`}
              value={formData.dni}
              onChange={handleInputChange}
              disabled={isViewMode}
              placeholder="Ingrese el número de documento"
            />
          </div>

          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="fechaNacimiento"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              className={`${ComponenteStyle.formControl} ${
                errors.fechaNacimiento ? ComponenteStyle.isInvalid : ""
              }`}
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              disabled={isViewMode}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className={ComponenteStyle.formRow}>
          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="genero"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Género
            </label>
            <select
              id="genero"
              name="genero"
              className={`${ComponenteStyle.formControl} ${errors.genero ? ComponenteStyle.isInvalid : ""}`}
              value={formData.genero}
              onChange={handleInputChange}
              disabled={isViewMode}
            >
              <option value="">Seleccionar Género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenina">Femenina</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className={ComponenteStyle.formGroup}>
            <label
              htmlFor="estado"
              className={`${ComponenteStyle.formLabel} required`}
            >
              Estado
            </label>
            <select
              id="estado"
              name="estado"
              className={`${ComponenteStyle.formControl} ${errors.estado ? ComponenteStyle.isInvalid : ""}`}
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
        <div>
          <h4 className={ComponenteStyle.sectionTitle}>
            <i className="fas fa-user-shield me-2"></i>
            Cuenta de Usuario
          </h4>
          <div className={ComponenteStyle.formGrid}>
            <div className={ComponenteStyle.formRow}>
              <div className={ComponenteStyle.formGroup}>
                <label
                  htmlFor="nombreUsuario"
                  className={`${ComponenteStyle.formLabel} required`}
                >
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  id="nombreUsuario"
                  name="nombreUsuario"
                  className={`${ComponenteStyle.formControl} ${
                    userErrors.nombreUsuario ? ComponenteStyle.isInvalid : ""
                  }`}
                  value={userFormData.nombreUsuario || ""}
                  onChange={handleUserInputChange}
                  placeholder={
                    formData.nombre && formData.apellido
                      ? "Se genera automáticamente: nombre.apellido"
                      : "Complete nombre y apellido primero"
                  }
                />

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

              <div className={ComponenteStyle.formGroup}>
                <label
                  htmlFor="userEmail"
                  className={`${ComponenteStyle.formLabel} required`}
                >
                  Email de Usuario
                </label>
                <input
                  type="email"
                  id="userEmail"
                  name="email"
                  className={`${ComponenteStyle.formControl} ${
                    userErrors.email ? ComponenteStyle.isInvalid : ""
                  }`}
                  value={userFormData.email}
                  onChange={handleUserInputChange}
                  placeholder="Email para la cuenta de usuario"
                />
              </div>
            </div>

            <div className={ComponenteStyle.formRow}>
              <div className={ComponenteStyle.formGroup}>
                <label
                  htmlFor="userTelefono"
                  className={`${ComponenteStyle.formLabel} required`}
                >
                  Teléfono de Usuario
                </label>
                <input
                  type="text"
                  id="userTelefono"
                  name="telefono"
                  className={`${ComponenteStyle.formControl} ${
                    userErrors.telefono ? ComponenteStyle.isInvalid : ""
                  }`}
                  value={userFormData.telefono}
                  onChange={handleUserInputChange}
                  maxLength="13"
                  inputMode="tel"
                  placeholder="Teléfono para la cuenta de usuario"
                />

                <small className="form-text text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Ingrese el número de teléfono luego del +54 con la
                  caracteristica de área sin 15.
                </small>
              </div>
            </div>

            <div className={ComponenteStyle.formRow}>
              <div className={ComponenteStyle.formGroup}>
                <label
                  htmlFor="password"
                  className={`${ComponenteStyle.formLabel} required`}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`${ComponenteStyle.formControl} ${
                    userErrors.password ? ComponenteStyle.isInvalid : ""
                  }`}
                  value={userFormData.password}
                  onChange={handleUserInputChange}
                  placeholder="Contraseña (mínimo 6 caracteres)"
                />
              </div>

              <div className={ComponenteStyle.formGroup}>
                <label
                  htmlFor="confirmPassword"
                  className={`${ComponenteStyle.formLabel} required`}
                >
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`${ComponenteStyle.formControl} ${
                    userErrors.confirmPassword ? ComponenteStyle.isInvalid : ""
                  }`}
                  value={userFormData.confirmPassword}
                  onChange={handleUserInputChange}
                  placeholder="Confirme la contraseña"
                />
              </div>
            </div>

            <div className={ComponenteStyle.formRow}>
              <div className={ComponenteStyle.formGroup}>
                <label
                  htmlFor="estadoUsuario"
                  className={`${ComponenteStyle.formLabel}`}
                >
                  Estado de Usuario
                </label>
                <select
                  id="estadoUsuario"
                  name="estado"
                  className={`${ComponenteStyle.formControl} ${errors.estado ? "is-invalid" : ""}`}
                  value={userFormData.estado}
                  onChange={handleUserInputChange}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                <small className={ComponenteStyle.formText}>
                  La fecha de última actividad se actualizará automáticamente
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de Usuario - Solo en modo visualización para roles que habilitan cuenta */}
      {habilitaCuentaUsuario && isViewMode && (
        <div className="mt-2">
          <h5 className={ComponenteStyle.sectionTitle}>
            <i className="fas fa-user-shield me-2"></i>
            Información de Cuenta de Usuario
          </h5>
          <div
            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo}`}
          >
            <i className="fas fa-info-circle me-2"></i>
            Esta persona tiene un rol que habilita cuenta de usuario. Para ver
            los detalles específicos de la cuenta, consulte la sección de
            gestión de usuarios.
          </div>
        </div>
      )}

      {/*Mensaje de errores*/}

      {errors.idRol && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.idRol}
        </div>
      )}

      {errors.nombre && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.nombre}
        </div>
      )}

      {errors.apellido && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.apellido}
        </div>
      )}

      {errors.dni && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.dni}
        </div>
      )}

      {errors.fechaNacimiento && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.fechaNacimiento}
        </div>
      )}

      {errors.genero && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {errors.genero}
        </div>
      )}

      {userErrors.nombreUsuario && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {userErrors.nombreUsuario}
        </div>
      )}

      {userErrors.email && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {userErrors.email}
        </div>
      )}

      {userErrors.telefono && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {userErrors.telefono}
        </div>
      )}

      {userErrors.password && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertInfo} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {userErrors.password}
        </div>
      )}

      {userErrors.confirmPassword && (
        <div
          className={`${ComponenteStyle.alert} ${ComponenteStyle.alertDanger} alert-dismissible fade show`}
          role="alert"
        >
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong className="me-1">Error:</strong> {userErrors.confirmPassword}
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
  );
};

export default PersonaForm;
