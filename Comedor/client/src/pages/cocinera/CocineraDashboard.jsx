import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../../src/styles/CocineraDashboard.css";
import API from "../../services/api.js";
import consumosService from "../../services/consumosService";
import asistenciasService from "../../services/asistenciasService";
import pedidoService from "../../services/pedidoService";
import planificacionMenuService from "../../services/planificacionMenuService";

const CocineraDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    docentesTotal: 0,
    gradosActivos: 0,
    serviciosHoy: 0,
    asistenciasHoy: 0,
    consumosHoy: 0,
    pedidosPendientes: 0,
  });
  const [serviciosHoy, setServiciosHoy] = useState([]);
  const [proximosServicios, setProximosServicios] = useState([]);
  const [detallesConsumosHoy, setDetallesConsumosHoy] = useState([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);

      const hoy = new Date().toISOString().split("T")[0];
      const manana = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Obtener estadísticas básicas
      const [docentesRes, gradosRes, serviciosRes, planificacionRes] =
        await Promise.all([
          API.get("/personas"),
          API.get("/grados"),
          API.get("/servicios"),
          planificacionMenuService.getAll().catch(() => ({ data: [] })),
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

      // Filtrar planificaciones de hoy y mañana
      const planificacionesHoy = (planificacionRes.data || []).filter(
        (p) => p.fecha && p.fecha.split("T")[0] === hoy
      );
      const planificacionesMañana = (planificacionRes.data || []).filter(
        (p) => p.fecha && p.fecha.split("T")[0] === manana
      );

      // Obtener datos reales de hoy
      let consumosHoyCount = 0;
      let asistenciasHoyCount = 0;
      let pedidosPendientes = 0;

      try {
        // Consumos de hoy
        const consumosRes = await consumosService.obtenerConsumos(
          `fechaInicio=${hoy}&fechaFin=${hoy}`
        );
        if (consumosRes.success && consumosRes.data) {
          consumosHoyCount = consumosRes.data.length;
          setDetallesConsumosHoy(consumosRes.data.slice(0, 5)); // Últimos 5 consumos
        }
      } catch (error) {
        console.error("Error al obtener consumos:", error);
      }

      try {
        // Asistencias de hoy
        const asistenciasRes =
          await asistenciasService.obtenerRegistrosAsistencias(`fecha=${hoy}`);
        if (asistenciasRes.success && asistenciasRes.data) {
          asistenciasHoyCount = asistenciasRes.data.reduce(
            (sum, reg) => sum + (reg.cantidadPresentes || 0),
            0
          );
        }
      } catch (error) {
        console.error("Error al obtener asistencias:", error);
      }

      try {
        // Pedidos pendientes de aprobación
        const pedidosRes = await pedidoService.getAll();
        if (pedidosRes.data) {
          pedidosPendientes = pedidosRes.data.filter(
            (p) => p.estadoPedido === "Pendiente"
          ).length;
        }
      } catch (error) {
        console.error("Error al obtener pedidos:", error);
      }

      // Generar servicios de hoy y próximos con datos reales de planificación
      const serviciosDeHoy = generarServiciosHoy(servicios, planificacionesHoy);
      const proximosServiciosData = generarProximosServicios(
        servicios,
        manana,
        planificacionesMañana
      );

      setEstadisticas({
        docentesTotal: docentes.length,
        gradosActivos: grados.length,
        serviciosHoy: serviciosDeHoy.length,
        asistenciasHoy: asistenciasHoyCount,
        consumosHoy: consumosHoyCount,
        pedidosPendientes: pedidosPendientes,
      });

      setServiciosHoy(serviciosDeHoy);
      setProximosServicios(proximosServiciosData);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generarServiciosHoy = (servicios, planificaciones = []) => {
    const horariosDelDia = [
      { nombre: "Desayuno", hora: "08:30", icono: "🥐" },
      { nombre: "Almuerzo", hora: "12:00", icono: "🍽️" },
      { nombre: "Merienda", hora: "16:00", icono: "🥪" },
    ];

    return horariosDelDia.map((horario) => {
      const servicio = servicios.find((s) =>
        s.nombre.toLowerCase().includes(horario.nombre.toLowerCase())
      );

      // Buscar planificaciones para este servicio
      const planificacionesDelServicio = planificaciones.filter(
        (p) =>
          p.idServicio === servicio?.idServicio ||
          p.id_servicio === servicio?.id_servicio
      );

      // Construir descripción con grado + servicio + receta
      const detallesServicio =
        planificacionesDelServicio
          .map((p) => {
            const grado = p.nombreGrado || p.nombre_grado || "";
            const nombreServicio = p.nombreServicio || p.nombre_servicio || "";
            const receta = p.nombreReceta || p.nombre_receta || "";
            return `${grado} - ${nombreServicio}: ${receta}`;
          })
          .filter(Boolean)
          .join(" | ") ||
        servicio?.descripcion ||
        `Servicio de ${horario.nombre.toLowerCase()}`;

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
        descripcion: detallesServicio,
      };
    });
  };

  const generarProximosServicios = (
    servicios,
    fechaManana,
    planificaciones = []
  ) => {
    return [
      { nombre: "Desayuno", hora: "08:30", icono: "🥐" },
      { nombre: "Almuerzo", hora: "12:00", icono: "🍽️" },
      { nombre: "Merienda", hora: "16:00", icono: "🥪" },
    ].map((horario) => ({
      id: `manana-${horario.nombre}`,
      nombre: horario.nombre,
      hora: horario.hora,
      icono: horario.icono,
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
        <div className="page-header text-dark">
          <h2>
            <i className="fas fa-bowl-rice me-2"></i>
            Bienvenida, {user.nombre} {user.apellido}
          </h2>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="dashboard-stats-cocinera">
        <div className="stat-card bg-primary">
          <div className="stat-info">
            <h3>{estadisticas.docentesTotal}</h3>
            <p>Docentes Registrados</p>
          </div>
        </div>
        <div className="stat-card bg-success">
          <div className="stat-info">
            <h3>{estadisticas.gradosActivos}</h3>
            <p>Grados Activos</p>
          </div>
        </div>
        <div className="stat-card bg-warning">
          <div className="stat-info">
            <h3>{estadisticas.serviciosHoy}</h3>
            <p>Servicios Hoy</p>
          </div>
        </div>

        <div className="stat-card bg-info">
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

          {/* Consumos recientes */}
          <div className="card mt-4">
            <div className="card-header">
              <h4>
                <i className="fas fa-chart-bar me-2"></i>
                Consumos Registrados Hoy
              </h4>
            </div>
            <div className="card-body">
              {detallesConsumosHoy.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Insumo</th>
                        <th>Servicio</th>
                        <th>Cantidad</th>
                        <th>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesConsumosHoy.map((consumo, index) => (
                        <tr key={index}>
                          <td>
                            <strong>
                              {consumo.nombreInsumo ||
                                `Insumo #${consumo.id_insumo}`}
                            </strong>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              {consumo.nombreServicio || "Sin servicio"}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info text-dark">
                              {consumo.cantidadUtilizada} {consumo.unidadMedida}
                            </span>
                          </td>
                          <td className="text-muted">
                            <small>
                              {new Date(
                                consumo.fechaHoraGeneracion
                              ).toLocaleTimeString("es-ES")}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-2x text-muted mb-3"></i>
                  <p className="text-muted">No hay consumos registrados hoy</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-lg-4">
          {/* Próximos servicios */}
          <div className="card mb-4">
            <div className="card-header">
              <h4>
                <i className="fas fa-calendar-plus me-2"></i>
                Próximos Servicios (Mañana)
              </h4>
            </div>
            <div className="card-body">
              {proximosServicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="proximo-servicio mb-3 pb-3 border-bottom"
                >
                  <div className="d-flex align-items-center">
                    <span className="servicio-icono me-3 fs-4">
                      {servicio.icono}
                    </span>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{servicio.nombre}</h6>
                      <small className="text-muted d-block">
                        <i className="fas fa-clock me-1"></i>
                        {servicio.hora}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas y recordatorios */}
          <div className="card">
            <div className="card-header text-dark">
              <h4>
                <i className="fas fa-bell me-2"></i>
                Recordatorios Importantes
              </h4>
            </div>
            <div className="card-body">
              <div className="alert alert-warning alert-dismissible fade show mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>
                  {" "}
                  Recuerde Generar la Lista de Asistencia para el Día.
                </strong>
                <br />
              </div>

              <div className="alert alert-info alert-dismissible fade show mb-0">
                <i className="fas fa-info-circle me-2"></i>
                <strong>
                  Verifique que los datos en el sistema esten bien implementados
                </strong>
                <br />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CocineraDashboard;
