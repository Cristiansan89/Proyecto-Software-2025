import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../../src/styles/CocineraDashboard.css";
import API from "../../services/api.js";

const CocineraDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    docentesTotal: 0,
    gradosActivos: 0,
    serviciosHoy: 0,
    asistenciasHoy: 0,
  });
  const [serviciosHoy, setServiciosHoy] = useState([]);
  const [proximosServicios, setProximosServicios] = useState([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas básicas
      const [docentesRes, gradosRes, serviciosRes] = await Promise.all([
        API.get("/personas"),
        API.get("/grados"),
        API.get("/servicios"),
      ]);

      const docentes =
        docentesRes.data?.filter(
          (persona) => persona.nombreRol === "Docente"
        ) || [];
      const grados =
        gradosRes.data?.filter((grado) => grado.estado === "Activo") || [];
      const servicios =
        serviciosRes.data?.filter((servicio) => servicio.estado === "Activo") ||
        [];

      // Simular servicios de hoy y próximos
      const serviciosDeHoy = generarServiciosHoy(servicios);
      const proximosServiciosData = generarProximosServicios(servicios);

      setEstadisticas({
        docentesTotal: docentes.length,
        gradosActivos: grados.length,
        serviciosHoy: serviciosDeHoy.length,
        asistenciasHoy: Math.floor(Math.random() * 150) + 100, // Simulado
      });

      setServiciosHoy(serviciosDeHoy);
      setProximosServicios(proximosServiciosData);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarServiciosHoy = (servicios) => {
    const horariosDelDia = [
      { nombre: "Desayuno", hora: "07:30", icono: "🥐" },
      { nombre: "Almuerzo", hora: "12:00", icono: "🍽️" },
      { nombre: "Merienda", hora: "15:30", icono: "🥪" },
    ];

    return horariosDelDia.map((horario) => {
      const servicio = servicios.find((s) =>
        s.nombre.toLowerCase().includes(horario.nombre.toLowerCase())
      );

      const ahora = new Date();
      const [hora, minutos] = horario.hora.split(":");
      const horaServicio = new Date();
      horaServicio.setHours(parseInt(hora), parseInt(minutos), 0, 0);

      return {
        id: `hoy-${horario.nombre}`,
        nombre: horario.nombre,
        hora: horario.hora,
        icono: horario.icono,
        estado:
          ahora > horaServicio
            ? "completado"
            : ahora.getTime() < horaServicio.getTime() - 30 * 60 * 1000
            ? "pendiente"
            : "en_curso",
        descripcion:
          servicio?.descripcion ||
          `Servicio de ${horario.nombre.toLowerCase()}`,
        estimadoAlumnos: Math.floor(Math.random() * 80) + 40,
      };
    });
  };

  const generarProximosServicios = (servicios) => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    return [
      { nombre: "Desayuno", hora: "07:30", fecha: manana, icono: "🥐" },
      { nombre: "Almuerzo", hora: "12:00", fecha: manana, icono: "🍽️" },
    ].map((servicio, index) => ({
      id: `manana-${index}`,
      ...servicio,
      estimadoAlumnos: Math.floor(Math.random() * 80) + 40,
    }));
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "completado":
        return "success";
      case "en_curso":
        return "warning";
      case "pendiente":
        return "info";
      default:
        return "secondary";
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "completado":
        return "Completado";
      case "en_curso":
        return "En Curso";
      case "pendiente":
        return "Pendiente";
      default:
        return "Sin estado";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="page-header">
          <h2>
            <i className="fas fa-bowl-rice me-2"></i>
            Bienvenida, {user.nombre} {user.apellido}
          </h2>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="dashboard-stats-cocinera">
        <div className="stat-card bg-primary">
          <div className="stat-icon">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          <div className="stat-info">
            <h3>{estadisticas.docentesTotal}</h3>
            <p>Docentes Registrados</p>
          </div>
        </div>
        <div className="stat-card bg-success">
          <div className="stat-icon">
            <i className="fas fa-school"></i>
          </div>
          <div className="stat-info">
            <h3>{estadisticas.gradosActivos}</h3>
            <p>Grados Activos</p>
          </div>
        </div>
        <div className="stat-card bg-warning">
          <div className="stat-icon">
            <i className="fas fa-utensils"></i>
          </div>
          <div className="stat-info">
            <h3>{estadisticas.serviciosHoy}</h3>
            <p>Servicios Hoy</p>
          </div>
        </div>

        <div className="stat-card bg-info">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{estadisticas.asistenciasHoy}</h3>
            <p>Asistencias Hoy</p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Servicios de hoy */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h4>
                <i className="fas fa-calendar-day me-2"></i>
                Servicios de Hoy
              </h4>
              <small className="text-muted">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </small>
            </div>
            <div className="card-body">
              <div className="servicios-timeline">
                {serviciosHoy.map((servicio) => (
                  <div
                    key={servicio.id}
                    className={`timeline-item estado-${servicio.estado}`}
                  >
                    <div className="timeline-marker">
                      <span className="servicio-icono">{servicio.icono}</span>
                    </div>
                    <div className="timeline-content">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5>{servicio.nombre}</h5>
                          <p className="hora-servicio">
                            <i className="fas fa-clock me-2"></i>
                            {servicio.hora}
                          </p>
                          <p className="descripcion-servicio">
                            {servicio.descripcion}
                          </p>
                          <p className="estimado-alumnos">
                            <i className="fas fa-users me-2"></i>~
                            {servicio.estimadoAlumnos} alumnos estimados
                          </p>
                        </div>
                        <span
                          className={`badge bg-${getEstadoColor(
                            servicio.estado
                          )}`}
                        >
                          {getEstadoTexto(servicio.estado)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-lg-4">
          {/* Próximos servicios */}
          <div className="card">
            <div className="card-header">
              <h4>
                <i className="fas fa-calendar-plus me-2"></i>
                Próximos Servicios
              </h4>
            </div>
            <div className="card-body">
              {proximosServicios.map((servicio) => (
                <div key={servicio.id} className="proximo-servicio">
                  <div className="d-flex align-items-center">
                    <span className="servicio-icono me-3">
                      {servicio.icono}
                    </span>
                    <div>
                      <h6>{servicio.nombre}</h6>
                      <small className="text-muted">
                        Mañana - {servicio.hora}
                      </small>
                      <br />
                      <small className="text-muted">
                        ~{servicio.estimadoAlumnos} alumnos
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CocineraDashboard;
