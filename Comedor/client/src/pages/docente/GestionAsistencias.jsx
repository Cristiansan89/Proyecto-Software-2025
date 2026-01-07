import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import { showError } from "../../utils/alertService";

const GestionAsistencias = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [gradoDocente, setGradoDocente] = useState(null);
  const [enlaces, setEnlaces] = useState([]);

  const [formulario, setFormulario] = useState({
    fecha: new Date().toISOString().split("T")[0],
    idServicio: "",
  });

  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar grado asignado al docente
      const gradosRes = await API.get(
        `/docente-grados?idPersona=${user.idPersona || user.id_persona}`
      );
      const gradosDocente = gradosRes.data || [];

      // Tomar el primer grado como principal
      const gradoPrincipal = gradosDocente.length > 0 ? gradosDocente[0] : null;
      setGradoDocente(gradoPrincipal);

      // Cargar servicios
      const serviciosRes = await API.get("/servicios");
      setServicios(
        serviciosRes.data.filter((s) => s.estado === "Activo") || []
      );
    } catch (error) {
      //console.error('Error al cargar datos:', error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los datos iniciales. Por favor, intente nuevamente más tarde."
      );

      setMensaje({
        tipo: "error",
        texto: "Error al cargar los datos iniciales",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMensaje({ tipo: "", texto: "" });
  };

  const generarEnlace = async (e) => {
    e.preventDefault();

    if (!gradoDocente) {
      setMensaje({ tipo: "error", texto: "No tienes un grado asignado" });
      return;
    }

    if (!formulario.fecha || !formulario.idServicio) {
      setMensaje({
        tipo: "error",
        texto: "La fecha y el servicio son requeridos",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/asistencias/generar-token", {
        idPersonaDocente: gradoDocente.idPersona,
        nombreGrado: gradoDocente.nombreGrado,
        fecha: formulario.fecha,
        idServicio: parseInt(formulario.idServicio),
      });

      const nuevoEnlace = {
        ...response.data,
        docenteNombre: gradoDocente.nombre || user?.nombres || user?.nombre,
        docenteApellido:
          gradoDocente.apellido || user?.apellidos || user?.apellido || "",
        servicioNombre:
          servicios.find(
            (s) => s.id_servicio.toString() === formulario.idServicio
          )?.nombre || "",
        nombreGrado: gradoDocente.nombreGrado,
        fecha: formulario.fecha,
        fechaGeneracion: new Date().toISOString(),
      };

      setEnlaces((prev) => [nuevoEnlace, ...prev]);
      setMensaje({
        tipo: "success",
        texto: "✅ Enlace generado correctamente",
      });

      // Limpiar formulario
      setFormulario({
        fecha: new Date().toISOString().split("T")[0],
        idServicio: "",
      });
    } catch (error) {
      //console.error("Error al generar enlace:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al generar el enlace de asistencia. Por favor, intente nuevamente más tarde."
      );
      setMensaje({ tipo: "error", texto: "Error al generar el enlace" });
    } finally {
      setLoading(false);
    }
  };

  const copiarEnlace = (enlace) => {
    navigator.clipboard.writeText(enlace).then(() => {
      setMensaje({
        tipo: "success",
        texto: "📋 Enlace copiado al portapapeles",
      });
      setTimeout(() => setMensaje({ tipo: "", texto: "" }), 3000);
    });
  };

  const enviarPorWhatsApp = (enlace, servicio, grado, fecha) => {
    const mensaje =
      `🍽️ *Registro de Asistencia - ${servicio}*\n\n` +
      `📚 Grado: ${grado}\n` +
      `📅 Fecha: ${new Date(fecha + "T00:00:00").toLocaleDateString(
        "es-ES"
      )}\n\n` +
      `Enlace para registrar asistencia:\n\n` +
      `${enlace}\n\n` +
      `El enlace es válido por 24 horas.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!user) {
    return (
      <div className="gestion-asistencias">
        <div className="card">
          <div className="card-body text-center">
            <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
            <h4>No hay usuario autenticado</h4>
            <p>Por favor, inicia sesión para acceder a esta función</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-asistencias">
      <div className="header-section">
        <h2>📋 Mis Enlaces de Asistencia</h2>
        <p>Genera enlaces únicos para registrar la asistencia de tus alumnos</p>
      </div>

      {/* Información del Grado */}
      {gradoDocente ? (
        <div className="card info-card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div className="grado-info">
                <h4 className="mb-0">� Mi Grado: {gradoDocente.nombreGrado}</h4>
                <p className="mb-0 text-muted">
                  Ciclo {new Date(gradoDocente.cicloLectivo).getFullYear()}
                </p>
              </div>
              <div className="badges">
                <span className="badge bg-success">
                  {gradoDocente.tipoDocente || "Docente"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center">
            <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
            <h4>No tienes un grado asignado</h4>
            <p>Contacta al administrador para que te asigne un grado</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      {gradoDocente && (
        <div className="card form-card">
          <div className="card-header">
            <h3>🔗 Generar Nuevo Enlace</h3>
          </div>
          <div className="card-body">
            <form onSubmit={generarEnlace}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">📅 Fecha</label>
                  <input
                    type="date"
                    className="form-control"
                    name="fecha"
                    value={formulario.fecha}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">🍽️ Servicio</label>
                  <select
                    className="form-select"
                    name="idServicio"
                    value={formulario.idServicio}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar servicio</option>
                    {servicios.map((servicio) => (
                      <option
                        key={servicio.id_servicio}
                        value={servicio.id_servicio}
                      >
                        {servicio.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Generando...
                    </>
                  ) : (
                    <>🔗 Generar Enlace</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mensajes */}
      {mensaje.texto && (
        <div
          className={`alert alert-${
            mensaje.tipo === "error" ? "danger" : "success"
          } alert-dismissible fade show`}
        >
          {mensaje.texto}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMensaje({ tipo: "", texto: "" })}
          ></button>
        </div>
      )}

      {/* Lista de Enlaces Generados */}
      {enlaces.length > 0 && (
        <div className="card enlaces-card">
          <div className="card-header">
            <h3>📝 Enlaces Generados</h3>
          </div>
          <div className="card-body">
            {enlaces.map((enlace, index) => (
              <div key={index} className="enlace-item">
                <div className="enlace-info">
                  <div className="enlace-details">
                    <strong>
                      👨‍🏫 {enlace.docenteApellido}, {enlace.docenteNombre}
                    </strong>
                    <span className="badge bg-primary ms-2">
                      {enlace.nombreGrado}
                    </span>
                    <span className="badge bg-info ms-1">
                      {enlace.servicioNombre}
                    </span>
                    <span className="badge bg-secondary ms-1">
                      {new Date(enlace.fecha + "T00:00:00").toLocaleDateString(
                        "es-ES"
                      )}
                    </span>
                  </div>
                  <div className="enlace-url">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={enlace.link}
                      readOnly
                    />
                  </div>
                </div>
                <div className="enlace-actions">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => copiarEnlace(enlace.link)}
                    title="Copiar enlace"
                  >
                    📋
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() =>
                      enviarPorWhatsApp(
                        enlace.link,
                        enlace.servicioNombre,
                        enlace.nombreGrado,
                        enlace.fecha
                      )
                    }
                    title="Enviar por WhatsApp"
                  >
                    💬
                  </button>
                  <a
                    href={enlace.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-info btn-sm"
                    title="Abrir enlace"
                  >
                    🔗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAsistencias;
