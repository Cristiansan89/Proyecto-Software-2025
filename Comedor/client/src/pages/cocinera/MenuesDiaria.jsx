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
  const [comensalesPorServicio, setComensalesPorServicio] = useState({});
  const [loading, setLoading] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);
  const [serviciosCompletados, setServiciosCompletados] = useState({});
  const [asistenciasCompletas, setAsistenciasCompletas] = useState(false);

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
        console.log(
          "👥 Asistencia real del día (respuesta completa):",
          asistenciaResponse
        );
        console.log("👥 Tipo de respuesta:", typeof asistenciaResponse);
        console.log(
          "👥 Keys encontradas:",
          Object.keys(asistenciaResponse || {})
        );
        setAsistenciaReal(asistenciaResponse || {});
      } catch (error) {
        console.error("❌ Error al cargar asistencia real:", error);
        // Continuar con los comensales estimados si la asistencia no está disponible
        setAsistenciaReal({});
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

      // 6. Cargar comensales registrados por servicio
      await cargarComensalesPorServicio(fechaStr);
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

  const cargarComensalesPorServicio = async (fechaStr) => {
    try {
      const response = await API.get(
        `/servicios/comensales/por-servicio?fecha=${fechaStr}`
      );
      if (response.data) {
        console.log("📊 Comensales por servicio cargados:", response.data);
        setComensalesPorServicio(response.data);
      }
    } catch (error) {
      console.warn("No se pudo cargar comensales por servicio:", error);
    }
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
    if (unidad.includes("mililitros")) {
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
      // Asegurarse de parsear cualquier string numérico y permitir coma como separador
      const cantidadPorPorcion = parseFloat(
        String(ingrediente.cantidadPorPorcion).replace(/,/g, ".")
      );
      const cantidadTotal =
        (isNaN(cantidadPorPorcion) ? 0 : cantidadPorPorcion) *
        Number(comensalesServicio);
      const mejorUnidad = obtenerMejorUnidad(
        cantidadTotal,
        ingrediente.unidadPorPorcion
      );
      console.log(
        cantidadPorPorcion,
        comensalesServicio,
        cantidadTotal,
        mejorUnidad
      );

      // Formateo: si es entero mostrar sin decimales, si tiene fracción mostrar 1 decimal
      const valor = Number(mejorUnidad.cantidad);
      const cantidadFormateada = Number.isInteger(valor)
        ? String(valor)
        : valor.toFixed(1); // Mostrar solo 1 decimal

      return {
        ...ingrediente,
        cantidadTotal,
        cantidadOptimizada: `${cantidadFormateada} ${mejorUnidad.unidad}`,
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

        // Registrar consumos en el sistema
        const ingredientes = calcularIngredientesParaServicio(idServicio);

        // Log para verificar la estructura de los ingredientes
        if (ingredientes.length > 0) {
          console.log("🔍 Estructura del primer ingrediente:", ingredientes[0]);
        }

        // Crear un consumo principal con los detalles de los insumos
        try {
          const requestData = {
            id_servicio: idServicio,
            id_usuario: user?.id_usuario || user?.idUsuario,
            fecha: fechaStr,
            detalles: ingredientes.map((ingrediente) => ({
              id_insumo: ingrediente.id_insumo || ingrediente.idInsumo,
              cantidad_utilizada: ingrediente.cantidadTotal,
              unidad_medida: ingrediente.unidadPorPorcion,
            })),
          };

          console.log("📤 Datos a enviar a /consumos:", requestData);

          await API.post("/consumos", requestData);
          console.log(
            `✅ Consumos registrados exitosamente para ${
              HORARIOS_SERVICIOS.find((s) => s.id === idServicio)?.nombre
            }`
          );
        } catch (error) {
          console.error(
            `❌ Error al registrar consumos para servicio ${idServicio}:`,
            error.response?.data || error.message
          );
        }
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

  const imprimirRecetaTicket = (horario, ingredientes, menu) => {
    const fechaStr = hoy.toISOString().split("T")[0];
    let contenido = `${"=".repeat(50)}\n`;
    contenido += `RECETA - ${horario.nombre.toUpperCase()}\n`;
    contenido += `Fecha: ${fechaStr}\n`;
    contenido += `Plato: ${menu.nombreReceta}\n`;
    contenido += `Comensales: ${asistenciaReal[horario.id] || 0}\n`;
    contenido += `${"=".repeat(50)}\n\n`;

    contenido += `INGREDIENTES REQUERIDOS:\n`;
    contenido += `${"-".repeat(50)}\n`;
    ingredientes.forEach((ing) => {
      contenido += `${ing.nombreInsumo}: ${ing.cantidadOptimizada}\n`;
    });

    contenido += `\n${"=".repeat(50)}\n`;
    if (detallesReceta[horario.id]?.instrucciones) {
      contenido += `INSTRUCCIONES:\n`;
      contenido += `${detallesReceta[horario.id].instrucciones}\n`;
      contenido += `${"=".repeat(50)}\n`;
    }

    // Abrir ventana y aplicar estilo de ticket con ancho fijo 7.8cm y alto automático
    const ventanaImpresion = window.open(
      "",
      "PRINT",
      "fullscreen=no,toolbar=no,scrollbars=yes"
    );
    ventanaImpresion.document.write(
      `<html><head><title>Receta ${horario.nombre}</title>`
    );
    ventanaImpresion.document.write(`
      <style>
        @page { size: 7.8cm auto; margin: 5mm; }
        body {
          font-family: monospace;
          white-space: pre-wrap;
          margin: 0.4cm;
          width: 7.8cm;
          box-sizing: border-box;
          color: #000;
          font-size: 12px;
        }
        .ticket-container { width: 100%; }
        .title { font-weight: bold; text-align: center; margin-bottom: 6px; }
        .separator { border-top: 1px dashed #000; margin: 6px 0; }
      </style>
    </head><body>`);

    // Insertar todo el contenido (cabecera + ingredientes + instrucciones) UNA sola vez
    // Asegurar quiebres de palabra para evitar desbordes
    ventanaImpresion.document.write(
      '<div class="ticket-container"><pre style="white-space: pre-wrap; overflow-wrap: break-word; word-break: break-word;">' +
        contenido +
        "</pre></div>"
    );
    ventanaImpresion.document.write("</body></html>");
    ventanaImpresion.document.close();
    // Esperar que la ventana cargue antes de invocar el diálogo de impresión
    ventanaImpresion.onload = () => {
      setTimeout(() => ventanaImpresion.print(), 200);
    };
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

                        {/* Badge de comensales registrados por servicio */}
                        {comensalesPorServicio[horario.id]?.comensales_total >
                          0 && (
                          <span className="badge bg-info">
                            <i className="fas fa-user-check me-1"></i>
                            {
                              comensalesPorServicio[horario.id].comensales_total
                            }{" "}
                            para cocinar
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
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0 text-muted">
                                    <i className="fas fa-list me-2"></i>
                                    Ingredientes Requeridos
                                  </h6>
                                </div>
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
                                        menu
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
                          <div className="alert alert-warning mt-3 mb-0">
                            <i className="fas fa-clock me-2"></i>
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
