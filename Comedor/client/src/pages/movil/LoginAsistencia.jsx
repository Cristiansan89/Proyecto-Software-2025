import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import "../../styles/LoginAsistencia.css";

const LoginAsistencia = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formulario, setFormulario] = useState({
    usuario: "",
    password: "",
  });

  // Limpiar tokens viejos cuando se accede a esta página
  useEffect(() => {
    console.log("🧹 LoginAsistencia: Limpiando tokens viejos del localStorage");
    localStorage.removeItem("token");
    localStorage.removeItem("asistenciaToken");
    localStorage.removeItem("user");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.usuario || !formulario.password) {
      setError("Por favor ingrese usuario y contraseña");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Primero validar que el token existe y es válido
      console.log("🔍 Validando token de asistencia...");
      const tokenValidation = await API.get(`/asistencias/registro/${token}`);
      const tokenData = tokenValidation.data.tokenData;

      console.log("✅ Token válido para:", {
        docente: tokenData.nombreDocente,
        grado: tokenData.nombreGrado,
      });

      // Luego autenticar al docente
      console.log("🔐 Autenticando docente...");
      const loginResponse = await API.post("/auth/login", {
        nombreUsuario: formulario.usuario,
        contrasena: formulario.password,
      });

      const userData = loginResponse.data.user;

      // VALIDACIÓN CRÍTICA: Verificar que el docente logueado coincide con el del token
      if (userData.idPersona !== tokenData.idPersonaDocente) {
        setError(
          `❌ Acceso Denegado: Este enlace es para ${tokenData.nombreDocente}. ` +
            `Tú eres ${userData.nombre}.`
        );
        console.error("⚠️ Intento de acceso no autorizado", {
          docenteToken: tokenData.idPersonaDocente,
          docenteLogin: userData.idPersona,
          nombreToken: tokenData.nombreDocente,
          nombreLogin: userData.nombre,
        });
        return;
      }

      // Verificar que el docente está asignado al grado del token
      if (!userData.gradosAsignados || userData.gradosAsignados.length === 0) {
        setError(
          `❌ No tienes grados asignados. Contacta al administrador.`
        );
        console.error("⚠️ Usuario sin grados asignados", {
          usuario: userData.nombreUsuario,
          gradosAsignados: userData.gradosAsignados,
        });
        return;
      }

      const gradoAsignado = userData.gradosAsignados?.some(
        (g) => g.nombreGrado === tokenData.nombreGrado
      );

      if (!gradoAsignado) {
        setError(
          `❌ No estás asignado al grado ${tokenData.nombreGrado}. ` +
            `Tus grados: ${userData.gradosAsignados?.map((g) => g.nombreGrado).join(", ")}`
        );
        console.error("⚠️ Docente no asignado al grado", {
          docenteGrados: userData.gradosAsignados,
          gradoRequerido: tokenData.nombreGrado,
        });
        return;
      }

      // Todo validado correctamente
      console.log("✅ Validaciones completadas. Acceso permitido.");

      // Guardar datos de sesión
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", loginResponse.data.token);
      localStorage.setItem("asistenciaToken", token);

      setSuccess(
        `✅ Bienvenido ${userData.nombre}. Accediendo a asistencia...`
      );

      // Redirigir a la página de asistencia con el token
      setTimeout(() => {
        navigate(`/asistencias/registro/${token}`);
      }, 1500);
    } catch (error) {
      console.error("❌ Error en login:", error);

      if (error.response?.status === 401) {
        setError("❌ Usuario o contraseña incorrectos");
      } else if (error.response?.data?.message) {
        setError(`❌ ${error.response.data.message}`);
      } else {
        setError("❌ Error al iniciar sesión. Intente nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-asistencia-container">
      <div className="login-asistencia-card">
        {/* Header */}
        <div className="login-asistencia-header">
          <div className="icon-circle">
            <i className="fas fa-lock"></i>
          </div>
          <h1>Iniciar Sesión</h1>
          <p>Registro de Asistencia Docente</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <div className="alert alert-success">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="usuario">
              <i className="fas fa-user me-2"></i>
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              className="form-control"
              placeholder="tu_usuario"
              value={formulario.usuario}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-key me-2"></i>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formulario.password}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-login" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Verificando...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt me-2"></i>
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Información */}
        <div className="login-info">
          <div className="info-item">
            <i className="fas fa-shield-alt"></i>
            <span>Acceso seguro y validado</span>
          </div>
          <div className="info-item">
            <i className="fas fa-check-circle"></i>
            <span>Solo docentes autorizados</span>
          </div>
          <div className="info-item">
            <i className="fas fa-graduation-cap"></i>
            <span>Por grado asignado</span>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <small>
            🔒 Este enlace es personal y no debe compartirse.
            <br />
            Válido por 24 horas.
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginAsistencia;
