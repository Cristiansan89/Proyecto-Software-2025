import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api.js";
import { showError } from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";

const Horarios = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [grados, setGrados] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Cargar servicios
        const serviciosRes = await API.get("/servicios");
        setServicios(serviciosRes.data || []);

        // Cargar grados asignados al docente
        const gradosRes = await API.get(
          `/docente-grados?idPersona=${user.idPersona || user.id_persona}`,
        );
        setGrados(gradosRes.data || []);

        // Cargar horarios (simulados por ahora)
        const horariosSimulados = generarHorariosSimulados(
          serviciosRes.data || [],
        );
        setHorarios(horariosSimulados);
      } catch (error) {
        //console.error('Error al cargar datos:', error);
        showError(
          "Error",
          "❌ Ocurrió un error al cargar los horarios. Por favor, intente nuevamente más tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user.idPersona, user.id_persona]);

  const generarHorariosSimulados = (serviciosData) => {
    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const horarios = [];

    diasSemana.forEach((dia) => {
      serviciosData.forEach((servicio) => {
        if (servicio.estado === "Activo") {
          horarios.push({
            id: `${dia}-${servicio.id_servicio}`,
            dia,
            servicio: servicio.nombre,
            hora_inicio: getHoraServicio(servicio.nombre, "inicio"),
            hora_fin: getHoraServicio(servicio.nombre, "fin"),
            descripcion: servicio.descripcion,
            tipo: "servicio",
          });
        }
      });
    });

    return horarios;
  };

  const getHoraServicio = (nombreServicio, tipo) => {
    const horariosPorServicio = {
      Desayuno: { inicio: "07:30", fin: "08:30" },
      Almuerzo: { inicio: "12:00", fin: "13:00" },
      Merienda: { inicio: "15:30", fin: "16:30" },
      Cena: { inicio: "19:00", fin: "20:00" },
    };

    const servicio = Object.keys(horariosPorServicio).find((key) =>
      nombreServicio.toLowerCase().includes(key.toLowerCase()),
    );

    return servicio ? horariosPorServicio[servicio][tipo] : "00:00";
  };

  const getDiaActual = () => {
    const diasSemana = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return diasSemana[new Date().getDay()];
  };

  const getHorariosPorDia = (dia) => {
    return horarios
      .filter((h) => h.dia === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const esHoraActual = (horaInicio, horaFin) => {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, "0")}:${ahora
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    return horaActual >= horaInicio && horaActual <= horaFin;
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Horarios...</p>
      </div>
    );
  }

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const diaActual = getDiaActual();

  return (
    <div className={ContenidoStyle.pageContent}>
      <div className={ContenidoStyle.pageHeader}>
        <div className={ContenidoStyle.headerLeft}>
          <h1 className={ContenidoStyle.pageTitle}>
            <i className="fa-regular fa-clock"></i> Horarios
          </h1>
          <p className={ContenidoStyle.pageSubtitle}>
            Horarios de servicios de comedor para la semana
          </p>
        </div>
      </div>

      {/* Horarios por día */}
      <div>
        {diasSemana.map((dia) => {
          const horariosDelDia = getHorariosPorDia(dia);
          const esDiaActual = dia === diaActual;

          return (
            <div
              key={dia}
              className={`${ContenidoStyle.card} mb-3 ${esDiaActual ? "diaActual" : ""}`}
            >
              <div
                className={`${ContenidoStyle.cardHeader} d-flex justify-content-between align-items-center`}
              >
                <h5 className="mb-0">
                  {esDiaActual && "📍 "}
                  {dia}
                  {esDiaActual && " (Hoy)"}
                </h5>
                <span
                  className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeSuccess} fw-bold`}
                >
                  {horariosDelDia.length} servicios
                </span>
              </div>
              <div className={ContenidoStyle.cardBody}>
                {horariosDelDia.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    No hay servicios programados para este día
                  </p>
                ) : (
                  <div className="row">
                    {horariosDelDia.map((horario) => {
                      const esActivo =
                        esDiaActual &&
                        esHoraActual(horario.hora_inicio, horario.hora_fin);

                      return (
                        <div key={horario.id} className="col-md-6 mb-3">
                          <div className={`${esActivo ? "activo" : ""}`}>
                            <div>
                              <h6>
                                🍽️ {horario.servicio}
                                {esActivo && (
                                  <span
                                    className={`${ContenidoStyle.badge} bg-success ms-1`}
                                  >
                                    En curso
                                  </span>
                                )}
                              </h6>
                              <div>
                                <i className="fas fa-clock me-1"></i>
                                {horario.hora_inicio} - {horario.hora_fin}
                              </div>
                            </div>
                            <p>{horario.descripcion}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de servicios */}
      <div className={`${ContenidoStyle.card} mt-4`}>
        <div className={ContenidoStyle.cardHeader}>
          <h5>
            <i class="fa-solid fa-chart-column me-1"></i>
            Resumen de Servicios
          </h5>
        </div>
        <div className={ContenidoStyle.cardBody}>
          <div className="row">
            {servicios
              .filter((s) => s.estado === "Activo")
              .map((servicio) => (
                <div key={servicio.id_servicio} className="col-md-3 mb-3">
                  <div>
                    <div>🍽️</div>
                    <h6>{servicio.nombre}</h6>
                    <p className="text-muted small">{servicio.descripcion}</p>
                    <div>
                      <small>
                        <i className="fas fa-clock me-1"></i>
                        {getHoraServicio(servicio.nombre, "inicio")} -{" "}
                        {getHoraServicio(servicio.nombre, "fin")}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Horarios;
