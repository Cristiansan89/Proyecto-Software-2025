import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import planificacionMenuService from "../../services/planificacionMenuService";
import recetaService from "../../services/recetaService";
import asistenciaService from "../../services/asistenciaService";
import asistenciasService from "../../services/asistenciasService";
import API from "../../services/api.js";
import "../../styles/MenuesDiaria.css";

const MenuesDiaria = () => {
  const { user } = useAuth();
  const [hoy, setHoy] = useState(new Date());
  const [servicios, setServicios] = useState([]);
  const [menuDia, setMenuDia] = useState({});
  const [detallesReceta, setDetallesReceta] = useState({});
  const [comensalesHoy, setComensalesHoy] = useState({});
  const [asistenciaReal, setAsistenciaReal] = useState({});
  const [loading, setLoading] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);
  const [serviciosCompletados, setServiciosCompletados] = useState({});
  const [asistenciasCompletas, setAsistenciasCompletas] = useState(false);

  // Servicios con orden de aparición en el día
  const HORARIOS_SERVICIOS = [
    { id: 1, nombre: "Desayuno", hora: "07:30", icono: "☕" },
    { id: 2, nombre: "Almuerzo", hora: "12:00", icono: "🍽️" },
    { id: 3, nombre: "Merienda", hora: "15:30", icono: "🥪" },
  ];

  // Conversiones estándar de unidades
  const CONVERSIONES = {
    Gramo: { Kilogramo: 1000, Kilogramos: 1000, Gramo: 1, Gramos: 1 },
    Kilogramo: { Gramo: 0.001, Gramos: 0.001, Kilogramo: 1, Kilogramos: 1 },
    Mililitro: {
      Litro: 1000,
      Litros: 1000,
      Mililitro: 1,
      Mililitros: 1,
    },
    Litro: {
      Mililitro: 0.001,
      Mililitros: 0.001,
      Litro: 1,
      Litros: 1,
    },
    Unidad: { Unidad: 1, Unidades: 1 },
    Taza: { Taza: 1 },
    Cucharadita: { Cucharadita: 1 },
    Cucharada: { Cucharada: 1 },
    Pizca: { Pizca: 1 },
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosDelDia();
  }, [hoy]);

  const cargarDatosDelDia = async () => {
    setLoading(true);
    try {
      const fechaStr = hoy.toISOString().split("T")[0];
      const fechaFin = new Date(hoy);
      fechaFin.setDate(hoy.getDate() + 1);
      const fechaFinStr = fechaFin.toISOString().split("T")[0];

      console.log(`📅 Cargando datos para el día ${fechaStr}`);

      // 1. Verificar asistencias registradas
      await verificarAsistenciasRegistradas(fechaStr);

      // 2. Obtener menús del día
      const menusResponse = await planificacionMenuService.getMenusSemana(
        fechaStr,
        fechaStr
      );
      console.log("📋 Menús del día:", menusResponse);

      const menusMap = {};
      if (menusResponse && Array.isArray(menusResponse)) {
        for (const menu of menusResponse) {
          if (menu.id_receta) {
            menusMap[menu.id_servicio] = menu;
            // Cargar detalles de la receta
            await cargarDetallesReceta(menu.id_receta, menu.id_servicio);
          }
        }
      }
      setMenuDia(menusMap);

      // 3. Obtener asistencia real del día
      try {
        const asistenciaResponse =
          await asistenciaService.getTotalAsistenciasPorServicio(fechaStr);
        console.log("👥 Asistencia real del día:", asistenciaResponse);
        setAsistenciaReal(asistenciaResponse);
      } catch (error) {
        console.warn(
          "⚠️ No se pudo cargar asistencia real, usando comensales estimados",
          error
        );
        // Continuar con los comensales estimados si la asistencia no está disponible
      }

      // 3. Obtener comensales estimados (respaldo)
      const comensalesResponse =
        await planificacionMenuService.calcularComensalesPorFecha(fechaStr);
      console.log("👥 Comensales estimados del día:", comensalesResponse);
      setComensalesHoy(comensalesResponse);

      // 4. Cargar servicios disponibles
      const serviciosResponse = await API.get("/servicios");
      setServicios(serviciosResponse.data);

      // 5. Cargar estado de servicios completados
      await cargarEstadoServicios(fechaStr);
    } catch (error) {
      console.error("Error al cargar datos del día:", error);
      mostrarNotificacion("Error al cargar los datos del día", "error");
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para verificar asistencias registradas
  const verificarAsistenciasRegistradas = async (fecha) => {
    try {
      const response = await asistenciasService.verificarAsistenciasCompletas(
        fecha
      );
      if (response.success && response.data) {
        setAsistenciasCompletas(response.data.completas || false);
        console.log(
          "✅ Estado asistencias completas:",
          response.data.completas
        );
      } else {
        setAsistenciasCompletas(false);
        console.log("⚠️ No se pudieron verificar las asistencias");
      }
    } catch (error) {
      console.error("Error al verificar asistencias:", error);
      setAsistenciasCompletas(false);
    }
  };

  const cargarDetallesReceta = async (idReceta, idServicio) => {
    try {
      // Usar el endpoint que retorna la receta con ingredientes
      const response = await recetaService.getWithInsumos(idReceta);
      setDetallesReceta((prev) => ({
        ...prev,
        [idServicio]: response,
      }));
    } catch (error) {
      console.error(`Error al cargar receta ${idReceta}:`, error);
    }
  };

  const cargarEstadoServicios = async (fechaStr) => {
    try {
      const response = await API.get(
        `/servicios/estado-completado?fecha=${fechaStr}`
      );
      if (response.data) {
        setServiciosCompletados(response.data);
      }
    } catch (error) {
      console.warn("No se pudo cargar el estado de servicios:", error);
    }
  };

  const obtenerMejorUnidad = (cantidad, unidadOriginal) => {
    // Para gramos: si es >= 1000, convertir a kilogramos
    if (
      unidadOriginal === "Gramo" ||
      unidadOriginal === "Gramos" ||
      unidadOriginal === "gramo" ||
      unidadOriginal === "gramos"
    ) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Kilogramos",
        };
      }
      return { cantidad, unidad: "Gramos" };
    }

    // Para mililitros: si es >= 1000, convertir a litros
    if (
      unidadOriginal === "Mililitro" ||
      unidadOriginal === "Mililitros" ||
      unidadOriginal === "mililitro" ||
      unidadOriginal === "mililitros"
    ) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Litros",
        };
      }
      return { cantidad, unidad: "Mililitros" };
    }

    return { cantidad, unidad: unidadOriginal };
  };

  const calcularIngredientesParaServicio = (idServicio) => {
    const menu = menuDia[idServicio];
    if (!menu) return [];

    const receta = detallesReceta[idServicio];
    if (!receta || !receta.insumos) return [];

    // Usar SOLO asistencia real - NO usar estimados
    const comensalesServicio = asistenciaReal[idServicio] || 0;

    if (comensalesServicio === 0) {
      console.warn(
        `⚠️ No hay asistencia real registrada para servicio ${idServicio}`
      );
      return []; // No mostrar ingredientes si no hay asistencia
    }

    console.log(
      `✅ Usando asistencia real para servicio ${idServicio}: ${comensalesServicio} asistentes`
    );

    // Calcular cantidad total de cada ingrediente basándose en asistencia real
    return receta.insumos.map((ingrediente) => {
      const cantidadTotal = ingrediente.cantidadPorPorcion * comensalesServicio;
      const mejorUnidad = obtenerMejorUnidad(
        cantidadTotal,
        ingrediente.unidadPorPorcion
      );

      return {
        ...ingrediente,
        cantidadTotal,
        cantidadOptimizada: `${mejorUnidad.cantidad.toFixed(2)} ${
          mejorUnidad.unidad
        }`,
      };
    });
  };

  const marcarServicioCompletado = async (idServicio) => {
    try {
      const fechaStr = hoy.toISOString().split("T")[0];

      // Obtener comensales para este servicio
      const comensales = comensalesHoy[idServicio] || 0;
      const completandoServicio = !serviciosCompletados[idServicio];

      const requestData = {
        fecha: fechaStr,
        id_servicio: idServicio,
        completado: completandoServicio,
      };

      // Solo agregar datos adicionales si se está marcando como completado
      if (completandoServicio) {
        requestData.id_usuario = user?.id_usuario || user?.idUsuario;
        requestData.comensales = comensales;

        console.log(`🍽️ Marcando servicio completado:`, {
          servicio: HORARIOS_SERVICIOS.find((s) => s.id === idServicio)?.nombre,
          fecha: fechaStr,
          comensales,
          usuario: user?.id_usuario || user?.idUsuario,
        });
      }

      const response = await API.post(
        "/servicios/marcar-completado",
        requestData
      );

      if (response.data.success) {
        setServiciosCompletados((prev) => ({
          ...prev,
          [idServicio]: completandoServicio,
        }));

        const mensaje = completandoServicio
          ? `✅ ${
              HORARIOS_SERVICIOS.find((s) => s.id === idServicio)?.nombre
            } completado - Consumos registrados automáticamente`
          : `↩️ ${
              HORARIOS_SERVICIOS.find((s) => s.id === idServicio)?.nombre
            } marcado como en preparación`;

        mostrarNotificacion(mensaje, "success");
      }
    } catch (error) {
      console.error("Error al marcar servicio como completado:", error);
      mostrarNotificacion(
        "Error al actualizar el estado del servicio",
        "error"
      );
    }
  };

  const mostrarNotificacion = (texto, tipo = "info") => {
    setMensajeNotificacion({ texto, tipo });
    setTimeout(() => setMensajeNotificacion(null), 4000);
  };

  const cambiarFecha = (dias) => {
    const nuevaFecha = new Date(hoy);
    nuevaFecha.setDate(hoy.getDate() + dias);
    setHoy(nuevaFecha);
  };

  const esDialaboral = () => {
    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const dia = hoy.getDay();
    return dia !== 0 && dia !== 6; // Retorna false para sábado (6) y domingo (0)
  };

  const todasLasAsistenciasRegistradas = () => {
    // Retornar el estado de asistencias completas que se carga desde el backend
    return asistenciasCompletas;
  };

  const nombreDia = hoy.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-fluid mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-light text-dark">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-clock me-2"></i>
              Menús del Día
            </h4>
          </div>
        </div>

        <div className="card-body">
          {/* Navegación de fechas */}
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => cambiarFecha(-1)}
            >
              <i className="fas fa-chevron-left"></i> Día Anterior
            </button>

            <div className="text-center">
              <h5 className="mb-0 text-capitalize">{nombreDia}</h5>
              <small className="text-muted">
                {hoy.toISOString().split("T")[0]}
              </small>
            </div>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => cambiarFecha(1)}
            >
              Día Siguiente <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Notificación */}
          {mensajeNotificacion && (
            <div
              className={`alert alert-${mensajeNotificacion.tipo} alert-dismissible fade show mb-4`}
              role="alert"
            >
              {mensajeNotificacion.texto}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMensajeNotificacion(null)}
              ></button>
            </div>
          )}

          {/* Alerta de fin de semana */}
          {!esDialaboral() && (
            <div
              className="alert alert-info alert-dismissible fade show mb-4"
              role="alert"
            >
              <i className="fas fa-info-circle me-2"></i>
              <strong>
                No hay servicio de comedor los sábados y domingos.
              </strong>
              Los menús del día están disponibles de lunes a viernes.
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center my-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          )}

          {/* Servicios del día - Solo disponible de lunes a viernes */}
          {!loading && esDialaboral() && (
            <div className="servicios-container">
              {HORARIOS_SERVICIOS.map((horario) => {
                const menu = menuDia[horario.id];
                const completado = serviciosCompletados[horario.id];
                const ingredientes = calcularIngredientesParaServicio(
                  horario.id
                );
                const comensalesServicio =
                  comensalesHoy?.servicios?.find(
                    (s) => s.id_servicio === horario.id
                  )?.totalComensales || 0;

                return (
                  <div
                    key={horario.id}
                    className={`servicio-card ${
                      completado ? "completado" : ""
                    }`}
                  >
                    {/* Header del servicio */}
                    <div className="servicio-header">
                      <div className="servicio-info-header">
                        <span className="servicio-icono">{horario.icono}</span>
                        <div className="servicio-detalles">
                          <h5 className="mb-0">{horario.nombre}</h5>
                          <small className="text-muted">{horario.hora}</small>
                        </div>
                      </div>

                      {/* Badge de asistencia real */}
                      <div className="d-flex gap-2 flex-wrap justify-content-end">
                        {asistenciaReal[horario.id] > 0 ? (
                          <span className="badge bg-success">
                            <i className="fas fa-check-circle me-1"></i>
                            {asistenciaReal[horario.id]} presentes
                          </span>
                        ) : (
                          <span className="badge bg-danger">
                            <i className="fas fa-times-circle me-1"></i>
                            Sin asistencia registrada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido del servicio */}
                    {!menu ? (
                      <div className="alert alert-warning mt-3 mb-0">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        No hay menú asignado para este servicio
                      </div>
                    ) : (
                      <>
                        {/* Nombre de la receta */}
                        <div className="receta-nombre mt-3">
                          <h6 className="mb-3">
                            <i className="fas fa-utensils me-2 text-primary"></i>
                            <strong>{menu.nombreReceta}</strong>
                          </h6>
                        </div>

                        {/* Mostrar instrucciones e ingredientes solo si hay asistencia registrada */}
                        {asistenciaReal[horario.id] > 0 ? (
                          <>
                            {/* Instrucciones de la receta */}
                            {detallesReceta[horario.id]?.instrucciones && (
                              <div
                                className="instrucciones-section mt-3 p-3 bg-light border-left-4"
                                style={{ borderLeft: "4px solid #007bff" }}
                              >
                                <h6 className="mb-2">
                                  <i className="fas fa-book-open me-2 text-info"></i>
                                  <strong>Instrucciones:</strong>
                                </h6>
                                <p
                                  className="mb-0 text-muted"
                                  style={{
                                    fontSize: "0.95rem",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {detallesReceta[horario.id].instrucciones}
                                </p>
                              </div>
                            )}

                            {/* Ingredientes requeridos */}
                            {ingredientes.length > 0 && (
                              <div className="ingredientes-section mt-3">
                                <h6 className="mb-3 text-muted">
                                  <i className="fas fa-list me-2"></i>
                                  Ingredientes Requeridos (
                                  {asistenciaReal[horario.id]} alumnos asisten)
                                </h6>

                                <div className="table-responsive">
                                  <table className="table table-sm table-hover">
                                    <thead className="table-light">
                                      <tr>
                                        <th width="70%">Ingrediente</th>
                                        <th width="30%">Cantidad</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ingredientes.map((ing, idx) => (
                                        <tr key={idx}>
                                          <td>
                                            <strong>{ing.nombreInsumo}</strong>
                                          </td>
                                          <td>
                                            <span className="badge bg-success">
                                              {ing.cantidadOptimizada}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="alert alert-warning mt-3 mb-0">
                            <i className="fas fa-clock me-2"></i>
                            <strong>Esperando registro de asistencia.</strong>
                            <br />
                            Las instrucciones e ingredientes se mostrarán una
                            vez que el docente registre la asistencia para este
                            servicio.
                          </div>
                        )}

                        {/* Botón de completado */}
                        <div className="mt-3">
                          <button
                            className={`btn btn-sm w-100 ${
                              completado
                                ? "btn-success"
                                : !todasLasAsistenciasRegistradas()
                                ? "btn-secondary"
                                : "btn-outline-success"
                            }`}
                            onClick={() => marcarServicioCompletado(horario.id)}
                            disabled={
                              !completado && !todasLasAsistenciasRegistradas()
                            }
                            title={
                              !todasLasAsistenciasRegistradas() && !completado
                                ? "No se puede completar hasta que se registre toda la asistencia"
                                : ""
                            }
                          >
                            <i
                              className={`fas ${
                                completado ? "fa-check-circle" : "fa-circle"
                              } me-1`}
                            ></i>
                            {completado
                              ? `✅ ${horario.nombre} Completado`
                              : !todasLasAsistenciasRegistradas()
                              ? `⏳ Esperando asistencia para ${horario.nombre}`
                              : `Marcar ${horario.nombre} como Completado`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Estado sin menús - Solo muestra si es día laboral */}
          {!loading && esDialaboral() && Object.keys(menuDia).length === 0 && (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              No hay menús planificados para hoy. Verifica la planificación del
              día.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuesDiaria;
