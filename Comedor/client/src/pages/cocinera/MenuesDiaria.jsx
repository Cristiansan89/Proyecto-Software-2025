import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import planificacionMenuService from "../../services/planificacionMenuService";
import recetaService from "../../services/recetaService";
import asistenciaService from "../../services/asistenciaService";
import asistenciasService from "../../services/asistenciasService";
import API from "../../services/api.js";
import { showError, showWarning } from "../../utils/alertService.js";
import { formatNumeroAR } from "../../utils/formatNumero";
import ContenidoStyle from "../../styles/ContenidoPage.module.css";
import TablaStyle from "../../styles/Tabla.module.css";

const MenuesDiaria = () => {
  const { user } = useAuth();
  const [hoy, setHoy] = useState(new Date());
  const [servicios, setServicios] = useState([]);
  const [menuDia, setMenuDia] = useState({});
  const [detallesReceta, setDetallesReceta] = useState({});
  const [comensalesHoy, setComensalesHoy] = useState({});
  const [asistenciaReal, setAsistenciaReal] = useState({});
  const [comensalesPorServicio, setComensalesPorServicio] = useState({});
  const [loading, setLoading] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);
  const [serviciosCompletados, setServiciosCompletados] = useState({});
  const [asistenciasCompletas, setAsistenciasCompletas] = useState(false);
  const [hayPlanificacion, setHayPlanificacion] = useState(true);

  // Función HELPER para obtener la fecha en formato YYYY-MM-DD sin problemas de zona horaria
  const obtenerFechaFormato = (fecha = null) => {
    const d = fecha ? new Date(fecha) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatearCantidadExacta = (valor, decimales = 3) => {
    const num = Number(valor);
    if (Number.isNaN(num)) return "0.000";
    return num.toFixed(decimales);
  };

  // Servicios con orden de aparición en el día
  const HORARIOS_SERVICIOS = [
    { id: 1, nombre: "Desayuno", hora: "08:00", icono: "☕" },
    { id: 2, nombre: "Almuerzo", hora: "12:00", icono: "🍽️" },
    { id: 3, nombre: "Merienda", hora: "16:00", icono: "🥪" },
  ];

  // Conversiones estándar de unidades
  const CONVERSIONES = {
    Gramos: { Kilogramos: 1000, Gramos: 1 },
    Kilogramos: { Gramos: 0.001, Kilogramos: 1 },
    Litros: {
      Mililitros: 0.001,
      Litros: 1,
    },
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosDelDia();
  }, [hoy]);

  const cargarDatosDelDia = async () => {
    setLoading(true);
    try {
      const fechaStr = obtenerFechaFormato(hoy);

      // 1. Verificar asistencias registradas
      await verificarAsistenciasRegistradas(fechaStr);

      // 2. Obtener menús de la semana (rango completo de planificación)
      // Obtener primero la planificación activa, luego pendiente, finalmente completado
      let menusResponse = [];
      try {
        // Intentar primero con Activo
        console.log("🔍 Buscando planificaciones con estado Activo...");
        let planificacionesResponse = await API.get(
          "/planificacion-menus/estado/Activo",
        );
        let planificacionesActivas =
          planificacionesResponse.data?.data ||
          planificacionesResponse.data ||
          [];

        // Si no hay Activo, intentar con Pendiente
        if (
          !Array.isArray(planificacionesActivas) ||
          !planificacionesActivas.length
        ) {
          console.log(
            "⚠️ No hay planificaciones Activas, buscando Pendientes...",
          );
          planificacionesResponse = await API.get(
            "/planificacion-menus/estado/Pendiente",
          );
          planificacionesActivas =
            planificacionesResponse.data?.data ||
            planificacionesResponse.data ||
            [];
        }

        // Si no hay Activo ni Pendiente, intentar con Completado (para planificaciones ya cerradas)
        if (
          !Array.isArray(planificacionesActivas) ||
          planificacionesActivas.length === 0
        ) {
          planificacionesResponse = await API.get(
            "/planificacion-menus/estado/Completado",
          );
          planificacionesActivas =
            planificacionesResponse.data?.data ||
            planificacionesResponse.data ||
            [];
        }

        if (
          Array.isArray(planificacionesActivas) &&
          planificacionesActivas.length > 0
        ) {
          // Usar la primera planificación (más reciente)
          const planificacion = planificacionesActivas[0];

          // Buscar menús dentro del rango de la planificación
          menusResponse = await planificacionMenuService.getMenusSemana(
            planificacion.fechaInicio,
            planificacion.fechaFin,
          );
        } else {
          console.warn(
            "⚠️ No hay planificaciones disponibles (ni Activas, ni Pendientes, ni Completadas)",
          );
          showWarning(
            "No hay planificaciones disponibles. Por favor, cree una planificación para continuar.",
          );
          setHayPlanificacion(false);
        }
      } catch (error) {
        showError(
          "Error",
          "❌ No hay menús planificados para este día. Por favor, intente registrar una planificación para la fecha seleccionada.",
        );
        menusResponse = [];
      }

      const menusMap = {};
      if (menusResponse && Array.isArray(menusResponse)) {
        // Log de todas las fechas disponibles
        const fechasDisponibles = [
          ...new Set(menusResponse.map((m) => m.fecha)),
        ];

        for (const menu of menusResponse) {
          // Comparar usando substring(0, 10) para evitar problemas con horas o espacios
          const fechaMenuNormalizada = menu.fecha
            ? menu.fecha.substring(0, 10)
            : null;
          const fechaBuscadaNormalizada = fechaStr.substring(0, 10);
          const coincideFecha =
            fechaMenuNormalizada === fechaBuscadaNormalizada;

          // Filtrar solo los menús del día actual con receta válida
          if (coincideFecha && menu.id_receta) {
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

        // Asegurarse de que es un objeto
        const asistenciaReal =
          asistenciaResponse && typeof asistenciaResponse === "object"
            ? asistenciaResponse
            : {};

        setAsistenciaReal(asistenciaReal);
      } catch (error) {
        console.error("❌ Error al cargar asistencia real:", error);
        showError(
          "Error",
          "❌ Ocurrió un error al cargar la asistencia real. Por favor, intente nuevamente más tarde.",
        );
        // Continuar con los comensales estimados si la asistencia no está disponible
        setAsistenciaReal({});
      }

      // Usar SOLO asistencia real para mostrar información del servicio - Prioridad máxima si existe asistencia > 0

      // 3. Obtener comensales estimados (respaldo)
      const comensalesResponse =
        await planificacionMenuService.calcularComensalesPorFecha(fechaStr);
      setComensalesHoy(comensalesResponse);

      // 4. Cargar servicios disponibles
      const serviciosResponse = await API.get("/servicios");
      setServicios(serviciosResponse.data);

      // 5. Cargar estado de servicios completados
      await cargarEstadoServicios(fechaStr);

      // 6. Cargar comensales registrados por servicio
      await cargarComensalesPorServicio(fechaStr);
    } catch (error) {
      showError(
        "Error",
        "❌ Ocurrió un error al cargar los datos del día. Por favor, intente nuevamente más tarde.",
      );
      mostrarNotificacion("Error al cargar los datos del día", "error");
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para verificar asistencias registradas
  const verificarAsistenciasRegistradas = async (fecha) => {
    try {
      const response =
        await asistenciasService.verificarAsistenciasCompletas(fecha);
      if (response.success && response.data) {
        setAsistenciasCompletas(response.data.completas || false);
      } else {
        setAsistenciasCompletas(false);
      }
    } catch (error) {
      showError(
        "Error",
        "❌ Ocurrió un error al verificar las asistencias. Por favor, intente nuevamente más tarde.",
      );
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
      showError(
        "Error",
        "❌ Ocurrió un error al cargar la receta. Por favor, intente nuevamente más tarde.",
      );
    }
  };

  const cargarEstadoServicios = async (fechaStr) => {
    try {
      const response = await API.get(
        `/servicios/estado-completado?fecha=${fechaStr}`,
      );
      if (response.data) {
        setServiciosCompletados(response.data);
      }
    } catch (error) {}
  };

  const cargarComensalesPorServicio = async (fechaStr) => {
    try {
      const response = await API.get(
        `/servicios/comensales/por-servicio?fecha=${fechaStr}`,
      );
      if (response.data) {
        //console.log("📊 Comensales por servicio cargados:", response.data);
        setComensalesPorServicio(response.data);
      }
    } catch (error) {}
  };

  const obtenerMejorUnidad = (cantidad, unidadOriginal) => {
    // Normalizar la unidad original
    const unidad = unidadOriginal?.toLowerCase() || "";

    // Para gramos: si es >= 1000, convertir a kilogramos
    if (unidad.includes("gramos")) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Kilogramos",
        };
      }
      return { cantidad, unidad: "Gramos" };
    }

    // Para mililitros: si es >= 1000, convertir a litros
    // Pero SOLO si la cantidad en litros sería >= 1 (para evitar 0.005 Litros)
    if (unidad.includes("mililitros")) {
      const cantidadEnLitros = cantidad / 1000;
      if (cantidadEnLitros >= 1) {
        return {
          cantidad: cantidadEnLitros,
          unidad: "Litros",
        };
      }
      return { cantidad, unidad: "Mililitros" };
    }

    // Para litros: mantener en litros
    if (unidad.includes("litros")) {
      return { cantidad, unidad: "Litros" };
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
      return []; // No mostrar ingredientes si no hay asistencia
    }

    // Calcular cantidad total de cada ingrediente basándose en asistencia real
    return receta.insumos.map((ingrediente) => {
      // Parsear cantidad como número decimal (puede ser 0.005 litros, 5 gramos, etc)
      const cantidadPorPorcion = parseFloat(
        String(ingrediente.cantidadPorPorcion),
      );
      const cantidadTotal =
        (isNaN(cantidadPorPorcion) ? 0 : cantidadPorPorcion) *
        Number(comensalesServicio);
      const mejorUnidad = obtenerMejorUnidad(
        cantidadTotal,
        ingrediente.unidadPorPorcion,
      );

      // Mostrar cantidades con formato regional (coma decimal) para visualización
      const cantidadFormateada = formatNumeroAR(mejorUnidad.cantidad);
      // Valor numérico puro para enviar al backend (sin formato de coma)
      const cantidadNumerica = parseFloat(mejorUnidad.cantidad.toFixed(3));

      return {
        ...ingrediente,
        cantidadTotal,
        cantidadOptimizada: `${cantidadFormateada} ${mejorUnidad.unidad}`,
        cantidadOptimizadaNumero: cantidadNumerica,
        unidadOptimizada: mejorUnidad.unidad,
      };
    });
  };

  const marcarServicioCompletado = async (idServicio) => {
    try {
      const fechaStr = obtenerFechaFormato(hoy);

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

        // Registrar consumos en el sistema
        const ingredientes = calcularIngredientesParaServicio(idServicio);

        // Crear un consumo principal con los detalles de los insumos
        try {
          const requestData = {
            id_servicio: idServicio,
            id_jornada: menuDia[idServicio]?.id_jornada,
            id_usuario: user?.id_usuario || user?.idUsuario,
            fecha: fechaStr,
            detalles: ingredientes.map((ingrediente) => ({
              id_insumo: ingrediente.id_insumo || ingrediente.idInsumo,
              cantidad_utilizada: ingrediente.cantidadOptimizadaNumero,
              unidad_medida: ingrediente.unidadOptimizada,
            })),
          };

          await API.post("/consumos", requestData);
        } catch (error) {
          showError(
            "Error",
            `❌ Ocurrió un error al registrar los consumos para el servicio. Por favor, intente nuevamente más tarde.`,
          );
        }
      }

      const response = await API.post(
        "/servicios/marcar-completado",
        requestData,
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
      showError(
        "Error",
        "❌ Ocurrió un error al actualizar el estado del servicio. Por favor, intente nuevamente más tarde.",
      );
      mostrarNotificacion(
        "Error al actualizar el estado del servicio",
        "error",
      );
    }
  };

  const mostrarNotificacion = (texto, tipo = "Info") => {
    setMensajeNotificacion({ texto, tipo });
    setTimeout(() => setMensajeNotificacion(null));
  };

  const imprimirRecetaTicket = (horario, ingredientes, menu) => {
    const fechaStr = obtenerFechaFormato(hoy);
    let contenido = `${"=".repeat(34)}\n`;
    contenido += `RECETA - ${horario.nombre.toUpperCase()}\n`;
    contenido += `Fecha: ${fechaStr}\n`;
    contenido += `Plato: ${menu.nombreReceta}\n`;
    contenido += `Comensales: ${asistenciaReal[horario.id] || 0}\n`;
    contenido += `${"=".repeat(34)}\n\n`;

    contenido += `INGREDIENTES REQUERIDOS:\n`;
    contenido += `${"-".repeat(34)}\n`;
    ingredientes.forEach((ing) => {
      contenido += `${ing.nombreInsumo}: ${ing.cantidadOptimizada}\n`;
    });

    contenido += `\n${"=".repeat(34)}\n`;
    if (detallesReceta[horario.id]?.instrucciones) {
      contenido += `INSTRUCCIONES:\n`;
      contenido += `${detallesReceta[horario.id].instrucciones}\n`;
      contenido += `${"=".repeat(34)}\n`;
    }

    // Crear un elemento iframe invisible para imprimir
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.write(`<!DOCTYPE html>
      <html>
      <head>
        <title>Receta ${horario.nombre}</title>
        <style>
          @page { 
            size: 8cm 20cm; 
            margin: 2mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            color: #000;
            font-size: 11px;
            width: 8cm;
            padding: 2mm;
            line-height: 1.3;
          }
          .ticket-container { 
            width: 100%;
          }
          pre {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: pre-wrap;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 2mm;
              width: 8cm;
            }
            .ticket-container {
              width: 6cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket-container"><pre>${contenido}</pre></div>
      </body>
      </html>`);
    iframeDoc.close();

    // Imprimir después de que el contenido esté listo
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Remover el iframe después de imprimir
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 250);
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
    <div className="mt-2">
      <div className={`${ContenidoStyle.card} shadow-sm`}>
        <div className={`${ContenidoStyle.cardHeader} bg-light`}>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0 ">
              <i className="fas fa-clock me-1"></i>
              Menús del Día
            </h4>
          </div>
        </div>

        <div className={ContenidoStyle.cardBody}>
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => cambiarFecha(-1)}
            >
              <i className="fas fa-chevron-left"></i> Día Anterior
            </button>

            <div className="text-center">
              <h5 className="mb-0 text-capitalize">{nombreDia}</h5>
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
              className={`${ContenidoStyle.alert} ${
                ContenidoStyle[`alert${mensajeNotificacion.tipo}`]
              } alert-dismissible fade show mb-4`}
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
              className={`${ContenidoStyle.alert} ${ContenidoStyle.alertInfo} alert-dismissible fade show mb-4`}
              role="alert"
            >
              <i className="fas fa-info-circle me-2"></i>
              <strong>
                No hay servicio de comedor los sábados y domingos.{" "}
              </strong>
              Los menús del día están disponibles de lunes a viernes.
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={ContenidoStyle.loadingContainer}>
              <i className="fas fa-spinner fa-spin"></i>
              <p>Cargando Menúes del Día...</p>
            </div>
          )}

          {/* Servicios del día - Solo disponible de lunes a viernes */}
          {!loading && esDialaboral() && (
            <div className={ContenidoStyle.servicioContainer}>
              {HORARIOS_SERVICIOS.map((horario) => {
                const menu = menuDia[horario.id];
                const completado = serviciosCompletados[horario.id];
                const ingredientes = calcularIngredientesParaServicio(
                  horario.id,
                );
                const comensalesServicio =
                  comensalesHoy?.servicios?.find(
                    (s) => s.id_servicio === horario.id,
                  )?.totalComensales || 0;

                return (
                  <div
                    key={horario.id}
                    className={`${ContenidoStyle.servicioCard} ${
                      completado ? ContenidoStyle.completado : ""
                    }`}
                  >
                    {/* Header del servicio */}
                    <div className={ContenidoStyle.servicioHeader}>
                      <div className={ContenidoStyle.servicioInfoHeader}>
                        <span className={ContenidoStyle.servicioIcono}>
                          {horario.icono}
                        </span>
                        <div className={ContenidoStyle.servicioDetalles}>
                          <h5 className="mb-0">{horario.nombre}</h5>
                          <small className="text-muted">{horario.hora}</small>
                        </div>
                      </div>

                      {/* Badge de asistencia real */}
                      <div className="d-flex gap-2 flex-wrap justify-content-end">
                        {asistenciaReal[horario.id] !== undefined &&
                        asistenciaReal[horario.id] !== null ? (
                          <span
                            className={`${ContenidoStyle.badge} ${
                              asistenciaReal[horario.id] > 0
                                ? "bg-success text-white"
                                : "bg-warning text-dark"
                            }`}
                          >
                            <i
                              className={`fas ${
                                asistenciaReal[horario.id] > 0
                                  ? "fa-check-circle"
                                  : "fa-user-slash"
                              } me-1`}
                            ></i>
                            {asistenciaReal[horario.id]} presentes
                          </span>
                        ) : (
                          <span
                            className={`${ContenidoStyle.badge} bg-danger text-white`}
                          >
                            <i className="fas fa-times-circle me-1"></i>
                            Sin asistencia registrada
                          </span>
                        )}

                        {/* Badge de comensales registrados por servicio */}
                        {comensalesPorServicio[horario.id]?.comensales_total >
                          0 && (
                          <span
                            className={`${ContenidoStyle.badge} bg-info text-white`}
                          >
                            <i className="fas fa-user-check me-1"></i>
                            Preparado para cocinar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido del servicio */}
                    {!menu ? (
                      <div
                        className={`${ContenidoStyle.alert} ${ContenidoStyle.alertWarning} mt-3 mb-0`}
                      >
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        No hay menú asignado para este servicio
                      </div>
                    ) : (
                      <>
                        {/* Nombre de la receta */}
                        <div className={`${ContenidoStyle.recetaNombre} mt-3`}>
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
                                className={`${ContenidoStyle.instruccionesSection} mt-3 p-3 bg-light border-left-4`}
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
                              <div
                                className={`${ContenidoStyle.ingredientesSection} mt-3`}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0 text-muted">
                                    <i className="fas fa-list me-2"></i>
                                    Ingredientes Requeridos
                                  </h6>
                                </div>
                                <div className={TablaStyle.tableContainer}>
                                  <table
                                    className={`${TablaStyle.tableData} table table-striped`}
                                  >
                                    <thead
                                      className={TablaStyle.tableHeaderFixed}
                                    >
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
                                            <span
                                              className={`${ContenidoStyle.badge} bg-success text-white`}
                                            >
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
                            <div
                              className="btn-group btn-group-sm form-actions"
                              role="group"
                            >
                              {/* Mostrar botones solo si el servicio no está completado */}
                              {!completado && (
                                <div
                                  className="btn-group btn-group-sm"
                                  role="group"
                                >
                                  <button
                                    type="button"
                                    className="btn btn-outline-info"
                                    onClick={() =>
                                      imprimirRecetaTicket(
                                        horario,
                                        ingredientes,
                                        menu,
                                      )
                                    }
                                    title="Imprimir receta en formato ticket"
                                  >
                                    <i className="fas fa-print me-1"></i>
                                    Imprimir
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success"
                                    onClick={() =>
                                      marcarServicioCompletado(horario.id)
                                    }
                                    title="Marcar este servicio como completado"
                                  >
                                    <i className="fas fa-check-circle me-1"></i>
                                    Completado
                                  </button>
                                </div>
                              )}

                              {/* Mostrar mensaje cuando el servicio está completado */}
                              {completado && (
                                <div className="mt-3 text-success fw-bold">
                                  {horario.nombre} completado
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div
                            className={`${ContenidoStyle.alert} ${ContenidoStyle.alertWarning} mt-3 mb-0`}
                          >
                            <i className="fas fa-clock me-1"></i>
                            <strong>Esperando registro de asistencia.</strong>
                            <br />
                            Las instrucciones e ingredientes se mostrarán una
                            vez que el docente registre la asistencia para este
                            servicio.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Estado sin menús - Solo muestra si es día laboral */}
          {!loading && esDialaboral() && Object.keys(menuDia).length === 0 && (
            <>
              {!hayPlanificacion ? (
                <div
                  className={`${ContenidoStyle.alert} ${ContenidoStyle.alertWarning} mt-4`}
                >
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  <strong>No hay planificación semanal disponible.</strong>
                  <br />
                  Debes crear una planificación de menús en la sección de
                  "Planificación de Menús" antes de poder ver los menús del día.
                </div>
              ) : (
                <div
                  className={`${ContenidoStyle.alert} ${ContenidoStyle.alertInfo} mt-4`}
                >
                  <i className="fas fa-info-circle me-1"></i>
                  No hay menús planificados para hoy. Verifica la planificación
                  del día.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuesDiaria;
