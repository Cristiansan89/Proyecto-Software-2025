import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import servicioTurnoService from "../../services/servicioTurnoService.js";
import { showWarning, showError, showInfo } from "../../utils/alertService";
import styles from "../../styles/Docente.module.css";

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
        `/docente-grados/grados-by-docente?idPersona=${user.idPersona || user.id_persona}`,
      );
      const gradosDocente = gradosRes.data || [];

      // Seleccionar el primer grado (principal) del docente
      const gradoPrincipal = gradosDocente.length > 0 ? gradosDocente[0] : null;

      // Cargar servicios según el turno del grado principal
      let servicios = [];
      if (gradoPrincipal) {
        try {
          const serviciosRes = await servicioTurnoService.getServiciosByTurno(
            gradoPrincipal.idTurno,
          );
          servicios =
            serviciosRes?.filter((s) => s.estadoServicio === "Activo") || [];
        } catch (error) {
          //console.error("Error al cargar servicios del turno:", error);
          showError(
            "Error",
            "❌ Ocurrió un error al cargar los servicios del turno. Por favor, intenta nuevamente más tarde.",
          );
        }
      }

      // Si tiene grado, cargar información de alumnos
      let totalAlumnos = 0;
      if (gradoPrincipal) {
        try {
          const alumnosRes = await API.get(
            `/alumnos-grado?nombreGrado=${encodeURIComponent(
              gradoPrincipal.nombreGrado,
            )}`,
          );
          totalAlumnos = alumnosRes.data?.length || 0;
        } catch (error) {
          //console.error("Error al cargar alumnos:", error);
          showError(
            "Error",
            "❌ Ocurrió un error al cargar los alumnos de tu grado. Por favor, intenta nuevamente más tarde.",
          );
        }
      }

      setDatos({
        grado: gradoPrincipal,
        servicios,
        asistenciasRecientes: [],
        totalAlumnos,
        estadisticasAsistencia: {},
      });
    } catch (error) {
      //console.error("Error al cargar datos del docente:", error);
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los datos del docente. Por favor, intente nuevamente más tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  const generarEnlaceAsistencia = async (servicio) => {
    try {
      if (!datos.grado) {
        showWarning(
          "Advertencia",
          "No tienes un grado asignado para registrar asistencias",
        );
        return;
      }

      const fechaHoy = new Date().toISOString().split("T")[0];

      const response = await API.post("/asistencias/generar-token", {
        idPersonaDocente: user.idPersona || user.id_persona,
        nombreGrado: datos.grado.nombreGrado,
        fecha: fechaHoy,
        idServicio: servicio.idServicio,
      });

      // Abrir el enlace generado
      window.open(response.data.link, "_blank");
    } catch (error) {
      //console.error("Error al generar enlace:", error);
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
    <div>
      <div className="page-header text-dark ">
        <h2>
          <i className="fas fa-person-chalkboard me-2"></i>
          Bienvenido, {user?.nombres || user?.nombre}
        </h2>
      </div>

      {/* Estadísticas Rápidas */}
      <div className={styles.dashboardStatsDocente}>
        <div className={`${styles.statsCard} ${styles.alumnosDashboard}`}>
          <h3>
            <i className="fas fa-users me-2"></i>
            {datos.totalAlumnos}
          </h3>
          <p>Alumnos en mi Grado</p>
        </div>
        <div className={`${styles.statsCard} ${styles.serviciosDashboard}`}>
          <h3>
            <i className="fas fa-utensils me-2"></i>
            {datos.servicios.length}
          </h3>
          <p>Servicios Disponibles</p>
        </div>
        <div className={`${styles.statsCard} ${styles.fechaHoy}`}>
          <h3>
            {" "}
            <i className="fas fa-calendar-day me-2"></i>
            {new Date().toLocaleDateString("es-ES", {
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date()
              .toLocaleDateString("es-ES", { month: "long" })
              .toUpperCase()}
          </h3>
          <p>Hoy</p>
        </div>
      </div>

      {/* Información del Día */}
      <div className="row">
        <div className="col-md-6">
          {/* Acciones Rápidas */}
          <div className="card asistencia-card">
            <div className="card-header">
              <h5>
                <i className="fas fa-utensils me-1"></i>
                Menú del Día
              </h5>
              <p className="mb-0">
                Consulta el menú del día para tu grado y registra asistencias
              </p>
            </div>
            <div className="card-body">
              {datos.servicios.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-utensils"></i>
                  <p className="text-muted">
                    No hay servicios activos para tu grado hoy.
                  </p>
                </div>
              ) : (
                <div className="list-group">
                  {datos.servicios.map((servicio) => (
                    <button
                      key={servicio.idServicio}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      onClick={() => generarEnlaceAsistencia(servicio)}
                    >
                      <div>
                        <h5 className="mb-1">{servicio.nombreServicio}</h5>
                        <small className="text-muted">
                          {servicio.descripcion}
                        </small>
                      </div>
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className={`card shadow-sm ${styles.helpCard}`}>
            <div className="card-header">
              <h4>❓ ¿Cómo registrar asistencias?</h4>
            </div>
            <div className="card-body">
              <ol className={styles.helpSteps}>
                <li>Selecciona tu grado en la sección "Menú del Día"</li>
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
