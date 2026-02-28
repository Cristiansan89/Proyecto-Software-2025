import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import planificacionMenuService from "../../services/planificacionMenuService";
import recetaService from "../../services/recetaService";
import "../../styles/PlanificacionMenus.css";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const PlanificacionCalendario = () => {
  const { user } = useAuth();

  // Debug: Verificar estructura del usuario
  useEffect(() => {
    //console.log("=== DEBUG USUARIO ===");
    //console.log("Usuario completo:", user);
    //console.log(
    //  "Propiedades del usuario:",
    //  user ? Object.keys(user) : "Usuario es null"
    //);
    //console.log("user?.id_usuario:", user?.id_usuario);
    //console.log("user?.idUsuario:", user?.idUsuario);
    //console.log("user?.id:", user?.id);

    // Validar UUID si hay usuario
    if (user?.idUsuario || user?.id_usuario) {
      const usuarioId = user?.idUsuario || user?.id_usuario;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      /* console.log("✅ Validación UUID:", {
        usuarioId,
        esUUIDValido: uuidRegex.test(usuarioId),
        longitud: usuarioId?.length,
        formato: typeof usuarioId,
      });*/
    }

    // console.log("===================");
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

    /*console.log(`🗓️ Calculando semana desde: ${semanaActual.toISOString()}`);
    console.log(`   - Día de la semana original: ${dia}`);
    console.log(
      `   - Fecha de inicio de semana calculada: ${
        inicio.toISOString().split("T")[0]
      }`
    );*/

    const semana = [];
    for (let i = 0; i < 5; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      semana.push(fecha);
      /*console.log(
        `   - Día ${i}: ${
          fecha.toISOString().split("T")[0]
        } (${fecha.toLocaleDateString("es-ES", { weekday: "long" })})`
      );*/
    }
    return semana;
  };

  // Verificar si una fecha específica está dentro del rango de planificación
  const estaFechaEnRangoPlanificacion = (fecha) => {
    if (!planificacionActiva) {
      /*console.log(
        `❌ No hay planificación activa para fecha: ${
          fecha.toISOString().split("T")[0]
        }`
      );*/
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

    // Solo log si no está en rango para debug
    /*if (!resultado) {
      console.log(`❌ ${fechaStr} fuera de rango: ${inicioStr} a ${finStr}`);
    } else {
      console.log(`✅ ${fechaStr} en rango de planificación`);
    }*/

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
    // Solo llamar a verificarPlanificacionActiva en la carga inicial
    verificarPlanificacionActiva();
  }, []);

  useEffect(() => {
    cargarMenusAsignados();
    cargarComensalesSemana();
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
      const planificacionesOrdenadas = [...todasLasPlanificaciones].sort((a, b) => {
        const fechaA = new Date(a.fechaInicio);
        const fechaB = new Date(b.fechaInicio);
        return fechaA - fechaB;
      });

      // Buscar primero una planificación activa, luego pendiente
      let planificacion = planificacionesOrdenadas.find(
        (p) => p.estado === "Activo"
      );
      if (!planificacion) {
        planificacion = planificacionesOrdenadas.find(
          (p) => p.estado === "Pendiente"
        );
      }

      if (planificacion) {
        // Si hay una planificación, establecer semanaActual a su fecha de inicio
        const fechaInicioPlanificacion = new Date(planificacion.fechaInicio);
        setSemanaActual(fechaInicioPlanificacion);
        setPlanificacionActiva(planificacion);
        /*console.log(
          `✅ Planificación ${planificacion.estado.toLowerCase()} encontrada:`
        );
        console.log(`   - ID: ${planificacion.id_planificacion}`);
        console.log(
          `   - Fecha inicio: ${
            new Date(planificacion.fechaInicio).toISOString().split("T")[0]
          }`
        );
        console.log(
          `   - Fecha fin: ${
            new Date(planificacion.fechaFin).toISOString().split("T")[0]
          }`
        );
        console.log(`   - Estado: ${planificacion.estado}`);
        console.log(
          `   - Inicializando calendario desde ${
            new Date(planificacion.fechaInicio).toISOString().split("T")[0]
          }`
        );*/
      } else {
        // Si no hay planificación activa o pendiente, usar la semana actual
        setPlanificacionActiva(null);
        // console.log(`❌ No se encontró planificación activa ni pendiente`);
      }
    } catch (error) {
      //console.error("Error al verificar planificación activa:", error);
      showError("Error al verificar planificación activa");
      setPlanificacionActiva(null);
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

    /* console.log(
      `📊 Verificando calendario: ${asignados}/${totalEsperado} asignados (${diasLaborales} días laborales)`
    );*/

    if (asignados >= totalEsperado) {
      try {
        // Cambiar estado a Activo automáticamente
        const planificacionActualizada = {
          ...planificacionActiva,
          estado: "Activo",
        };

        await planificacionMenuService.update(
          planificacionActiva.id_planificacion,
          planificacionActualizada
        );

        //console.log("✅ Planificación activada automáticamente");
        // Actualizar el estado local sin recargar desde BD
        setPlanificacionActiva(planificacionActualizada);
      } catch (error) {
        //console.error("Error al activar planificación:", error);
        showError("Error al activar planificación");
      }
    }
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
        "Cancelar"
      );
      if (!confirmedIntegrity) return;
    }

    // 2. Definición dinámica de mensajes según estado
    const esPendiente = planificacionActiva.estado === "Pendiente";
    const tituloModal = esPendiente
      ? "Activar Planificación"
      : "Finalizar Planificación";
    const mensajeModal = esPendiente
      ? "¿Está seguro de que desea activar esta planificación para que sea visible en el calendario?"
      : "¿Está seguro de que desea finalizar esta planificación? Esta acción es irreversible y cerrará el ciclo actual.";

    // 3. Confirmación de cambio de estado
    const confirmChange = await showConfirm(
      tituloModal,
      mensajeModal,
      esPendiente ? "Sí, activar" : "Sí, finalizar",
      "Volver"
    );

    if (!confirmChange) return;

    setFinalizandoPlanificacion(true);
    try {
      if (esPendiente) {
        // Cambio a estado ACTIVO
        await planificacionMenuService.update(
          planificacionActiva.id_planificacion,
          { estado: "Activo" }
        );
        showSuccess(
          "Éxito",
          "La planificación ha sido activada correctamente."
        );
      } else {
        // Cambio a estado FINALIZADO
        await planificacionMenuService.finalizar(
          planificacionActiva.id_planificacion
        );
        showSuccess(
          "Éxito",
          "La planificación ha sido finalizada correctamente."
        );
      }

      await verificarPlanificacionActiva();
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

    //console.log("🔍 Validando usuario ID:", usuarioId);
    //console.log("🔍 Formato UUID válido:", uuidRegex.test(usuarioId));

    if (!uuidRegex.test(usuarioId)) {
      showInfo(
        "Información",
        `Error: El ID del usuario no tiene formato UUID válido: ${usuarioId}`
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

      // console.log("📅 Creando planificación:", nuevaPlanificacion);

      const resultado = await planificacionMenuService.create(
        nuevaPlanificacion
      );

      // console.log("✅ Planificación creada:", resultado);
      showSuccess(
        "Éxito",
        "Planificación creada exitosamente. Ahora puede asignar menús."
      );

      // Recargar planificaciones
      await verificarPlanificacionActiva();
    } catch (error) {
      //console.error("❌ Error al crear planificación:", error);
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

      // Mostrar información adicional en consola para debug
      /*console.log("🔍 Detalles del error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        usuario: user,
        planificacion: nuevaPlanificacion,
      });*/
    } finally {
      setLoading(false);
    }
  };

  const cargarRecetasDisponibles = async () => {
    try {
      const response = await recetaService.getActivas();
      setRecetasDisponibles(response || []);
      //console.log("📚 Recetas cargadas:", response);
    } catch (error) {
      //console.error("Error al cargar recetas disponibles:", error);
      showError("Error al cargar recetas disponibles");
      setRecetasDisponibles([]);
    }
  };

  // Función para obtener recetas filtradas por servicio
  const obtenerRecetasPorServicio = (id_servicio) => {
    //console.log(`🔍 Filtrando recetas para servicio ID: ${id_servicio}`);
    //console.log(`📚 Total recetas disponibles: ${recetasDisponibles.length}`);

    if (!id_servicio) {
      //console.log("⚠️ No hay ID de servicio, devolviendo todas las recetas");
      return recetasDisponibles;
    }

    const recetasFiltradas = recetasDisponibles.filter((receta) => {
      // Las recetas ahora vienen con un array de servicios desde el backend
      if (receta.servicios && Array.isArray(receta.servicios)) {
        const pertenece = receta.servicios.includes(id_servicio);
        /* console.log(
          `   ${pertenece ? "✅" : "❌"} ${receta.nombreReceta} - servicios: [${
            receta.servicios
          }] - ${pertenece ? "SÍ" : "NO"} incluye ${id_servicio}`
        );*/
        return pertenece;
      } else {
        //console.log(`   ❌ ${receta.nombreReceta} - Sin servicios asociados`);
        return false;
      }
    });

    /*console.log(
      `✅ Recetas filtradas para servicio ${id_servicio}: ${recetasFiltradas.length}`
    );*/
    recetasFiltradas.forEach((r) => console.log(`   - ${r.nombreReceta}`));

    return recetasFiltradas;
  };

  const cargarMenusAsignados = async () => {
    try {
      let fechaInicio, fechaFin;

      // Si hay una planificación activa, cargar el rango completo
      if (planificacionActiva) {
        fechaInicio = planificacionActiva.fechaInicio;
        fechaFin = planificacionActiva.fechaFin;
        /*console.log(
          `📅 Cargando menús para la planificación completa: ${
            new Date(fechaInicio).toISOString().split("T")[0]
          } a ${new Date(fechaFin).toISOString().split("T")[0]}`
        );*/
      } else {
        // Si no, cargar solo la semana visible
        const semana = obtenerSemanaActual();
        fechaInicio = semana[0].toISOString().split("T")[0];
        fechaFin = semana[4].toISOString().split("T")[0];
        /*console.log(
          `📅 Cargando menús para la semana ${fechaInicio} a ${fechaFin}`
        );*/
      }

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
            //console.log(`✅ Menú agregado: ${clave} - ${menu.nombreReceta}`);
            menusMap[clave] = menu;
          } else {
            //console.warn("⚠️ Menú incompleto descartado:", menu);
            showWarning("Menú incompleto descartado al cargar menús asignados");
          }
        });
      }

      /* console.log(
        `📊 Total de menús cargados: ${Object.keys(menusMap).length}`
      );*/
      setMenusAsignados(menusMap);
    } catch (error) {
      //console.error("❌ Error al cargar menús asignados:", error);
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
          /*console.warn(
            `Error al cargar comensales para ${fechaStr}:`,
            err?.message || err
          );*/
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
      //console.error("Error al cargar comensales de la semana:", error);
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
        4000
      );
      return;
    }

    //console.log("=== ASIGNANDO MENÚ ===");
    //console.log("Usuario actual:", user);
    //console.log("ID del usuario:", user?.idUsuario || user?.id_usuario);

    const usuarioId = user?.idUsuario || user?.id_usuario;
    if (!usuarioId) {
      showError("Error", "Error: Usuario no autenticado");
      return;
    }

    // Validar formato UUID del usuario
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(usuarioId)) {
      //console.error("❌ ID de usuario inválido:", usuarioId);
      showInfo(
        "Información",
        `Error: El ID del usuario no es válido: ${usuarioId}`
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

      //console.log("📤 Datos de asignación:", datosAsignacion);

      const resultado = await planificacionMenuService.asignarReceta(
        datosAsignacion
      );

      //console.log("✅ Respuesta del servidor:", resultado);

      // Pequeño delay para asegurar que la BD esté actualizada
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Recargar menús asignados
      //console.log("🔄 Recargando menús asignados...");
      await cargarMenusAsignados();

      // Verificar si el calendario está completo para activar la planificación
      await verificarCalendarioCompleto();

      cerrarModalAsignacion();
      showSuccess("Éxito", "Menú asignado exitosamente");
    } catch (error) {
      //console.error("❌ Error al asignar menú:", error);
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
        "Solo se pueden eliminar menús en planificaciones con estado 'Pendiente'."
      );
      return;
    }

    // 2. Confirmación personalizada asíncrona
    const confirmed = await showConfirm(
      "Quitar Receta",
      `¿Está seguro de que desea eliminar la receta asignada para el ${dia} en el servicio de ${servicio.nombre}?`,
      "Sí, quitar",
      "Cancelar"
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
                  <>
                    <span className="badge bg-warning">
                      <i className="fas fa-clock me-1"></i>
                      Planificación Pendiente (
                      {Object.keys(menusAsignados).length} asignaciones)
                    </span>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={finalizarPlanificacion}
                      disabled={finalizandoPlanificacion}
                      title="Complete todas las asignaciones para activar automáticamente"
                    >
                      {finalizandoPlanificacion ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Activando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play me-1"></i>
                          Activar Planificación
                        </>
                      )}
                    </button>
                  </>
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
              <div className="d-flex gap-2 align-items-center">
                <span className="badge bg-warning">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  No hay planificación para esta semana
                </span>
              </div>
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
                      <div className="dia-nombre">{diaNombre}</div>
                      <div
                        className={`dia-fecha ${
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
                  <td className="servicio-cell">
                    <div className="servicio-info">
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
                      <td key={index} className="menu-cell">
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
                                          diaNombre
                                        )
                                      }
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn-action btn-delete btn-sm"
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
                                          diaNombre
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
                                estaDentroDePlanificacion ? (
                                  <button
                                    className="btn btn-outline-success btn-sm w-100"
                                    onClick={() =>
                                      abrirModalAsignacion(
                                        fecha,
                                        servicio,
                                        diaNombre
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

                <div className="mb-4">
                  <label htmlFor="recetaSelect" className="form-label">
                    <i className="fas fa-book me-2"></i>
                    Seleccionar Receta * (
                    {asignacionSeleccionada.servicio?.nombre})
                  </label>
                  {(() => {
                    const recetasFiltradas = obtenerRecetasPorServicio(
                      asignacionSeleccionada.servicio?.id_servicio
                    );
                    return (
                      <>
                        <select
                          id="recetaSelect"
                          className="form-select"
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
                          <div className="alert alert-warning mt-2 mb-0">
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
                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    No hay recetas disponibles. Por favor, cree algunas recetas
                    primero.
                  </div>
                )}

                <div className="form-actions mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={cerrarModalAsignacion}
                  >
                    <i className="fas fa-times me-2"></i>
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
        </div>
      )}
    </div>
  );
};

export default PlanificacionCalendario;
