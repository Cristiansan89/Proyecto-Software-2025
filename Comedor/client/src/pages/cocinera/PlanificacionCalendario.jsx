import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import planificacionMenuService from "../../services/planificacionMenuService";
import recetaService from "../../services/recetaService";
import "../../styles/PlanificacionMenus.css";

const PlanificacionCalendario = () => {
  const { user } = useAuth();

  // Debug: Verificar estructura del usuario
  useEffect(() => {
    console.log("=== DEBUG USUARIO ===");
    console.log("Usuario completo:", user);
    console.log(
      "Propiedades del usuario:",
      user ? Object.keys(user) : "Usuario es null"
    );
    console.log("user?.id_usuario:", user?.id_usuario);
    console.log("user?.idUsuario:", user?.idUsuario);
    console.log("user?.id:", user?.id);
    console.log("===================");
  }, [user]);
  const [servicios, setServicios] = useState([
    { id_servicio: 1, nombre: "Desayuno", descripcion: "Comida matutina" },
    {
      id_servicio: 2,
      nombre: "Almuerzo",
      descripcion: "Comida principal del día",
    },
    { id_servicio: 3, nombre: "Merienda", descripcion: "Comida vespertina" },
  ]);
  const [loading, setLoading] = useState(false);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [modalAsignacionVisible, setModalAsignacionVisible] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState({
    fecha: null,
    servicio: null,
    dia: "",
  });
  const [recetaSeleccionada, setRecetaSeleccionada] = useState("");
  const [menusAsignados, setMenusAsignados] = useState({});
  const [planificacionActiva, setPlanificacionActiva] = useState(null);
  const [finalizandoPlanificacion, setFinalizandoPlanificacion] =
    useState(false);
  const [comensalesPorFecha, setComensalesPorFecha] = useState({});
  const [cargandoComensales, setCargandoComensales] = useState(false);

  // Variables para el calendario
  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const [semanaActual, setSemanaActual] = useState(new Date());

  const obtenerSemanaActual = () => {
    const inicio = new Date(semanaActual);
    const dia = inicio.getDay();
    const dif = inicio.getDate() - dia + (dia === 0 ? -6 : 1);
    inicio.setDate(dif);

    const semana = [];
    for (let i = 0; i < 5; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      semana.push(fecha);
    }
    return semana;
  };

  const cambiarSemana = (direccion) => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(semanaActual.getDate() + direccion * 7);
    setSemanaActual(nuevaSemana);
  };

  useEffect(() => {
    cargarRecetasDisponibles();
    // Solo llamar a verificarPlanificacionActiva en la carga inicial
    verificarPlanificacionActiva();
  }, []);

  useEffect(() => {
    cargarMenusAsignados();
    cargarComensalesSemana();
  }, [semanaActual]);

  const verificarPlanificacionActiva = async () => {
    try {
      // Obtener todas las planificaciones (sin filtrar por semana)
      const todasLasPlanificaciones = await planificacionMenuService.getAll();

      // Buscar primero una planificación activa, luego pendiente
      let planificacion = todasLasPlanificaciones.find(
        (p) => p.estado === "Activo"
      );
      if (!planificacion) {
        planificacion = todasLasPlanificaciones.find(
          (p) => p.estado === "Pendiente"
        );
      }

      if (planificacion) {
        // Si hay una planificación, establecer semanaActual a su fecha de inicio
        const fechaInicioPlanificacion = new Date(planificacion.fechaInicio);
        setSemanaActual(fechaInicioPlanificacion);
        setPlanificacionActiva(planificacion);
        console.log(
          `✅ Planificación ${planificacion.estado.toLowerCase()} encontrada. Inicializando calendario desde ${
            planificacion.fechaInicio
          }`
        );
      } else {
        // Si no hay planificación activa o pendiente, usar la semana actual
        setPlanificacionActiva(null);
      }
    } catch (error) {
      console.error("Error al verificar planificación activa:", error);
      setPlanificacionActiva(null);
    }
  };

  // Nueva función para verificar si el calendario está completo
  const verificarCalendarioCompleto = async () => {
    if (!planificacionActiva || planificacionActiva.estado !== "Pendiente") {
      return;
    }

    const semana = obtenerSemanaActual();
    const totalEsperado = diasSemana.length * servicios.length; // 5 días × 3 servicios = 15
    const asignados = Object.keys(menusAsignados).length;

    console.log(
      `📊 Verificando calendario: ${asignados}/${totalEsperado} asignados`
    );

    if (asignados >= totalEsperado) {
      try {
        // Cambiar estado a Activo automáticamente
        await planificacionMenuService.update(
          planificacionActiva.id_planificacion,
          {
            ...planificacionActiva,
            estado: "Activo",
          }
        );

        console.log("✅ Planificación activada automáticamente");
        // Recargar planificación activa para mostrar el nuevo estado
        await verificarPlanificacionActiva();
      } catch (error) {
        console.error("Error al activar planificación:", error);
      }
    }
  };

  const finalizarPlanificacion = async () => {
    if (!planificacionActiva) {
      alert("No hay planificación activa para finalizar");
      return;
    }

    // Verificar que todas las jornadas tienen recetas asignadas
    const semana = obtenerSemanaActual();
    const totalEsperado = diasSemana.length * servicios.length; // 5 días × 3 servicios = 15
    const asignados = Object.keys(menusAsignados).length;

    if (asignados < totalEsperado) {
      const faltantes = totalEsperado - asignados;
      if (
        !confirm(
          `Faltan ${faltantes} asignaciones de menú. ¿Desea finalizar la planificación de todas formas?`
        )
      ) {
        return;
      }
    }

    if (
      !confirm(
        "¿Está seguro de que desea finalizar esta planificación? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setFinalizandoPlanificacion(true);
    try {
      await planificacionMenuService.finalizar(
        planificacionActiva.id_planificacion
      );
      alert("Planificación finalizada exitosamente");
      await verificarPlanificacionActiva();
    } catch (error) {
      console.error("Error al finalizar planificación:", error);
      alert("Error al finalizar la planificación: " + error.message);
    } finally {
      setFinalizandoPlanificacion(false);
    }
  };

  const cargarRecetasDisponibles = async () => {
    try {
      const response = await recetaService.getActivas();
      setRecetasDisponibles(response || []);
    } catch (error) {
      console.error("Error al cargar recetas disponibles:", error);
      setRecetasDisponibles([]);
    }
  };

  const cargarMenusAsignados = async () => {
    try {
      const semana = obtenerSemanaActual();
      const fechaInicio = semana[0].toISOString().split("T")[0];
      const fechaFin = semana[4].toISOString().split("T")[0];

      console.log(
        `📅 Cargando menús para la semana ${fechaInicio} a ${fechaFin}`
      );

      const response = await planificacionMenuService.getMenusSemana(
        fechaInicio,
        fechaFin
      );

      // Convertir la respuesta a un objeto para fácil acceso
      const menusMap = {};
      if (response && Array.isArray(response)) {
        response.forEach((menu) => {
          if (menu && menu.fecha && menu.id_servicio && menu.id_receta) {
            const clave = `${menu.fecha}_${menu.id_servicio}`;
            console.log(`✅ Menú agregado: ${clave} - ${menu.nombreReceta}`);
            menusMap[clave] = menu;
          } else {
            console.warn("⚠️ Menú incompleto descartado:", menu);
          }
        });
      }

      console.log(
        `📊 Total de menús cargados: ${Object.keys(menusMap).length}`
      );
      setMenusAsignados(menusMap);
    } catch (error) {
      console.error("❌ Error al cargar menús asignados:", error);
      setMenusAsignados({});
    }
  };

  // Cargar comensales para cada día de la semana
  async function cargarComensalesSemana() {
    setCargandoComensales(true);
    try {
      const semana = obtenerSemanaActual();
      const comensalesMap = {};

      for (const fecha of semana) {
        const fechaStr = fecha.toISOString().split("T")[0];
        try {
          const datosComensales =
            await planificacionMenuService.calcularComensalesPorFecha(fechaStr);
          comensalesMap[fechaStr] = datosComensales;
        } catch (err) {
          console.warn(
            `Error al cargar comensales para ${fechaStr}:`,
            err?.message || err
          );
          comensalesMap[fechaStr] = {
            fecha: fechaStr,
            servicios: [],
            resumen: { totalDia: 0 },
          };
        }
      }

      setComensalesPorFecha(comensalesMap);
    } catch (error) {
      console.error("Error al cargar comensales de la semana:", error);
    } finally {
      setCargandoComensales(false);
    }
  }

  const abrirModalAsignacion = (fecha, servicio, dia) => {
    const claveMenu = `${fecha.toISOString().split("T")[0]}_${
      servicio.id_servicio
    }`;
    const menuExistente = menusAsignados[claveMenu];

    setAsignacionSeleccionada({ fecha, servicio, dia });
    setRecetaSeleccionada(menuExistente?.id_receta || "");
    setModalAsignacionVisible(true);
  };

  const cerrarModalAsignacion = () => {
    setModalAsignacionVisible(false);
    setAsignacionSeleccionada({ fecha: null, servicio: null, dia: "" });
    setRecetaSeleccionada("");
  };

  const asignarMenu = async () => {
    if (
      !recetaSeleccionada ||
      !asignacionSeleccionada.fecha ||
      !asignacionSeleccionada.servicio
    ) {
      alert("Por favor seleccione una receta");
      return;
    }

    // Validar que solo se pueda asignar en estado 'Pendiente'
    if (planificacionActiva?.estado !== "Pendiente") {
      alert(
        "Solo se pueden asignar menús en planificaciones con estado 'Pendiente'"
      );
      return;
    }

    console.log("=== ASIGNANDO MENÚ ===");
    console.log("Usuario actual:", user);
    console.log("ID del usuario:", user?.idUsuario || user?.id_usuario);

    if (!user?.idUsuario && !user?.id_usuario) {
      alert("Error: Usuario no autenticado");
      return;
    }

    setLoading(true);
    try {
      const datosAsignacion = {
        fecha: asignacionSeleccionada.fecha.toISOString().split("T")[0],
        id_servicio: asignacionSeleccionada.servicio.id_servicio,
        id_receta: recetaSeleccionada,
        id_usuario: user?.idUsuario || user?.id_usuario || null,
      };

      console.log("📤 Datos de asignación:", datosAsignacion);

      const resultado = await planificacionMenuService.asignarReceta(
        datosAsignacion
      );

      console.log("✅ Respuesta del servidor:", resultado);

      // Pequeño delay para asegurar que la BD esté actualizada
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Recargar menús asignados
      console.log("🔄 Recargando menús asignados...");
      await cargarMenusAsignados();

      // Verificar si el calendario está completo para activar la planificación
      await verificarCalendarioCompleto();

      cerrarModalAsignacion();
      alert("Menú asignado exitosamente");
    } catch (error) {
      console.error("❌ Error al asignar menú:", error);
      alert(
        "Error al asignar el menú: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const eliminarReceta = async (fecha, servicio, dia) => {
    // Validar que solo se pueda eliminar en estado 'Pendiente'
    if (planificacionActiva?.estado !== "Pendiente") {
      alert(
        "Solo se pueden eliminar menús en planificaciones con estado 'Pendiente'"
      );
      return;
    }

    if (
      !confirm(
        `¿Está seguro de que desea eliminar la receta asignada para ${dia} - ${servicio.nombre}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const datosEliminacion = {
        fecha: fecha.toISOString().split("T")[0],
        id_servicio: servicio.id_servicio,
      };

      console.log("🗑️ Eliminando receta:", datosEliminacion);

      const resultado = await planificacionMenuService.eliminarReceta(
        datosEliminacion
      );

      console.log("✅ Receta eliminada exitosamente");

      // Pequeño delay para asegurar que la BD esté actualizada
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Recargar menús asignados
      console.log("🔄 Recargando menús asignados después de eliminar...");
      await cargarMenusAsignados();

      // Verificar estado del calendario después de eliminar
      await verificarCalendarioCompleto();

      alert("Receta eliminada exitosamente");
    } catch (error) {
      console.error("❌ Error al eliminar receta:", error);
      alert(
        "Error al eliminar la receta: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planificacion-calendario">
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="week-navigation">
            <button
              className="btn btn-outline-primary-sm btn-sm me-2"
              onClick={() => cambiarSemana(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="mx-3">
              Semana del {obtenerSemanaActual()[0].toLocaleDateString("es-ES")}{" "}
              al {obtenerSemanaActual()[4].toLocaleDateString("es-ES")}
              {/* Mostrar resumen de comensales de la semana */}
              {(() => {
                const totalSemana = Object.values(comensalesPorFecha).reduce(
                  (sum, dia) => sum + (dia.resumen?.totalDia || 0),
                  0
                );
                return totalSemana > 0 ? (
                  <div className="small text-muted d-block mt-1">
                    <i className="fas fa-chart-line me-1"></i>
                    Total semana: {totalSemana} comensales programados
                  </div>
                ) : null;
              })()}
            </span>
            <button
              className="btn btn-outline-primary-sm btn-sm ms-2"
              onClick={() => cambiarSemana(1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          <div>
            {planificacionActiva && (
              <div className="d-flex gap-2 align-items-center">
                {planificacionActiva.estado === "Pendiente" && (
                  <span className="badge bg-warning">
                    <i className="fas fa-clock me-1"></i>
                    Planificación Pendiente (Complete el calendario para
                    activar)
                  </span>
                )}
                {planificacionActiva.estado === "Activo" && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={finalizarPlanificacion}
                    disabled={finalizandoPlanificacion}
                  >
                    {finalizandoPlanificacion ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-1"></i>
                        Finalizar Planificación
                      </>
                    )}
                  </button>
                )}
                {planificacionActiva.estado === "Finalizado" && (
                  <span className="badge bg-success">
                    <i className="fas fa-lock me-1"></i>
                    Planificación Finalizada (Solo Lectura)
                  </span>
                )}
              </div>
            )}
            {!planificacionActiva && (
              <span className="badge bg-warning">
                <i className="fas fa-exclamation-triangle me-1"></i>
                No hay planificación activa
              </span>
            )}
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered menu-calendar-table">
            <thead className="table-light">
              <tr>
                <th className="font-italic">
                  <h4>Servicio</h4>
                </th>
                {diasSemana.map((dia, index) => (
                  <th key={dia} width="17%" className="text-center">
                    <div className="dia-nombre">{dia}</div>
                    <div className="dia-fecha">
                      {obtenerSemanaActual()[index].toLocaleDateString(
                        "es-ES",
                        {
                          day: "2-digit",
                          month: "2-digit",
                        }
                      )}
                    </div>
                    {/* Información de comensales del día */}
                    {(() => {
                      const fechaStr = obtenerSemanaActual()
                        [index].toISOString()
                        .split("T")[0];
                      const comensalesDia = comensalesPorFecha[fechaStr];
                      return comensalesDia ? (
                        <div className="small text-muted mt-1">
                          <i className="fas fa-users me-1"></i>
                          {comensalesDia.resumen?.totalDia || 0} comensales
                        </div>
                      ) : cargandoComensales ? (
                        <div className="small text-muted mt-1">
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        </div>
                      ) : null;
                    })()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio.id_servicio}>
                  <td className="servicio-cell">
                    <div className="servicio-info">
                      <strong>{servicio.nombre}</strong>
                      <small className="text-muted d-block">
                        {servicio.descripcion}
                      </small>
                    </div>
                  </td>
                  {diasSemana.map((dia, diaIndex) => {
                    const fecha = obtenerSemanaActual()[diaIndex];
                    const claveMenu = `${fecha.toISOString().split("T")[0]}_${
                      servicio.id_servicio
                    }`;
                    const menuAsignado = menusAsignados[claveMenu];

                    return (
                      <td key={diaIndex} className="menu-cell">
                        <div className="menu-slot">
                          {menuAsignado ? (
                            <div
                              className={`menu-asignado servicio-${servicio.id_servicio}`}
                            >
                              <div className="receta-nombre">
                                <strong>{menuAsignado.nombreReceta}</strong>
                              </div>
                              {/* Mostrar comensales específicos para este servicio y día */}
                              {(() => {
                                const fechaStr = fecha
                                  .toISOString()
                                  .split("T")[0];
                                const comensalesDia =
                                  comensalesPorFecha[fechaStr];
                                const servicioComensales =
                                  comensalesDia?.servicios?.find(
                                    (s) =>
                                      s.id_servicio === servicio.id_servicio
                                  );
                                return servicioComensales ? (
                                  <div className="small text-dark mt-1">
                                    <i className="fas fa-user-friends me-1"></i>
                                    {servicioComensales.totalComensales}{" "}
                                    comensales
                                  </div>
                                ) : null;
                              })()}
                              <div className="menu-acciones mt-2">
                                {planificacionActiva?.estado === "Pendiente" ? (
                                  <>
                                    <button
                                      className="btn-action btn-edit btn-sm me-1"
                                      title="Cambiar receta"
                                      onClick={() =>
                                        abrirModalAsignacion(
                                          fecha,
                                          servicio,
                                          dia
                                        )
                                      }
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn-action btn-delete btn-sm"
                                      title="Eliminar asignación"
                                      disabled={loading}
                                      onClick={() =>
                                        eliminarReceta(fecha, servicio, dia)
                                      }
                                    >
                                      {loading ? (
                                        <span
                                          className="spinner-border spinner-border-sm"
                                          role="status"
                                          aria-hidden="true"
                                        ></span>
                                      ) : (
                                        <i className="fas fa-trash"></i>
                                      )}
                                    </button>
                                  </>
                                ) : planificacionActiva?.estado === "Activo" ? (
                                  <div className="text-muted small">
                                    <i className="fas fa-lock me-1"></i>
                                    Planificación activa (Solo lectura)
                                  </div>
                                ) : planificacionActiva?.estado ===
                                  "Finalizado" ? (
                                  <div className="text-muted small">
                                    <i className="fas fa-lock me-1"></i>
                                    Planificación finalizada (Solo lectura)
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <div className="menu-placeholder">
                              {/* Mostrar comensales específicos para este servicio y día */}
                              {(() => {
                                const fechaStr = fecha
                                  .toISOString()
                                  .split("T")[0];
                                const comensalesDia =
                                  comensalesPorFecha[fechaStr];
                                const servicioComensales =
                                  comensalesDia?.servicios?.find(
                                    (s) =>
                                      s.id_servicio === servicio.id_servicio
                                  );
                                return servicioComensales ? (
                                  <div className="small text-muted mb-2">
                                    <i className="fas fa-user-friends me-1"></i>
                                    {servicioComensales.totalComensales}{" "}
                                    comensales
                                  </div>
                                ) : null;
                              })()}
                              {planificacionActiva?.estado === "Pendiente" ? (
                                <button
                                  className="btn btn-outline-success btn-sm w-100"
                                  onClick={() =>
                                    abrirModalAsignacion(fecha, servicio, dia)
                                  }
                                >
                                  <i className="fas fa-plus me-1"></i>
                                  Asignar Menú
                                </button>
                              ) : planificacionActiva?.estado === "Activo" ? (
                                <div className="text-muted small text-center">
                                  <i className="fas fa-lock me-1"></i>
                                  Planificación activa (Solo lectura)
                                </div>
                              ) : (
                                <div className="text-muted small text-center">
                                  <i className="fas fa-lock me-1"></i>
                                  No se puede asignar
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para asignar receta */}
      {modalAsignacionVisible && (
        <div
          className="modal-overlay"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            top: 100,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        >
          <div className="modal-content-planificacion">
            <div>
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">
                    <i className="fas fa-utensils me-2"></i>
                    {recetaSeleccionada &&
                    menusAsignados[
                      `${
                        asignacionSeleccionada.fecha
                          ?.toISOString()
                          .split("T")[0]
                      }_${asignacionSeleccionada.servicio?.id_servicio}`
                    ]
                      ? "Cambiar Menú"
                      : "Asignar Menú"}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarModalAsignacion}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">
                    <strong>
                      {asignacionSeleccionada.dia} -{" "}
                      {asignacionSeleccionada.servicio?.nombre}
                    </strong>
                  </label>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Fecha:</strong>{" "}
                    {asignacionSeleccionada.fecha?.toLocaleDateString("es-ES")}
                  </label>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Servicio:</strong>{" "}
                    {asignacionSeleccionada.servicio?.descripcion}
                  </label>
                </div>

                {/* Información de comensales esperados para este servicio y fecha */}
                {(() => {
                  if (!asignacionSeleccionada.fecha) return null;
                  const fechaStr = asignacionSeleccionada.fecha
                    .toISOString()
                    .split("T")[0];
                  const comensalesDia = comensalesPorFecha[fechaStr];
                  const servicioComensales = comensalesDia?.servicios?.find(
                    (s) =>
                      s.id_servicio ===
                      asignacionSeleccionada.servicio?.id_servicio
                  );

                  return servicioComensales ? (
                    <div className="alert alert-info mb-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-users me-2"></i>
                        <div>
                          <strong>Comensales esperados:</strong>{" "}
                          {servicioComensales.totalComensales} estudiantes
                          <div className="small mt-1">
                            {servicioComensales.turnos?.map((turno, index) => (
                              <span key={index} className="me-3">
                                {turno.turno}: {turno.comensales} estudiantes
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : cargandoComensales ? (
                    <div className="alert alert-light mb-3">
                      <div className="d-flex align-items-center">
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        <span>Calculando comensales...</span>
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="mb-4">
                  <label htmlFor="recetaSelect" className="form-label">
                    <i className="fas fa-book me-2"></i>
                    Seleccionar Receta *
                  </label>
                  <select
                    id="recetaSelect"
                    className="form-select"
                    value={recetaSeleccionada}
                    onChange={(e) => setRecetaSeleccionada(e.target.value)}
                  >
                    <option value="">-- Seleccione una receta --</option>
                    {recetasDisponibles.map((receta) => (
                      <option key={receta.id_receta} value={receta.id_receta}>
                        {receta.nombreReceta}
                      </option>
                    ))}
                  </select>
                </div>

                {recetaSeleccionada && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Receta seleccionada:</strong>{" "}
                    {
                      recetasDisponibles.find(
                        (r) => r.id_receta === recetaSeleccionada
                      )?.nombreReceta
                    }
                  </div>
                )}

                {recetasDisponibles.length === 0 && (
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay recetas disponibles. Por favor, cree algunas recetas
                    primero.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModalAsignacion}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={asignarMenu}
                  disabled={!recetaSeleccionada || loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {asignacionSeleccionada &&
                      menusAsignados[
                        `${
                          asignacionSeleccionada.fecha
                            ?.toISOString()
                            .split("T")[0]
                        }_${asignacionSeleccionada.servicio?.id_servicio}`
                      ]
                        ? "Cambiando..."
                        : "Asignando..."}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      {asignacionSeleccionada &&
                      menusAsignados[
                        `${
                          asignacionSeleccionada.fecha
                            ?.toISOString()
                            .split("T")[0]
                        }_${asignacionSeleccionada.servicio?.id_servicio}`
                      ]
                        ? "Cambiar Menú"
                        : "Asignar Menú"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanificacionCalendario;
