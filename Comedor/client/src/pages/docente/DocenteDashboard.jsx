import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import { showWarning, showError, showInfo } from "../../utils/alertService";

const DocenteDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({
    grado: null, // Solo UN grado principal
    servicios: [],
    asistenciasRecientes: [],
    totalAlumnos: 0,
    estadisticasAsistencia: {},
  });

  useEffect(() => {
    cargarDatosDocente();
  }, [user]);

  const cargarDatosDocente = async () => {
    try {
      setLoading(true);

      // Cargar grados asignados al docente
      const gradosRes = await API.get(
        `/docente-grados?idPersona=${user.idPersona || user.id_persona}`
      );
      const gradosDocente = gradosRes.data || [];

      // Seleccionar el primer grado (principal) del docente
      const gradoPrincipal = gradosDocente.length > 0 ? gradosDocente[0] : null;

      // Cargar servicios disponibles
      const serviciosRes = await API.get("/servicios");

      // Si tiene grado, cargar información de alumnos
      let totalAlumnos = 0;
      if (gradoPrincipal) {
        try {
          const alumnosRes = await API.get(
            `/alumnos-grado?nombreGrado=${encodeURIComponent(
              gradoPrincipal.nombreGrado
            )}`
          );
          totalAlumnos = alumnosRes.data?.length || 0;
        } catch (error) {
          console.error("Error al cargar alumnos:", error);
        }
      }

      setDatos({
        grado: gradoPrincipal,
        servicios:
          serviciosRes.data?.filter((s) => s.estado === "Activo") || [],
        asistenciasRecientes: [],
        totalAlumnos,
        estadisticasAsistencia: {},
      });
    } catch (error) {
      console.error("Error al cargar datos del docente:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarEnlaceAsistencia = async (servicio) => {
    try {
      if (!datos.grado) {
        showWarning(
          "Advertencia",
          "No tienes un grado asignado para registrar asistencias"
        );
        return;
      }

      const fechaHoy = new Date().toISOString().split("T")[0];

      const response = await API.post("/asistencias/generar-token", {
        idPersonaDocente: user.idPersona || user.id_persona,
        nombreGrado: datos.grado.nombreGrado,
        fecha: fechaHoy,
        idServicio: servicio.id_servicio,
      });

      // Abrir el enlace generado
      window.open(response.data.link, "_blank");
    } catch (error) {
      console.error("Error al generar enlace:", error);
      showError("Error", "Error al generar el enlace de asistencia");
    }
  };

  if (loading) {
    return (
      <div className="docente-dashboard">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando panel docente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="docente-dashboard">
      {/* Header de Bienvenida */}
      <div className="welcome-header">
        <div className="welcome-content">
          <h1>👨‍🏫 Bienvenido, {user?.nombres || user?.nombre}</h1>
          <p className="welcome-subtitle">Panel de Control Docente</p>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stats-card">
            <div className="stats-icon">
              <i className="fas fa-chalkboard-teacher"></i>
            </div>
            <div className="stats-content">
              <h3>{datos.grado ? "1" : "0"}</h3>
              <p>Grado Asignado</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card">
            <div className="stats-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stats-content">
              <h3>{datos.totalAlumnos}</h3>
              <p>Alumnos en mi Grado</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card">
            <div className="stats-icon">
              <i className="fas fa-utensils"></i>
            </div>
            <div className="stats-content">
              <h3>{datos.servicios.length}</h3>
              <p>Servicios Disponibles</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card">
            <div className="stats-icon">
              <i className="fas fa-calendar-day"></i>
            </div>
            <div className="stats-content">
              <h3>
                {new Date().toLocaleDateString("es-ES", { day: "numeric" })}
              </h3>
              <p>Hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card action-card">
            <div className="card-header">
              <h3>📋 Registro de Asistencias</h3>
              <p className="mb-0">
                Registra la asistencia de tus alumnos para los servicios de
                comedor
              </p>
            </div>
            <div className="card-body">
              {!datos.grado ? (
                <div className="no-grados">
                  <i className="fas fa-info-circle"></i>
                  <p>No tienes un grado asignado actualmente.</p>
                </div>
              ) : (
                <div className="grado-principal">
                  <div className="grado-card">
                    <div className="grado-header">
                      <h4>📚 {datos.grado.nombreGrado}</h4>
                      <div className="grado-info">
                        <span className="badge bg-info me-2">
                          Ciclo{" "}
                          {new Date(datos.grado.cicloLectivo).getFullYear()}
                        </span>
                        <span className="badge bg-success">
                          {datos.totalAlumnos} alumnos
                        </span>
                      </div>
                    </div>

                    <div className="servicios-list">
                      <p className="servicios-title">
                        Registrar asistencia para:
                      </p>
                      <div className="servicios-buttons">
                        {datos.servicios.map((servicio) => (
                          <button
                            key={servicio.id_servicio}
                            className="btn btn-primary btn-servicio me-2 mb-2"
                            onClick={() => generarEnlaceAsistencia(servicio)}
                          >
                            🍽️ {servicio.nombre}
                            <small className="d-block">
                              ({servicio.descripcion})
                            </small>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información del Día */}
      <div className="row">
        <div className="col-md-6">
          <div className="card info-card">
            <div className="card-header">
              <h4>📅 Información del Día</h4>
            </div>
            <div className="card-body">
              <div className="info-item">
                <strong>Fecha:</strong>
                <span>
                  {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="info-item">
                <strong>Mi Grado:</strong>
                <span className="badge bg-primary">
                  {datos.grado ? datos.grado.nombreGrado : "Sin asignar"}
                </span>
              </div>
              <div className="info-item">
                <strong>Rol:</strong>
                <span className="badge bg-success">
                  {user?.rol || user?.nombre_rol}
                </span>
              </div>
              {datos.grado && (
                <div className="info-item">
                  <strong>Docente:</strong>
                  <span>
                    {datos.grado.nombre} {datos.grado.apellido}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card help-card">
            <div className="card-header">
              <h4>❓ ¿Cómo registrar asistencias?</h4>
            </div>
            <div className="card-body">
              <ol className="help-steps">
                <li>
                  Selecciona tu grado en la sección "Registro de Asistencias"
                </li>
                <li>
                  Haz clic en el servicio para el cual quieres registrar
                  asistencia
                </li>
                <li>Se abrirá una nueva ventana optimizada para móvil</li>
                <li>Marca cada alumno: ✅ Sí, ❌ No, 🚫 Ausente</li>
                <li>Guarda los cambios</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocenteDashboard;
