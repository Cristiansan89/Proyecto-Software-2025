import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import servicioService from "../../services/servicioService";
import { gradoService } from "../../services/gradoService";
import asistenciasService from "../../services/asistenciasService";
import "../../styles/CocineraGestionAsistencias.css";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showToast,
  showConfirm,
} from "../../utils/alertService";

const CocineraGestionAsistencias = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [grados, setGrados] = useState([]);
  const [gradosFiltrados, setGradosFiltrados] = useState([]);
  const [turnosServicio, setTurnosServicio] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [formulario, setFormulario] = useState({
    fecha: new Date().toISOString().split("T")[0],
    idServicio: "",
    gradosSeleccionados: [],
    mensaje: "",
  });
  const [enlaces, setEnlaces] = useState([]);
  const [mostrarEnlaces, setMostrarEnlaces] = useState(false);
  const enlacesRef = useRef(null);

  // Función para cargar grados filtrados por servicio
  const cargarGradosPorServicio = async (idServicio) => {
    try {
      if (!idServicio) {
        // Si no hay servicio seleccionado, mostrar todos los grados
        setGradosFiltrados(grados);
        setTurnosServicio([]);
        return;
      }

      // Obtener turnos asociados al servicio
      const turnosResponse = await api.get(
        `/servicio-turnos/servicio/${idServicio}/turnos`
      );
      const turnosDelServicio = turnosResponse.data || [];
      setTurnosServicio(turnosDelServicio);

      if (turnosDelServicio.length === 0) {
        // Si no hay turnos específicos, mostrar todos los grados disponibles
        setGradosFiltrados(grados);
        return;
      }

      // Obtener grados por cada turno del servicio
      const gradosPorTurno = [];

      for (const turno of turnosDelServicio) {
        try {
          const gradosResponse = await api.get(
            `/grados/turno/${turno.idTurno}`
          );
          const gradosDelTurno = gradosResponse.data || [];

          // Agregar información del turno a cada grado
          const gradosConTurno = gradosDelTurno.map((grado) => ({
            ...grado,
            turnoInfo: {
              idTurno: turno.idTurno,
              nombreTurno: turno.nombreTurno || turno.nombre,
              horaInicio: turno.horaInicio,
              horaFin: turno.horaFin,
            },
          }));

          gradosPorTurno.push(...gradosConTurno);
        } catch (error) {
          console.error(
            `Error al cargar grados del turno ${
              turno.nombreTurno || turno.nombre
            }:`,
            error
          );
        }
      }

      // Si no se encontraron grados en los turnos, mostrar todos los grados como fallback
      if (gradosPorTurno.length === 0) {
        setGradosFiltrados(grados);
      } else {
        setGradosFiltrados(gradosPorTurno);
      }

      // Limpiar selección de grados cuando cambia el servicio
      setFormulario((prev) => ({
        ...prev,
        gradosSeleccionados: [],
      }));
    } catch (error) {
      console.error("❌ Error al cargar grados por servicio:", error);
      // En caso de error, mostrar todos los grados como fallback
      setGradosFiltrados(grados);
      setTurnosServicio([]);
    }
  };

  // Configuración de Telegram
  const TELEGRAM_BOT_URL = "https://t.me/your_bot_username"; // Reemplazar con tu bot
  const TELEGRAM_CHAT_DISPLAY = "Bot Comedor Escolar";

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (formulario.fecha && servicios.length > 0) {
      filtrarServiciosDisponibles();
    }
  }, [formulario.fecha, servicios]);

  const filtrarServiciosDisponibles = async () => {
    try {
      if (!formulario.fecha) {
        setServiciosDisponibles(servicios);
        return;
      }

      // Verificar qué servicios ya tienen asistencias generadas para esta fecha
      const response = await asistenciasService.obtenerRegistrosAsistencias(
        `fecha=${formulario.fecha}`
      );

      if (response.success) {
        // Obtener IDs de servicios que ya tienen asistencias
        const serviciosConAsistencias = new Set(
          response.data.map((asistencia) => asistencia.id_servicio)
        );

        // Filtrar servicios que NO tienen asistencias generadas
        const serviciosLibres = servicios.filter((servicio) => {
          const idServicio = servicio.idServicio || servicio.id_servicio;
          return !serviciosConAsistencias.has(idServicio);
        });

        setServiciosDisponibles(serviciosLibres);
      } else {
        // Si hay error, mostrar todos los servicios
        setServiciosDisponibles(servicios);
      }
    } catch (error) {
      console.error("Error al filtrar servicios disponibles:", error);
      setServiciosDisponibles(servicios);
    }
  };

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [
        serviciosData,
        gradosData,
        docentesRes,
        docenteGradosRes,
        usuariosRes,
      ] = await Promise.all([
        servicioService.getAll(),
        gradoService.getAll(),
        api.get("/personas"),
        api.get("/docente-grados"),
        api.get("/usuarios"),
      ]);

      const serviciosActivos =
        serviciosData?.filter((s) => s.estado === "Activo") || [];
      setServicios(serviciosActivos);
      setServiciosDisponibles(serviciosActivos); // Inicialmente todos están disponibles

      // Normalizar la estructura de grados para usar id_grado consistentemente
      const gradosActivos =
        gradosData
          ?.filter((g) => g.estado === "Activo")
          .map((grado) => ({
            ...grado,
            id_grado: grado.idGrado || grado.id_grado, // Asegurar que id_grado esté disponible
            idGrado: grado.idGrado || grado.id_grado, // Mantener ambas por compatibilidad
          })) || [];

      setGrados(gradosActivos);
      setGradosFiltrados(gradosActivos); // Inicialmente mostrar todos

      // Filtrar solo los docentes y agregar información de grados asignados
      const docentesFiltrados =
        docentesRes.data?.filter(
          (p) => p.nombreRol === "Docente" && p.estado === "Activo"
        ) || [];

      // Mapear docentes con sus grados asignados y datos de usuario (teléfono)
      const docentesConGrados = docentesFiltrados.map((docente) => {
        // Usar idPersona en lugar de id_persona para compatibilidad con la API
        const idPersonaDocente = docente.idPersona || docente.id_persona;

        // Buscar grados asignados usando el ID de persona correctamente
        const gradosAsignados =
          docenteGradosRes.data
            ?.filter((dg) => dg.idPersona === idPersonaDocente)
            .map((dg) => ({
              idGrado: dg.idGrado,
              id_grado: dg.idGrado, // Normalizar para compatibilidad
              nombreGrado: dg.nombreGrado,
            })) || [];

        // Buscar el usuario asociado para obtener el teléfono
        const usuarioAsociado = usuariosRes.data?.find(
          (u) => u.idPersona === idPersonaDocente
        );

        return {
          ...docente,
          id_persona: idPersonaDocente, // Normalizar para uso interno
          gradosAsignados,
          telefono: usuarioAsociado?.telefono || docente.telefono || null,
        };
      });

      setDocentes(docentesConGrados);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showError("Error", "Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si cambió el servicio, filtrar grados por turnos del servicio
    if (name === "idServicio") {
      cargarGradosPorServicio(value);
    }
  };

  const handleGradoSelection = (gradoId) => {
    setFormulario((prev) => ({
      ...prev,
      gradosSeleccionados: prev.gradosSeleccionados.includes(gradoId)
        ? prev.gradosSeleccionados.filter((id) => id !== gradoId)
        : [...prev.gradosSeleccionados, gradoId],
    }));
  };

  const seleccionarTodosGrados = () => {
    const gradosDisponibles = formulario.idServicio ? gradosFiltrados : grados;
    const todosIds = gradosDisponibles.map((g) => g.id_grado || g.idGrado);
    setFormulario((prev) => ({
      ...prev,
      gradosSeleccionados:
        prev.gradosSeleccionados.length === gradosDisponibles.length
          ? []
          : todosIds,
    }));
  };

  // Función para inicializar asistencias en el backend
  const inicializarAsistencias = async (gradoId) => {
    try {
      console.log("📝 Inicializando asistencias para grado:", gradoId);
      const response = await api.post("/asistencias/inicializar-pendiente", {
        id_grado: gradoId,
        id_servicio: parseInt(formulario.idServicio),
        fecha: formulario.fecha,
      });

      console.log("✅ Asistencias inicializadas:", response.data);
      return true;
    } catch (error) {
      console.error(
        "❌ Error al inicializar asistencias:",
        error.response?.data || error.message
      );
      return false;
    }
  };

  const generarEnlaces = async () => {
    try {
      setLoading(true);

      if (
        !formulario.fecha ||
        !formulario.idServicio ||
        formulario.gradosSeleccionados.length === 0
      ) {
        showToast(
          "Por favor complete todos los campos requeridos",
          "info",
          2000
        );
        return;
      }

      // Verificar si ya existen registros de asistencia para la fecha y servicio
      const verificacion =
        await asistenciasService.verificarAsistenciasCompletas(
          formulario.fecha,
          formulario.idServicio
        );

      if (verificacion.data.completas) {
        const confirmar = await showConfirm(
          "Confirmar acción",
          "Ya existen registros de asistencia para esta fecha y servicio. ¿Desea generar enlaces de todas formas?"
        );
        if (!confirmar) {
          return;
        }
      }

      // Generar enlaces para cada grado seleccionado
      const enlacesGenerados = [];

      for (const gradoId of formulario.gradosSeleccionados) {
        const grado = grados.find((g) => (g.id_grado || g.idGrado) === gradoId);
        const servicio = servicios.find(
          (s) =>
            (s.idServicio || s.id_servicio) === parseInt(formulario.idServicio)
        );

        // 🔧 NUEVO: Inicializar asistencias en el backend para este grado
        const inicializoOk = await inicializarAsistencias(gradoId);
        if (!inicializoOk) {
          console.warn(
            `⚠️ No se pudieron inicializar las asistencias para el grado ${
              grado?.nombreGrado || grado?.nombre
            }, pero continuando...`
          );
        }

        // Encontrar al docente asignado a este grado específico
        const docenteGrado = docentes.find((docente) => {
          const tieneGradoAsignado = docente.gradosAsignados?.some((grad) => {
            const gradoIdNormalizado = grad.idGrado || grad.id_grado;
            const coincide = gradoIdNormalizado === gradoId;
            return coincide;
          });
          return tieneGradoAsignado;
        });

        if (!docenteGrado) {
          console.warn(
            `⚠️ No se encontró docente asignado para el grado ${
              grado?.nombreGrado || grado?.nombre
            }`
          );
          continue; // Saltar este grado si no tiene docente asignado
        }

        // Crear token con la estructura que espera el backend
        const tokenData = {
          idPersonaDocente: docenteGrado.id_persona,
          nombreGrado: grado.nombreGrado || grado.nombre,
          fecha: formulario.fecha,
          idServicio: formulario.idServicio,
          timestamp: Date.now(),
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
        };

        // Generar token compatible con el backend usando Buffer para manejar caracteres especiales
        const tokenString = JSON.stringify(tokenData);
        const token = btoa(unescape(encodeURIComponent(tokenString))); // Maneja caracteres UTF-8
        const enlace = `${window.location.origin}/asistencias/registro/${token}`;

        enlacesGenerados.push({
          id: `${gradoId}-${formulario.idServicio}`,
          grado: grado?.nombreGrado || grado?.nombre || `Grado ${gradoId}`,
          servicio: servicio?.nombre || "Servicio",
          enlace,
          token,
          docente: {
            nombre: `${docenteGrado.nombre} ${docenteGrado.apellido}`,
            telefono: docenteGrado.telefono || null,
            email: docenteGrado.email || docenteGrado.correo,
          },
          fecha: formulario.fecha,
        });
      }

      setEnlaces(enlacesGenerados);
      setMostrarEnlaces(true);

      // Scroll automático hacia los enlaces generados después de un pequeño delay
      setTimeout(() => {
        if (enlacesRef.current) {
          enlacesRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);

      // Mostrar mensaje de éxito
      showInfo(
        "Información",
        `✅ Se generaron ${enlacesGenerados.length} enlaces exitosamente`
      );

      // Actualizar servicios disponibles después de generar enlaces
      await filtrarServiciosDisponibles();

      // Limpiar selección de servicio y grados después de generar enlaces
      setFormulario((prev) => ({
        ...prev,
        idServicio: "",
        gradosSeleccionados: [],
      }));
      setGradosFiltrados(grados); // Resetear grados filtrados
    } catch (error) {
      console.error("Error al generar enlaces:", error);
      showError("Error", "Error al generar enlaces");
    } finally {
      setLoading(false);
    }
  };

  const copiarEnlace = (enlace) => {
    navigator.clipboard.writeText(enlace).then(() => {
      showSuccess("Éxito", "Enlace copiado al portapapeles");
    });
  };

  const formatearTelefonoTelegram = (telefono) => {
    if (!telefono) {
      console.warn("⚠️ No se proporcionó teléfono");
      return null;
    }

    // Remover cualquier carácter que no sea número
    let numeroLimpio = telefono.toString().replace(/\D/g, "");

    // Si el número empieza con 0, removerlo (formato local argentino)
    if (numeroLimpio.startsWith("0")) {
      numeroLimpio = numeroLimpio.substring(1);
    }

    // Si el número empieza con 15, removerlo (prefijo de celular argentino)
    if (numeroLimpio.startsWith("15")) {
      numeroLimpio = numeroLimpio.substring(2);
    }

    // Si el número ya tiene el código de país completo +549
    if (numeroLimpio.startsWith("549")) {
      return numeroLimpio;
    }

    // Si el número empieza con 54, agregar el 9
    if (numeroLimpio.startsWith("54") && !numeroLimpio.startsWith("549")) {
      const resultado = "549" + numeroLimpio.substring(2);
      return resultado;
    }

    // Para números de 10 dígitos (formato argentino estándar: ej 3764239133)
    if (numeroLimpio.length === 10) {
      const resultado = "549" + numeroLimpio;
      return resultado;
    }

    // Para cualquier otro caso, agregar 549 al inicio
    const resultado = "549" + numeroLimpio;
    return resultado;
  };

  const enviarTelegramIndividual = async (
    telefono,
    mensaje,
    grado,
    servicio
  ) => {
    if (!telefono) {
      showToast(
        "No hay información de teléfono para este docente",
        "info",
        2000
      );
      return;
    }

    try {
      const enlace = enlaces.find(
        (e) => e.grado === grado && e.servicio === servicio
      );

      const mensajeCompleto = `🏫 *Comedor Escolar* 📝

¡Hola!

${
  mensaje ||
  `Te envío el enlace para registrar las asistencias del ${grado} para el servicio de ${servicio}.`
}

📅 *Fecha:* ${new Date(formulario.fecha).toLocaleDateString("es-ES")}
🍽️ *Servicio:* ${servicio}
📚 *Grado:* ${grado}

Por favor registra las asistencias en el siguiente enlace:
${enlace?.enlace}

Saludos cordiales,
${user.nombre} ${user.apellido}
🍳 *Comedor Escolar*`;

      // Formatear teléfono para Telegram (usar número internacional)
      const telefonoFormateado = formatearTelefonoTelegram(telefono);

      if (telefonoFormateado) {
        // Crear enlace de Telegram usando número de teléfono
        const mensajeCodificado = encodeURIComponent(mensajeCompleto);
        const telegramUrl = `https://t.me/+${telefonoFormateado}?text=${mensajeCodificado}`;

        // Abrir Telegram con el mensaje
        window.open(telegramUrl, "_blank");
        showInfo(
          "Información",
          `✅ Se abrió Telegram para enviar mensaje a ${grado} (+${telefonoFormateado})`
        );
      } else {
        // Fallback: abrir bot general con mensaje
        const botUrl = `https://t.me/SistemaComedor_Bot?start=mensaje`;
        window.open(botUrl, "_blank");
        showInfo(
          "Información",
          `📱 Se abrió el bot de Telegram (número no válido para ${grado})`
        );
      }
    } catch (error) {
      console.error("Error al generar enlace de Telegram:", error);
      showInfo(
        "Información",
        `❌ Error al generar enlace de Telegram: ${error.message}`
      );
    }
  };

  const enviarTelegramTodos = async () => {
    if (enlaces.length === 0) {
      showToast("Primero debe generar los enlaces", "info", 2000);
      return;
    }

    // Validar que los enlaces tengan la estructura correcta
    const enlacesValidos = enlaces.every(
      (e) => (e.enlace || e.token) && e.grado
    );
    if (!enlacesValidos) {
      console.error("Enlaces inválidos:", enlaces);
      showError("Error", "Error: Los enlaces no tienen la estructura correcta");
      return;
    }

    try {
      console.log("Enviando enlaces por Telegram:", enlaces);

      // Preparar datos para enviar al servidor
      // El servidor reconstruirá los URLs con FRONTEND_URL correcto
      const gradosData = enlaces.map((e) => ({
        grado: e.grado,
        docente: e.docente,
        token: e.token, // Enviar el token para que el servidor reconstruya la URL
        enlace: e.enlace,
      }));

      const response = await api.post("/telegram/send-asistencias", {
        gradosData: gradosData,
        fecha: formulario.fecha,
        mensaje: formulario.mensaje,
      });

      if (response.data.success) {
        showSuccess("Éxito", "Enlaces enviados por Telegram correctamente");

        // Inicializar asistencias en estado Pendiente para cada grado seleccionado
        for (const gradoId of formulario.gradosSeleccionados) {
          try {
            await api.post("/asistencias/inicializar-pendiente", {
              id_grado: gradoId,
              id_servicio: parseInt(formulario.idServicio),
              fecha: formulario.fecha,
              idDocente:
                docentes.find((d) =>
                  d.gradosAsignados?.some(
                    (g) => (g.idGrado || g.id_grado) === gradoId
                  )
                )?.id_persona || null,
            });
          } catch (err) {
            console.warn(
              `Error inicializando asistencias para grado ${gradoId}:`,
              err
            );
          }
        }

        // Limpiar enlaces y formulario automáticamente después de enviar
        setEnlaces([]);
        setMostrarEnlaces(false);

        // Limpiar también el formulario de generación de enlaces
        setFormulario({
          fecha: new Date().toISOString().split("T")[0],
          idServicio: "",
          gradosSeleccionados: [],
          mensaje: "",
        });
        setGradosFiltrados(grados); // Resetear grados filtrados
      } else {
        throw new Error(
          response.data.message || "Error al enviar por Telegram"
        );
      }
    } catch (error) {
      console.error("Error enviando por Telegram:", error);
      showError(
        "Error",
        "Error al enviar por Telegram. Verifique la configuración del bot."
      );
    }
  };

  const limpiarFormulario = () => {
    setFormulario({
      fecha: new Date().toISOString().split("T")[0],
      idServicio: "",
      gradosSeleccionados: [],
      mensaje: "",
    });
    setEnlaces([]);
    setMostrarEnlaces(false);
    setGradosFiltrados(grados); // Resetear grados filtrados
  };

  const registrarAsistenciaDirecta = async (enlace) => {
    const cantidadPresentes = prompt(
      `Registre la cantidad de alumnos presentes para ${enlace.grado} - ${enlace.servicio}:`,
      "0"
    );

    if (cantidadPresentes === null || cantidadPresentes === "") {
      return;
    }

    const cantidad = parseInt(cantidadPresentes);
    if (isNaN(cantidad) || cantidad < 0) {
      showToast("Por favor ingrese un número válido", "info", 2000);
      return;
    }

    try {
      setLoading(true);

      // Buscar el ID del grado en la estructura de datos
      const grado = grados.find(
        (g) => (g.nombreGrado || g.nombre) === enlace.grado
      );
      if (!grado) {
        showError("Error", "No se pudo encontrar el grado");
        return;
      }

      const resultado = await asistenciasService.crearRegistroAsistencia({
        id_grado: grado.id_grado || grado.idGrado,
        id_servicio: formulario.idServicio,
        fecha: formulario.fecha,
        cantidadPresentes: cantidad,
      });

      if (resultado.success) {
        showSuccess("Éxito", "Asistencia registrada correctamente");
        // Actualizar el estado visual del enlace
        setEnlaces((prev) =>
          prev.map((e) =>
            e.id === enlace.id
              ? { ...e, registrado: true, cantidadPresentes: cantidad }
              : e
          )
        );
      } else {
        showInfo("Información", `❌ Error: ${resultado.message}`);
      }
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      showError("Error", "Error al registrar asistencia");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Generando enlaces...</span>
        </div>
        <p className="mt-3">Cargando gestión de asistencias...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <i className="fas fa-calendar-check me-2"></i>
            Gestión de Asistencias
          </h1>
          <p className="page-subtitle">
            Generar y enviar enlaces de registro de asistencias a los docentes
          </p>
        </div>
      </div>
      <div className="page-header-cocinera">
        <div className="card shadow-sm">
          <div className="card-header bg-light text-dark">
            <h5 className="mb-0">Generar Enlaces de Asistencia</h5>
          </div>
          <div className="card-body">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generarEnlaces();
              }}
            >
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="fecha" className="form-label">
                    <i className="fas fa-calendar me-2"></i>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="fecha"
                    name="fecha"
                    value={formulario.fecha}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="idServicio" className="form-label">
                    <i className="fas fa-utensils me-2"></i>
                    Servicio *
                  </label>
                  <select
                    className="form-select"
                    id="idServicio"
                    name="idServicio"
                    value={formulario.idServicio}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar servicio</option>
                    {serviciosDisponibles.length > 0 ? (
                      serviciosDisponibles.map((servicio) => (
                        <option
                          key={servicio.idServicio || servicio.id_servicio}
                          value={servicio.idServicio || servicio.id_servicio}
                        >
                          {servicio.nombre}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No hay servicios disponibles para esta fecha
                      </option>
                    )}
                  </select>
                  {serviciosDisponibles.length === 0 &&
                    servicios.length > 0 && (
                      <div className="mt-2 alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Información:</strong> Todos los servicios ya
                        tienen enlaces generados para la fecha{" "}
                        {formulario.fecha}. Si necesita regenerar un enlace,
                        primero debe eliminar las asistencias existentes.
                      </div>
                    )}
                </div>
              </div>

              <div className="mb-4">
                <div className="form-label mb-3">
                  <i className="fas fa-school me-2"></i>
                  {formulario.idServicio
                    ? "Grados disponibles para el servicio seleccionado"
                    : "Grados a incluir"}{" "}
                  *
                  <span className="badge bg-info ms-2">
                    {formulario.gradosSeleccionados.length} seleccionados
                  </span>
                  {formulario.idServicio && turnosServicio.length > 0 && (
                    <span className="badge bg-secondary ms-2">
                      Turnos:{" "}
                      {turnosServicio.map((t) => t.nombreTurno).join(", ")}
                    </span>
                  )}
                </div>

                {!formulario.idServicio ? (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>
                      Primero selecciona un servicio para ver los grados
                      disponibles según los turnos asociados a ese servicio.
                    </strong>
                  </div>
                ) : (
                  <div className="grados-selection">
                    <div className="mb-3">
                      <button
                        type="button"
                        className={`btn btn-sm me-2 ${
                          formulario.gradosSeleccionados.length ===
                          (formulario.idServicio ? gradosFiltrados : grados)
                            .length
                            ? "btn-outline-danger"
                            : "btn-outline-primary"
                        }`}
                        onClick={seleccionarTodosGrados}
                      >
                        <i
                          className={`fas ${
                            formulario.gradosSeleccionados.length ===
                            (formulario.idServicio ? gradosFiltrados : grados)
                              .length
                              ? "fa-times"
                              : "fa-check-double"
                          } me-2`}
                        ></i>
                        {formulario.gradosSeleccionados.length ===
                        (formulario.idServicio ? gradosFiltrados : grados)
                          .length
                          ? "Deseleccionar todos"
                          : "Seleccionar todos"}
                      </button>
                      <small className="text-muted">
                        Total de grados{" "}
                        {formulario.idServicio
                          ? "disponibles para este servicio"
                          : "disponibles"}
                        :{" "}
                        {
                          (formulario.idServicio ? gradosFiltrados : grados)
                            .length
                        }
                      </small>
                    </div>

                    <div className="row g-3">
                      {(formulario.idServicio ? gradosFiltrados : grados).map(
                        (grado) => {
                          const gradoId = grado.id_grado || grado.idGrado;
                          const docenteAsignado = docentes.find((docente) =>
                            docente.gradosAsignados?.some(
                              (grad) =>
                                (grad.idGrado || grad.id_grado) === gradoId
                            )
                          );

                          const isSelected =
                            formulario.gradosSeleccionados.includes(gradoId);

                          return (
                            <div key={gradoId} className="col-md-6 col-lg-4">
                              <div
                                className={`card grado-card h-100 ${
                                  isSelected
                                    ? "border-primary bg-primary bg-opacity-10"
                                    : "border-light"
                                }`}
                              >
                                <div className="card-body p-3">
                                  <div className="form-check mb-0">
                                    <input
                                      className="form-check-input form-check-input-lg"
                                      type="checkbox"
                                      id={`grado-${gradoId}`}
                                      checked={isSelected}
                                      onChange={() =>
                                        handleGradoSelection(gradoId)
                                      }
                                    />
                                    <label
                                      className="form-check-label w-100 cursor-pointer"
                                      htmlFor={`grado-${gradoId}`}
                                    >
                                      <div className="grado-info">
                                        <div className="grado-header d-flex justify-content-between align-items-center mb-2">
                                          <h6 className="grado-nombre mb-0 fw-bold">
                                            <i className="fas fa-graduation-cap me-2"></i>
                                            {grado.nombreGrado}
                                            {grado.turnoInfo && (
                                              <div className="small text-muted mt-1">
                                                <i className="fas fa-clock me-1"></i>
                                                {grado.turnoInfo.nombreTurno} (
                                                {grado.turnoInfo.horaInicio} -{" "}
                                                {grado.turnoInfo.horaFin})
                                              </div>
                                            )}
                                          </h6>
                                          {isSelected && (
                                            <span className="badge bg-primary">
                                              <i className="fas fa-check"></i>
                                            </span>
                                          )}
                                        </div>

                                        <div className="docente-info">
                                          {docenteAsignado ? (
                                            <div className="docente-asignado">
                                              <div className="d-flex align-items-center text-success mb-1">
                                                <i className="fas fa-user me-2"></i>
                                                <strong className="small">
                                                  {docenteAsignado.nombre}{" "}
                                                  {docenteAsignado.apellido}
                                                </strong>
                                              </div>
                                              {docenteAsignado.telefono && (
                                                <div className="d-flex align-items-center text-muted mb-1">
                                                  <i className="fas fa-phone me-2"></i>
                                                  <span className="small">
                                                    +549
                                                    {docenteAsignado.telefono}
                                                  </span>
                                                </div>
                                              )}
                                              {docenteAsignado.email && (
                                                <div className="d-flex align-items-center text-muted">
                                                  <i className="fas fa-envelope me-2"></i>
                                                  <span className="small text-truncate">
                                                    {docenteAsignado.email}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="text-warning">
                                              <i className="fas fa-exclamation-triangle me-2"></i>
                                              <span className="small">
                                                Sin docente asignado
                                              </span>
                                              <div className="text-muted small mt-1">
                                                No se podrá enviar enlace por
                                                Telegram
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {formulario.gradosSeleccionados.length === 0 &&
                      (formulario.idServicio ? gradosFiltrados : grados)
                        .length > 0 && (
                        <div className="alert alert-warning mt-3">
                          <i className="fas fa-info-circle me-2"></i>
                          Debe seleccionar al menos un grado para continuar.
                        </div>
                      )}

                    {formulario.idServicio && gradosFiltrados.length === 0 && (
                      <div className="alert alert-warning mt-3">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        No hay grados disponibles para el servicio seleccionado.
                        <br />
                        <strong>Posibles causas:</strong>
                        <ul className="mb-0 mt-2">
                          <li>El servicio no tiene turnos asignados</li>
                          <li>
                            Los turnos del servicio no tienen grados activos
                            asociados
                          </li>
                          <li>
                            Debe configurar la relación servicio-turno-grados en
                            la administración
                          </li>
                        </ul>
                      </div>
                    )}

                    {formulario.gradosSeleccionados.length > 0 && (
                      <div className="alert alert-info mt-3">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>
                          {formulario.gradosSeleccionados.length}
                        </strong>{" "}
                        grado(s) seleccionado(s)
                        {formulario.idServicio && turnosServicio.length > 0 && (
                          <span>
                            {" "}
                            del servicio{" "}
                            <strong>
                              {
                                servicios.find(
                                  (s) => s.idServicio === formulario.idServicio
                                )?.nombre
                              }
                            </strong>
                            (Turnos:{" "}
                            {turnosServicio
                              .map((t) => t.nombreTurno)
                              .join(", ")}
                            )
                          </span>
                        )}
                        . Se generarán enlaces para enviar a los docentes
                        correspondientes.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="mensaje" className="form-label">
                  <i className="fas fa-comment me-2"></i>
                  Mensaje personalizado (opcional)
                </label>
                <textarea
                  className="form-control"
                  id="mensaje"
                  name="mensaje"
                  rows="3"
                  placeholder="Mensaje adicional para los docentes..."
                  value={formulario.mensaje}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn btn-primary ${loading ? "disabled" : ""}`}
                  disabled={
                    loading ||
                    serviciosDisponibles.length === 0 ||
                    !formulario.idServicio ||
                    formulario.gradosSeleccionados.length === 0
                  }
                >
                  {loading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Generando...</span>
                      </div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link me-2"></i>
                      Generar Enlaces
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    if (enlaces.length > 0) {
                      const confirmar = await showConfirm(
                        "Confirmar acción",
                        "¿Está seguro que desea limpiar el formulario? Se perderán los enlaces generados."
                      );
                      if (confirmar) {
                        limpiarFormulario();
                      }
                    } else {
                      limpiarFormulario();
                    }
                  }}
                >
                  <i className="fas fa-broom me-2"></i>
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Panel de enlaces generados */}
      {mostrarEnlaces && enlaces.length > 0 && (
        <div ref={enlacesRef} className="card mt-4 fade-in">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h4>🔗 Enlaces Generados</h4>
              <small className="text-success">
                <i className="fas fa-check-circle me-1"></i>
                {enlaces.length} enlaces listos para compartir
              </small>
            </div>
            <div>
              <button
                className="btn btn-primary me-2"
                onClick={enviarTelegramTodos}
              >
                <i className="fab fa-telegram me-2"></i>
                Enviar por Telegram
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th width="12%">
                      <i className="fas fa-graduation-cap me-2"></i>
                      Grado
                    </th>
                    <th width="12%">
                      <i className="fas fa-utensils me-2"></i>
                      Servicio
                    </th>
                    <th width="20%">
                      <i className="fas fa-user-tie me-2"></i>
                      Docente Asignado
                    </th>
                    <th width="20%">
                      <i className="fas fa-link me-2"></i>
                      Enlace Generado
                    </th>
                    <th width="12%">
                      <i className="fas fa-check-circle me-2"></i>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enlaces.map((enlace) => {
                    const telefonoFormateado = enlace.docente?.telefono
                      ? formatearTelefonoTelegram(enlace.docente.telefono)
                      : null;

                    return (
                      <tr key={enlace.id}>
                        <td>
                          <span className="badge bg-primary fs-6 px-3 py-2">
                            <i className="fas fa-school me-1"></i>
                            {enlace.grado}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">
                            {enlace.servicio}
                          </div>
                          <small className="text-muted">
                            {new Date(enlace.fecha).toLocaleDateString("es-ES")}
                          </small>
                        </td>
                        <td>
                          {enlace.docente ? (
                            <div className="docente-info">
                              <div className="fw-bold text-success mb-1">
                                <i className="fas fa-user me-2"></i>
                                {enlace.docente.nombre}
                              </div>

                              {telefonoFormateado && (
                                <div className="d-flex align-items-center mb-1">
                                  <i className="fab fa-telegram text-primary me-2"></i>
                                  <span className="small font-monospace bg-light px-2 py-1 rounded">
                                    +{telefonoFormateado}
                                  </span>
                                </div>
                              )}

                              {enlace.docente.email && (
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-envelope text-muted me-2"></i>
                                  <span className="small text-muted">
                                    {enlace.docente.email}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-warning">
                              <i className="fas fa-exclamation-triangle me-2"></i>
                              <span className="fw-semibold">
                                Sin docente asignado
                              </span>
                              <div className="small text-muted mt-1">
                                No se puede enviar enlace
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="enlace-container">
                            <code className="enlace-preview d-block bg-light p-2 rounded small text-truncate">
                              {enlace.enlace}
                            </code>
                            <small className="text-muted mt-1 d-block">
                              Token: ...{enlace.token.slice(-8)}
                            </small>
                          </div>
                        </td>
                        <td>
                          {enlace.registrado ? (
                            <div className="text-center">
                              <span className="badge bg-success fs-6 px-3 py-2">
                                <i className="fas fa-check me-1"></i>
                                Registrado
                              </span>
                              {enlace.cantidadPresentes && (
                                <div className="small text-muted mt-1">
                                  {enlace.cantidadPresentes} presentes
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="badge bg-warning fs-6 px-3 py-2">
                                <i className="fas fa-clock me-1"></i>
                                Pendiente
                              </span>
                              <div className="small text-muted mt-1">
                                Esperando registro
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CocineraGestionAsistencias;
