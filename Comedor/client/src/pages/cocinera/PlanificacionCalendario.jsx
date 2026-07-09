import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import planificacionMenuService from "../../services/planificacionMenuService";
import recetaService from "../../services/recetaService";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import ComponenteStyle from "../../styles/Componentes.module.css";
import CalendarioStyle from "../../styles/Calendario.module.css";

const PlanificacionCalendario = ({ planificacionSeleccionada }) => {
  const { user } = useAuth();

  // Debug: Verificar estructura del usuario
  useEffect(() => {
    // Validar UUID si hay usuario
    if (user?.idUsuario || user?.id_usuario) {
      const usuarioId = user?.idUsuario || user?.id_usuario;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    }
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

  // Verificar si una fecha específica está dentro del rango de planificación
  const estaFechaEnRangoPlanificacion = (fecha) => {
    if (!planificacionActiva) {
      return false; // Sin planificación, no se puede asignar
    }

    const fechaStr = fecha.toISOString().split("T")[0];

    // Normalizar las fechas de inicio y fin eliminando la hora/timezone
    const inicioStr = new Date(planificacionActiva.fechaInicio)
      .toISOString()
      .split("T")[0];
    const finStr = new Date(planificacionActiva.fechaFin)
      .toISOString()
      .split("T")[0];

    const resultado = fechaStr >= inicioStr && fechaStr <= finStr;

    return resultado;
  };

  // Siempre mostrar lunes a viernes (calendario fijo)
  const obtenerDíasVisibles = () => {
    return obtenerSemanaActual(); // Siempre los 5 días laborales
  };

  const cambiarSemana = (direccion) => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(semanaActual.getDate() + direccion * 7);
    setSemanaActual(nuevaSemana);
  };

  useEffect(() => {
    cargarRecetasDisponibles();
    // Solo llamar a verificarPlanificacionActiva en la carga inicial si no hay planificación seleccionada
    if (!planificacionSeleccionada) {
      verificarPlanificacionActiva();
    }
  }, []);

  // useEffect para actualizar cuando se selecciona una planificación diferente
  useEffect(() => {
    if (planificacionSeleccionada) {
      setPlanificacionActiva(planificacionSeleccionada);
      // Establecer la semana desde la fecha de inicio de la planificación seleccionada
      setSemanaActual(new Date(planificacionSeleccionada.fechaInicio));
    }
  }, [planificacionSeleccionada]);

  useEffect(() => {
    // Primero detectar la planificación de la semana, luego cargar menús con ese contexto
    const cargarSemana = async () => {
      const planDetectada = await actualizarPlanificacionParaSemana();
      // Cargar menús usando la planificación detectada directamente
      await cargarMenusAsignadosConPlan(planDetectada);
      await cargarComensalesSemana();
    };
    cargarSemana();
  }, [semanaActual]);

  // Recargar menús cuando cambia el estado de la planificación
  useEffect(() => {
    if (planificacionActiva) {
      cargarMenusAsignados();
    }
  }, [planificacionActiva?.estado]);

  const verificarPlanificacionActiva = async () => {
    try {
      // Obtener todas las planificaciones (sin filtrar por semana)
      const todasLasPlanificaciones = await planificacionMenuService.getAll();

      // Ordenar por fecha de inicio (ascendente - menor fecha primero)
      const planificacionesOrdenadas = [...todasLasPlanificaciones].sort(
        (a, b) => {
          const fechaA = new Date(a.fechaInicio);
          const fechaB = new Date(b.fechaInicio);
          return fechaA - fechaB;
        },
      );

      // Buscar primero una planificación activa, luego programada, luego pendiente
      let planificacion = planificacionesOrdenadas.find(
        (p) => p.estado === "Activo",
      );
      if (!planificacion) {
        planificacion = planificacionesOrdenadas.find(
          (p) => p.estado === "Programado",
        );
      }
      if (!planificacion) {
        planificacion = planificacionesOrdenadas.find(
          (p) => p.estado === "Pendiente",
        );
      }

      if (planificacion) {
        // Si hay una planificación, establecer semanaActual a su fecha de inicio
        const fechaInicioPlanificacion = new Date(planificacion.fechaInicio);
        setSemanaActual(fechaInicioPlanificacion);
        setPlanificacionActiva(planificacion);
      } else {
        // Si no hay planificación activa o pendiente, usar la semana actual
        setPlanificacionActiva(null);
      }
    } catch (error) {
      showError("Error al verificar planificación activa");
      setPlanificacionActiva(null);
    }
  };

  // Busca la planificación que corresponde a la semana visible al navegar
  // Devuelve la planificación encontrada para uso directo (no sólo via setState)
  const actualizarPlanificacionParaSemana = async () => {
    if (planificacionSeleccionada) return planificacionSeleccionada;
    try {
      const semana = obtenerSemanaActual();
      const fechaInicioSemana = semana[0].toISOString().split("T")[0];
      const fechaFinSemana = semana[4].toISOString().split("T")[0];

      const todasLasPlanificaciones = await planificacionMenuService.getAll();
      const prioridad = ["Activo", "Programado", "Pendiente", "Finalizado"];
      let planificacionEncontrada = null;
      for (const estado of prioridad) {
        planificacionEncontrada = todasLasPlanificaciones.find((p) => {
          if (p.estado !== estado) return false;
          const pInicio = new Date(p.fechaInicio).toISOString().split("T")[0];
          const pFin = new Date(p.fechaFin).toISOString().split("T")[0];
          return pInicio <= fechaFinSemana && pFin >= fechaInicioSemana;
        });
        if (planificacionEncontrada) break;
      }
      setPlanificacionActiva(planificacionEncontrada || null);
      return planificacionEncontrada || null;
    } catch {
      return null;
    }
  };

  // Nueva función para verificar si el calendario está completo
  const verificarCalendarioCompleto = async () => {
    if (!planificacionActiva || planificacionActiva.estado !== "Pendiente") {
      return;
    }

    // Calcular el número de días en el rango de planificación
    const fechaInicio = new Date(planificacionActiva.fechaInicio);
    const fechaFin = new Date(planificacionActiva.fechaFin);
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const diasEnPlanificacion =
      Math.ceil((fechaFin - fechaInicio) / millisecondsPerDay) + 1;

    // Solo contar días de lunes a viernes (excluir sábado y domingo)
    let diasLaborales = 0;
    for (let i = 0; i < diasEnPlanificacion; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + i);
      const diaSemana = fecha.getDay();
      // 0 = domingo, 6 = sábado
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasLaborales++;
      }
    }

    const totalEsperado = diasLaborales * servicios.length; // días laborales × 3 servicios
    const asignados = Object.keys(menusAsignados).length;

    // La activación se realiza manualmente por el usuario mediante el botón "Programar"
    // No se cambia el estado automáticamente al completar el calendario
  };

  const finalizarPlanificacion = async () => {
    if (!planificacionActiva) {
      showInfo("Información", "No hay planificación activa para finalizar.");
      return;
    }

    // 1. Validación de integridad (Asignaciones completas)
    const totalEsperado = diasSemana.length * servicios.length;
    const asignados = Object.keys(menusAsignados).length;

    if (asignados < totalEsperado) {
      const faltantes = totalEsperado - asignados;
      const confirmedIntegrity = await showConfirm(
        "Planificación Incompleta",
        `Faltan ${faltantes} asignaciones de menú. ¿Desea activar la planificación de todas formas?`,
        "Sí, activar así",
        "Cancelar",
      );
      if (!confirmedIntegrity) return;
    }

    // 2. Definición dinámica de mensajes según estado
    const esPendiente = planificacionActiva.estado === "Pendiente";
    const tituloModal = esPendiente
      ? "Programar Planificación"
      : "Finalizar Planificación";
    const mensajeModal = esPendiente
      ? "¿Está seguro de que desea programar esta planificación? Pasará a estado 'Programado' (en espera de activación automática)."
      : "¿Está seguro de que desea finalizar esta planificación? Esta acción es irreversible y cerrará el ciclo actual.";

    // 3. Confirmación de cambio de estado
    const confirmChange = await showConfirm(
      tituloModal,
      mensajeModal,
      esPendiente ? "Sí, programar" : "Sí, finalizar",
      "Volver",
    );

    if (!confirmChange) return;

    setFinalizandoPlanificacion(true);
    try {
      let nuevoEstado = esPendiente ? "Programado" : "Finalizado";

      if (esPendiente) {
        // Cambio a estado PROGRAMADO
        await planificacionMenuService.cambiarEstado(
          planificacionActiva.id_planificacion,
          "Programado",
        );
        showSuccess(
          "Éxito",
          "La planificación ha sido programada correctamente y está en cola para activación.",
        );
      } else {
        // Cambio a estado FINALIZADO
        await planificacionMenuService.finalizar(
          planificacionActiva.id_planificacion,
        );
        showSuccess(
          "Éxito",
          "La planificación ha sido finalizada correctamente.",
        );
      }

      // Actualizar el estado localmente sin perder las fechas
      const planificacionActualizada = {
        ...planificacionActiva,
        estado: nuevoEstado,
      };
      setPlanificacionActiva(planificacionActualizada);

      // Cargar menús con la planificación actualizada localmente
      await cargarMenusAsignados();
    } catch (error) {
      // 4. Manejo de errores detallado y seguro
      let mensajeError = "No se pudo actualizar la planificación.";

      if (error.response?.data?.errors) {
        // Mapeo de errores de validación del backend
        const detalles = error.response.data.errors
          .map((err) => `• ${err.message}`)
          .join("<br>");
        mensajeError = `<strong>Errores de validación:</strong><br>${detalles}`;
      } else {
        mensajeError = error.response?.data?.message || error.message;
      }

      showError("Error de Proceso", mensajeError);
    } finally {
      setFinalizandoPlanificacion(false);
    }
  };

  const crearPlanificacionSemanal = async () => {
    if (!confirm("¿Desea crear una nueva planificación para esta semana?")) {
      return;
    }

    // Verificar que hay usuario autenticado
    if (!user?.idUsuario && !user?.id_usuario) {
      showError("Error", "Error: Usuario no autenticado");
      return;
    }

    // Validar que el ID del usuario es un UUID válido
    const usuarioId = user?.idUsuario || user?.id_usuario;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(usuarioId)) {
      showInfo(
        "Información",
        `Error: El ID del usuario no tiene formato UUID válido: ${usuarioId}`,
      );
      return;
    }

    setLoading(true);
    try {
      const semana = obtenerSemanaActual();
      const fechaInicio = semana[0].toISOString().split("T")[0];
      const fechaFin = semana[4].toISOString().split("T")[0];

      const nuevaPlanificacion = {
        id_usuario: usuarioId,
        fechaInicio,
        fechaFin,
        comensalesEstimados: 0,
        estado: "Pendiente",
      };

      const resultado =
        await planificacionMenuService.create(nuevaPlanificacion);

      showSuccess(
        "Éxito",
        "Planificación creada exitosamente. Ahora puede asignar menús.",
      );

      // Recargar planificaciones
      await verificarPlanificacionActiva();
    } catch (error) {
      showError("Error al crear planificación");
      // Mostrar mensaje más específico según el tipo de error
      let mensajeError = "Error al crear planificación";

      if (error.response?.data?.errors) {
        // Error de validación con detalles específicos
        const errores = error.response.data.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join("\n");
        mensajeError = `Errores de validación:\n${errores}`;
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.response?.status) {
        mensajeError = `Error ${error.response.status}: ${
          error.response.statusText || error.message
        }`;
      } else {
        mensajeError += ": " + error.message;
      }

      showError("Error", mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const cargarRecetasDisponibles = async () => {
    try {
      const response = await recetaService.getActivas();
      setRecetasDisponibles(response || []);
    } catch (error) {
      showError("Error al cargar recetas disponibles");
      setRecetasDisponibles([]);
    }
  };

  // Función para obtener recetas filtradas por servicio
  const obtenerRecetasPorServicio = (id_servicio) => {
    if (!id_servicio) {
      return recetasDisponibles;
    }

    const recetasFiltradas = recetasDisponibles.filter((receta) => {
      // Las recetas ahora vienen con un array de servicios desde el backend
      if (receta.servicios && Array.isArray(receta.servicios)) {
        const pertenece = receta.servicios.includes(id_servicio);
        return pertenece;
      } else {
        return false;
      }
    });

    recetasFiltradas.forEach((r) => console.log(`   - ${r.nombreReceta}`));

    return recetasFiltradas;
  };

  const cargarMenusAsignados = async () => {
    return cargarMenusAsignadosConPlan(planificacionActiva);
  };

  // Carga menús usando la planificación pasada como parámetro (evita problema de closure de estado)
  const cargarMenusAsignadosConPlan = async (plan) => {
    try {
      let fechaInicio, fechaFin;

      // Si hay una planificación activa, cargar el rango completo
      if (plan) {
        fechaInicio = new Date(plan.fechaInicio).toISOString().split("T")[0];
        fechaFin = new Date(plan.fechaFin).toISOString().split("T")[0];
      } else {
        // Si no, cargar solo la semana visible
        const semana = obtenerSemanaActual();
        fechaInicio = semana[0].toISOString().split("T")[0];
        fechaFin = semana[4].toISOString().split("T")[0];
      }

      const response = await planificacionMenuService.getMenusSemana(
        fechaInicio,
        fechaFin,
      );

      // Convertir la respuesta a un objeto para fácil acceso
      const menusMap = {};
      if (response && Array.isArray(response)) {
        response.forEach((menu) => {
          if (menu && menu.fecha && menu.id_servicio && menu.id_receta) {
            const clave = `${menu.fecha}_${menu.id_servicio}`;
            menusMap[clave] = menu;
          }
        });
      }

      setMenusAsignados(menusMap);
    } catch (error) {
      showError("Error al cargar menús asignados");
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
          showWarning(`Error al cargar comensales para ${fechaStr}`);
          comensalesMap[fechaStr] = {
            fecha: fechaStr,
            servicios: [],
            resumen: { totalDia: 0 },
          };
        }
      }

      setComensalesPorFecha(comensalesMap);
    } catch (error) {
      showError("Error al cargar comensales de la semana");
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
      showInfo("Por favor seleccione una receta");
      return;
    }

    // Validar que solo se pueda asignar en estado 'Pendiente'
    if (planificacionActiva?.estado !== "Pendiente") {
      showInfo(
        "Solo se pueden asignar menús en planificaciones con estado Pendiente",
        4000,
      );
      return;
    }

    const usuarioId = user?.idUsuario || user?.id_usuario;
    if (!usuarioId) {
      showError("Error", "Error: Usuario no autenticado");
      return;
    }

    // Validar formato UUID del usuario
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(usuarioId)) {
      showInfo(
        "Información",
        `Error: El ID del usuario no es válido: ${usuarioId}`,
      );
      return;
    }

    setLoading(true);
    try {
      const datosAsignacion = {
        fecha: asignacionSeleccionada.fecha.toISOString().split("T")[0],
        id_servicio: asignacionSeleccionada.servicio.id_servicio,
        id_receta: recetaSeleccionada,
        id_usuario: usuarioId,
      };

      const resultado =
        await planificacionMenuService.asignarReceta(datosAsignacion);

      // Pequeño delay para asegurar que la BD esté actualizada
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Recargar menús asignados
      await cargarMenusAsignados();

      // Verificar si el calendario está completo para activar la planificación
      await verificarCalendarioCompleto();

      cerrarModalAsignacion();
      showSuccess("Éxito", "Menú asignado exitosamente");
    } catch (error) {
      showError("Error al asignar menú");

      // 🔧 MEJORADO: Mostrar mensaje más descriptivo
      let mensajeError = error.message;
      if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.response?.status === 409) {
        mensajeError =
          "No se permite agregar esta receta en el servicio seleccionado para esta fecha.";
      }

      showError("Error", "Error al asignar el menú: " + mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const eliminarReceta = async (fecha, servicio, dia) => {
    // 1. Validación de reglas de negocio
    if (planificacionActiva?.estado !== "Pendiente") {
      showInfo(
        "Información",
        "Solo se pueden eliminar menús en planificaciones con estado 'Pendiente'.",
      );
      return;
    }

    // 2. Confirmación personalizada asíncrona
    const confirmed = await showConfirm(
      "Quitar Receta",
      `¿Está seguro de que desea eliminar la receta asignada para el ${dia} en el servicio de ${servicio.nombre}?`,
      "Sí, quitar",
      "Cancelar",
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // 3. Preparación de datos (formato YYYY-MM-DD seguro)
      const fechaLocal = fecha.toLocaleDateString("en-CA"); // Obtiene YYYY-MM-DD sin desfase de zona horaria
      const datosEliminacion = {
        fecha: fechaLocal,
        id_servicio: servicio.id_servicio,
      };

      // 4. Ejecución del servicio
      await planificacionMenuService.eliminarReceta(datosEliminacion);

      // 5. Sincronización de la interfaz
      // Pequeño delay para estabilidad de la base de datos
      await new Promise((resolve) => setTimeout(resolve, 300));

      await cargarMenusAsignados();
      await verificarCalendarioCompleto();

      showSuccess("Éxito", "Receta eliminada correctamente del calendario.");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Error al eliminar la receta";
      showError("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={ContenidoStyle.loadingContainer}>
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando Calendario de Menús...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className={CalendarioStyle.week}>
          <div className={CalendarioStyle.navigationWeek}>
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
                  0,
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
              <div className={CalendarioStyle.itemPlanificacion}>
                {planificacionActiva.estado === "Pendiente" && (
                  <>
                    <span
                      className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeWarning}`}
                    >
                      <i className="fas fa-clock me-1"></i>
                      Planificación Pendiente (
                      {Object.keys(menusAsignados).length} asignaciones)
                    </span>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={finalizarPlanificacion}
                      disabled={finalizandoPlanificacion}
                      title="Complete todas las asignaciones para cambiar a Programado"
                    >
                      {finalizandoPlanificacion ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Programando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-calendar-check me-1"></i>
                          Programar Planificación
                        </>
                      )}
                    </button>
                  </>
                )}
                {planificacionActiva.estado === "Programado" && (
                  <span
                    className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeInfo}`}
                  >
                    <i className="fas fa-calendar-check me-1"></i>
                    Planificación Programada (Esperando)
                  </span>
                )}
                {planificacionActiva.estado === "Activo" && (
                  <span
                    className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeWarning}`}
                  >
                    <i className="fas fa-robot me-1"></i>
                    Planificación Activo (Automatizada)
                  </span>
                )}
                {planificacionActiva.estado === "Finalizado" && (
                  <span
                    className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeSuccess}`}
                  >
                    <i className="fas fa-lock me-1"></i>
                    Planificación Finalizada (Solo Lectura)
                  </span>
                )}
              </div>
            )}
            {!planificacionActiva && (
              <div className={CalendarioStyle.itemPlanificacion}>
                <span
                  className={`${ContenidoStyle.badge} ${ContenidoStyle.badgeWarning}`}
                >
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  No hay planificación para esta semana
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={CalendarioStyle.tableResponsive}>
          <table
            className={`${CalendarioStyle.tableMenuCalendar} table table-bordered`}
          >
            <thead>
              <tr>
                <th className="font-italic">
                  <h4>Servicio</h4>
                </th>
                {obtenerDíasVisibles().map((fecha, index) => {
                  const diaNombre = diasSemana[index];
                  const estaDentroDePlanificacion =
                    estaFechaEnRangoPlanificacion(fecha);

                  return (
                    <th
                      key={fecha.toISOString().split("T")[0]}
                      width="17%"
                      className={`text-center ${
                        estaDentroDePlanificacion ? "" : "dia-no-planificado"
                      }`}
                    >
                      <div className={CalendarioStyle.nombreDia}>
                        {diaNombre}
                      </div>
                      <div
                        className={`${CalendarioStyle.fechaDia} ${
                          estaDentroDePlanificacion ? "" : "text-muted"
                        }`}
                      >
                        {fecha.toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                        {!estaDentroDePlanificacion && (
                          <small className="d-block text-muted">
                            (No planificado)
                          </small>
                        )}
                      </div>
                      {/* Información de comensales del día */}
                      {(() => {
                        const fechaStr = fecha.toISOString().split("T")[0];
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
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio.id_servicio}>
                  <td className={CalendarioStyle.cellServicio}>
                    <div className={CalendarioStyle.infoServicio}>
                      <strong>{servicio.nombre}</strong>
                      <small className="text-muted d-block">
                        {servicio.descripcion}
                      </small>
                    </div>
                  </td>
                  {obtenerDíasVisibles().map((fecha, index) => {
                    const diaNombre = diasSemana[index];
                    const estaDentroDePlanificacion =
                      estaFechaEnRangoPlanificacion(fecha);
                    const claveMenu = `${fecha.toISOString().split("T")[0]}_${
                      servicio.id_servicio
                    }`;
                    const menuAsignado = menusAsignados[claveMenu];

                    return (
                      <td key={index} className={CalendarioStyle.cellMenu}>
                        <div className={CalendarioStyle.slotMenu}>
                          {menuAsignado ? (
                            <div
                              className={`${CalendarioStyle.menuAsignado} ${CalendarioStyle[`servicio-${servicio.id_servicio}`]}`}
                            >
                              <div className={CalendarioStyle.nombreReceta}>
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
                                      s.id_servicio === servicio.id_servicio,
                                  );
                                return servicioComensales ? (
                                  <div className="small text-dark mt-1">
                                    <i className="fas fa-user-friends me-1"></i>
                                    {servicioComensales.totalComensales}{" "}
                                    comensales
                                  </div>
                                ) : null;
                              })()}
                              <div
                                className={`${CalendarioStyle.actionsMenu} mt-2`}
                              >
                                {planificacionActiva?.estado === "Pendiente" ||
                                planificacionActiva?.estado === "Programado" ? (
                                  planificacionActiva?.estado ===
                                  "Pendiente" ? (
                                    <>
                                      <button
                                        className={`${CalendarioStyle.btnAction} ${CalendarioStyle.btnEdit} btn-sm me-1`}
                                        title={
                                          estaDentroDePlanificacion
                                            ? "Cambiar receta"
                                            : "Esta fecha está fuera del rango de planificación"
                                        }
                                        disabled={!estaDentroDePlanificacion}
                                        onClick={() =>
                                          abrirModalAsignacion(
                                            fecha,
                                            servicio,
                                            diaNombre,
                                          )
                                        }
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                      <button
                                        className={`${CalendarioStyle.btnAction} ${CalendarioStyle.btnDelete} btn-sm`}
                                        title={
                                          estaDentroDePlanificacion
                                            ? "Eliminar asignación"
                                            : "Esta fecha está fuera del rango de planificación"
                                        }
                                        disabled={
                                          loading || !estaDentroDePlanificacion
                                        }
                                        onClick={() =>
                                          eliminarReceta(
                                            fecha,
                                            servicio,
                                            diaNombre,
                                          )
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
                                  ) : (
                                    <div className="text-muted small">
                                      <i className="fas fa-lock me-1"></i>
                                      Programado (Solo lectura)
                                    </div>
                                  )
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
                            <div className={CalendarioStyle.placeholderMenu}>
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
                                      s.id_servicio === servicio.id_servicio,
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
                                estaDentroDePlanificacion ? (
                                  <button
                                    className="btn btn-outline-success btn-sm w-100"
                                    onClick={() =>
                                      abrirModalAsignacion(
                                        fecha,
                                        servicio,
                                        diaNombre,
                                      )
                                    }
                                  >
                                    <i className="fas fa-plus me-1"></i>
                                    Asignar Menú
                                  </button>
                                ) : (
                                  <div className="text-muted small text-center">
                                    <i className="fas fa-ban me-1"></i>
                                    Día no planificado
                                  </div>
                                )
                              ) : planificacionActiva?.estado ===
                                "Programado" ? (
                                <div className="text-muted small text-center">
                                  <i className="fas fa-lock me-1"></i>
                                  Programado (Solo lectura)
                                </div>
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

      {/* Modal para asignar receta - Renderizado en Portal para cubrir toda la pantalla */}
      {modalAsignacionVisible &&
        createPortal(
          <div
            className={FormularioStyle.modal}
            onClick={(e) => {
              // Cerrar el modal solo si se hace clic en el overlay, no en el contenido
              if (e.target === e.currentTarget) {
                cerrarModalAsignacion();
              }
            }}
          >
            <div className={FormularioStyle.modalDialog}>
              <div className={FormularioStyle.modalContent}>
                <div className={FormularioStyle.modalHeader}>
                  <h5 className={FormularioStyle.modalTitle}>
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
                  className={FormularioStyle.modalClose}
                  onClick={cerrarModalAsignacion}
                ></button>
              </div>
              <div className={FormularioStyle.modalBody}>
                <div className="mb-2">
                  <label className={ComponenteStyle.formLabel}>
                    <strong>
                      {asignacionSeleccionada.dia} -{" "}
                      {asignacionSeleccionada.servicio?.nombre}
                    </strong>
                  </label>
                </div>
                <div className="mb-3">
                  <label className={ComponenteStyle.formLabel}>
                    <strong>Fecha:</strong>{" "}
                    {asignacionSeleccionada.fecha?.toLocaleDateString("es-ES")}
                  </label>
                </div>
                <div className="mb-3">
                  <label className={ComponenteStyle.formLabel}>
                    <strong>Servicio:</strong>{" "}
                    {asignacionSeleccionada.servicio?.descripcion}
                  </label>
                </div>
                "
                <div className="mb-4">
                  <label
                    htmlFor="recetaSelect"
                    className={ComponenteStyle.formLabel}
                  >
                    <i className="fas fa-book me-2"></i>
                    Seleccionar Receta * (
                    {asignacionSeleccionada.servicio?.nombre})
                  </label>
                  {(() => {
                    const recetasFiltradas = obtenerRecetasPorServicio(
                      asignacionSeleccionada.servicio?.id_servicio,
                    );
                    return (
                      <>
                        <select
                          id="recetaSelect"
                          className={ComponenteStyle.formSelect}
                          value={recetaSeleccionada}
                          onChange={(e) =>
                            setRecetaSeleccionada(e.target.value)
                          }
                        >
                          <option value="">-- Seleccione una receta --</option>
                          {recetasFiltradas.map((receta) => (
                            <option
                              key={receta.id_receta}
                              value={receta.id_receta}
                            >
                              {receta.nombreReceta}
                            </option>
                          ))}
                        </select>
                        {recetasFiltradas.length === 0 && (
                          <div
                            className={`${ComponenteStyle.alert} ${ComponenteStyle.alertWarning} mt-2 mb-0`}
                          >
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            No hay recetas disponibles para{" "}
                            {asignacionSeleccionada.servicio?.nombre}. Cree
                            recetas y asócielas a este servicio.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                {recetasDisponibles.length === 0 && (
                  <div
                    className={`${ComponenteStyle.alert} ${ComponenteStyle.alertWarning}`}
                  >
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay recetas disponibles. Por favor, cree algunas recetas
                    primero.
                  </div>
                )}
                <div className={`${ComponenteStyle.formActions} mt-3`}>
                  <button
                    type="button"
                    className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCancel} me-2`}
                    onClick={cerrarModalAsignacion}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={`${ComponenteStyle.btn} ${ComponenteStyle.btnCreate}`}
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
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PlanificacionCalendario;
