import {
  validateAsistencia,
  validatePartialAsistencia,
} from "../schemas/asistencias.js";
import { connection } from "../models/db.js";
import telegramService from "../services/telegramService.js";

export class AsistenciaController {
  constructor({ asistenciaModel }) {
    this.asistenciaModel = asistenciaModel;
  }

  getAll = async (req, res) => {
    try {
      const { fecha } = req.query;
      const filtros = {};

      if (fecha) {
        filtros.fecha = fecha;
      }

      const asistencias = await this.asistenciaModel.getAll(filtros);
      res.json(asistencias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const asistencia = await this.asistenciaModel.getById({ id });

      if (!asistencia) {
        return res.status(404).json({ message: "Asistencia no encontrada" });
      }

      res.json(asistencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  getByToken = async (req, res) => {
    try {
      const { token } = req.params;
      const userFromToken = req.user; // Usuario autenticado en middleware

      // Validar token
      const tokenData = await this.asistenciaModel.validateToken(token);

      console.log("🔐 Validación de acceso a asistencia:", {
        tokenDocente: tokenData.idPersonaDocente,
        tokenGrado: tokenData.nombreGrado,
        usuarioAutenticado: userFromToken?.id_persona,
        gradosUsuario: userFromToken?.gradosAsignados,
      });

      // Si hay usuario autenticado, validar que coincida con el del token
      if (userFromToken) {
        if (userFromToken.id_persona !== tokenData.idPersonaDocente) {
          console.error("❌ ACCESO DENEGADO: Docente mismatch", {
            tokenDocente: tokenData.idPersonaDocente,
            usuarioLogueado: userFromToken.id_persona,
            tokenNombre: tokenData.nombreDocente,
            usuarioNombre: userFromToken.nombre,
          });

          return res.status(403).json({
            success: false,
            message:
              `❌ Acceso Denegado: Este enlace es exclusivamente para ${tokenData.nombreDocente}. ` +
              `Tú estás logueado como ${userFromToken.nombre}.`,
            error: "WRONG_USER",
          });
        }

        // Validar que el usuario está asignado al grado del token
        const gradoAsignado = userFromToken.gradosAsignados?.some(
          (g) => g.nombreGrado === tokenData.nombreGrado,
        );

        if (!gradoAsignado) {
          console.error("❌ ACCESO DENEGADO: Grado mismatch", {
            gradoRequerido: tokenData.nombreGrado,
            gradosDisponibles: userFromToken.gradosAsignados?.map(
              (g) => g.nombreGrado,
            ),
          });

          return res.status(403).json({
            success: false,
            message:
              `❌ No estás asignado al grado ${tokenData.nombreGrado}. ` +
              `Tus grados: ${
                userFromToken.gradosAsignados
                  ?.map((g) => g.nombreGrado)
                  .join(", ") || "ninguno"
              }`,
            error: "GRADE_MISMATCH",
          });
        }
      }

      // Obtener alumnos del grado del docente
      const alumnos = await this.asistenciaModel.getAlumnosByDocenteGrado({
        idPersonaDocente: tokenData.idPersonaDocente,
        nombreGrado: tokenData.nombreGrado,
        fecha: tokenData.fecha,
        idServicio: tokenData.idServicio,
      });

      // Obtener información del servicio
      const [servicios] = await connection.query(
        "SELECT nombre, descripcion FROM Servicios WHERE id_servicio = ?",
        [tokenData.idServicio],
      );

      const servicio = servicios?.[0] || {
        nombre: "Servicio",
        descripcion: "",
      };

      console.log("✅ Acceso permitido. Datos cargados:", {
        grado: tokenData.nombreGrado,
        alumnos: alumnos.length,
      });

      res.json({
        success: true,
        tokenData,
        alumnos,
        servicio,
      });
    } catch (error) {
      console.error("❌ Error en getByToken:", error.message);

      if (error.message === "Token expirado") {
        return res.status(401).json({
          success: false,
          message: "⏰ El enlace ha expirado. Solicita uno nuevo.",
          error: "TOKEN_EXPIRED",
        });
      }

      if (error.message === "Token inválido") {
        return res.status(401).json({
          success: false,
          message: "🔒 Enlace inválido o dañado.",
          error: "INVALID_TOKEN",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  registrarAsistencias = async (req, res) => {
    try {
      const { token } = req.params;
      const { asistencias } = req.body;
      const userFromToken = req.user; // Usuario autenticado

      console.log("📝 Iniciando registro de asistencias...");
      console.log("Token:", token.substring(0, 20) + "...");
      console.log("Asistencias recibidas:", asistencias);

      // Validar token
      const tokenData = await this.asistenciaModel.validateToken(token);
      console.log("✅ Token validado:", tokenData);

      // VALIDACIONES DE SEGURIDAD
      // 1. Si hay usuario autenticado, validar que coincida con el del token
      if (userFromToken) {
        if (userFromToken.id_persona !== tokenData.idPersonaDocente) {
          console.error("❌ ACCESO DENEGADO AL REGISTRAR: Docente mismatch");
          return res.status(403).json({
            success: false,
            message:
              "❌ No tienes permisos para registrar asistencias en este grado.",
            error: "UNAUTHORIZED_REGISTRATION",
          });
        }

        // 2. Validar que el usuario está asignado al grado del token
        const gradoAsignado = userFromToken.gradosAsignados?.some(
          (g) => g.nombreGrado === tokenData.nombreGrado,
        );

        if (!gradoAsignado) {
          console.error("❌ ACCESO DENEGADO AL REGISTRAR: Grado mismatch");
          return res.status(403).json({
            success: false,
            message: `❌ No estás asignado al grado ${tokenData.nombreGrado}.`,
            error: "GRADE_NOT_ASSIGNED",
          });
        }
      }

      if (!asistencias || !Array.isArray(asistencias)) {
        return res.status(400).json({
          success: false,
          message: "Datos de asistencias inválidos",
        });
      }

      const resultados = [];

      // Procesar cada asistencia
      for (const asistencia of asistencias) {
        const { idAlumnoGrado, tipoAsistencia } = asistencia;

        console.log(
          `Procesando alumno ${idAlumnoGrado} con tipo ${tipoAsistencia}`,
        );

        if (!["Si", "No", "Ausente"].includes(tipoAsistencia)) {
          return res.status(400).json({
            success: false,
            message: `Tipo de asistencia inválido: ${tipoAsistencia}. Debe ser 'Si', 'No' o 'Ausente'`,
          });
        }

        // VALIDACIÓN: Verificar que el alumno pertenece al grado del token
        const [alumnoVerif] = await connection.query(
          `SELECT ag.id_alumnoGrado, ag.nombreGrado 
           FROM AlumnoGrado ag 
           WHERE ag.id_alumnoGrado = ? AND ag.nombreGrado = ?`,
          [idAlumnoGrado, tokenData.nombreGrado],
        );

        if (!alumnoVerif || alumnoVerif.length === 0) {
          console.error(
            `❌ ALUMNO NO AUTORIZADO: ${idAlumnoGrado} no pertenece a ${tokenData.nombreGrado}`,
          );
          return res.status(403).json({
            success: false,
            message: `❌ El alumno ${idAlumnoGrado} no pertenece al grado ${tokenData.nombreGrado}.`,
            error: "UNAUTHORIZED_STUDENT",
          });
        }

        const resultado = await this.asistenciaModel.upsertAsistencia({
          idServicio: parseInt(tokenData.idServicio),
          idAlumnoGrado: parseInt(idAlumnoGrado),
          fecha: tokenData.fecha,
          tipoAsistencia,
          estado: "Completado",
        });

        console.log(
          `✅ Asistencia registrada para alumno ${idAlumnoGrado}:`,
          resultado,
        );
        resultados.push(resultado);
      }

      console.log(
        "🎉 Todas las asistencias procesadas exitosamente:",
        resultados.length,
      );

      res.json({
        success: true,
        message: "Asistencias registradas correctamente",
        registradas: resultados.length,
        asistencias: resultados,
      });
    } catch (error) {
      console.error("❌ ERROR EN REGISTRAR ASISTENCIAS:");
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);

      if (error.message === "Token expirado") {
        return res.status(401).json({
          success: false,
          message: "⏰ El enlace ha expirado. Solicita uno nuevo.",
          error: "TOKEN_EXPIRED",
        });
      }

      if (error.message === "Token inválido") {
        return res.status(401).json({
          success: false,
          message: "🔒 Enlace inválido o dañado.",
          error: "INVALID_TOKEN",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  generateTokenForDocente = async (req, res) => {
    try {
      const { idPersonaDocente, nombreGrado, fecha, idServicio } = req.body;

      if (!idPersonaDocente || !nombreGrado || !fecha || !idServicio) {
        return res.status(400).json({
          message:
            "Faltan datos requeridos: idPersonaDocente, nombreGrado, fecha, idServicio",
        });
      }

      const token = await this.asistenciaModel.generateTokenForDocente({
        idPersonaDocente,
        nombreGrado,
        fecha,
        idServicio,
      });

      // Usar URL base de variable de entorno (debe ser HTTPS para Telegram)
      const baseUrl =
        process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
      // Cambiar a /asistencias/login para requerir autenticación primero
      const link = `${baseUrl}/asistencias/login/${token}`;

      res.json({
        message: "Token generado correctamente",
        token,
        link,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  create = async (req, res) => {
    try {
      const result = validateAsistencia(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: JSON.parse(result.error.message) });
      }

      const nuevaAsistencia = await this.asistenciaModel.create({
        input: result.data,
      });
      res.status(201).json(nuevaAsistencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  update = async (req, res) => {
    try {
      const result = validatePartialAsistencia(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: JSON.parse(result.error.message) });
      }

      const { id } = req.params;
      const asistenciaActualizada = await this.asistenciaModel.update({
        id,
        input: result.data,
      });

      if (!asistenciaActualizada) {
        return res.status(404).json({ message: "Asistencia no encontrada" });
      }

      res.json(asistenciaActualizada);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.asistenciaModel.delete({ id });

      if (!resultado) {
        return res.status(404).json({ message: "Asistencia no encontrada" });
      }

      res.json({ message: "Asistencia eliminada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  registrarAsistenciasDocente = async (req, res) => {
    try {
      const { asistencias, fecha, idServicio, nombreGrado } = req.body;

      // Validar que se enviaron los datos requeridos
      if (
        !asistencias ||
        !Array.isArray(asistencias) ||
        !fecha ||
        !idServicio ||
        !nombreGrado
      ) {
        return res.status(400).json({
          message:
            "Datos requeridos: asistencias (array), fecha, idServicio, nombreGrado",
        });
      }

      const resultados = [];

      // Procesar cada asistencia
      for (const asistencia of asistencias) {
        const { idAlumnoGrado, estado } = asistencia;

        if (!["Si", "No", "Ausente"].includes(estado)) {
          return res.status(400).json({
            message: `Estado inválido: ${estado}. Debe ser 'Si', 'No' o 'Ausente'`,
          });
        }

        const resultado = await this.asistenciaModel.upsertAsistencia({
          idServicio,
          idAlumnoGrado,
          fecha,
          estado,
        });

        resultados.push(resultado);
      }

      // Obtener información del servicio para el mensaje
      const [servicios] = await connection.query(
        "SELECT nombre FROM Servicios WHERE idServicio = ?",
        [idServicio],
      );
      const nombreServicio = servicios[0]?.nombre || "Servicio";

      // Obtener grados completados vs pendientes
      const [gradosPendientes] = await connection.query(
        `SELECT DISTINCT ag.nombreGrado 
         FROM AlumnoGrado ag
         WHERE ag.nombreGrado != ? 
         AND ag.id_alumnoGrado NOT IN (
           SELECT DISTINCT ra.id_alumnoGrado 
           FROM RegistroAsistencias ra 
           WHERE ra.fechaAsistencia = ? 
           AND ra.id_servicio = ?
         )`,
        [nombreGrado, fecha, idServicio],
      );

      // Preparar mensaje para Telegram
      let mensaje = `📋 <b>Registro de Asistencias Completado</b>\n\n`;
      mensaje += `📅 Fecha: ${fecha}\n`;
      mensaje += `🍽️ Servicio: ${nombreServicio}\n`;
      mensaje += `👥 Grado: ${nombreGrado}\n`;
      mensaje += `✅ Asistencias registradas: ${resultados.length}\n\n`;

      if (gradosPendientes.length > 0) {
        mensaje += `⏳ <b>Grados Pendientes de Registro:</b>\n`;
        gradosPendientes.forEach((grado) => {
          mensaje += `  • ${grado.nombreGrado}\n`;
        });
      } else {
        mensaje += `✨ <b>¡Todos los grados han completado el registro!</b>\n`;
      }

      // Obtener chat ID de la cocinera desde parámetros del sistema
      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo'",
        ["TELEGRAM_COCINERA_CHAT_ID"],
      );

      if (parametros && parametros.length > 0) {
        const chatId = parametros[0].valor;
        try {
          await telegramService.initialize("sistema");
          await telegramService.sendMessage(chatId, mensaje, "sistema", {
            parse_mode: "HTML",
          });
          console.log(`📨 Notificación enviada a cocinera: ${chatId}`);
        } catch (error) {
          console.warn(
            "⚠️ Error al enviar notificación Telegram:",
            error.message,
          );
          // No interrumpir el flujo si falla Telegram
        }
      } else {
        console.warn(
          "⚠️ Chat ID de cocinera no configurado en parámetros del sistema",
        );
      }

      res.json({
        message: "Asistencias registradas correctamente",
        registradas: resultados.length,
        asistencias: resultados,
      });
    } catch (error) {
      console.error("Error en registrarAsistenciasDocente:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Inicializar asistencias en estado Pendiente cuando se envía por Telegram
  initializePendingAsistencias = async (req, res) => {
    try {
      const { id_grado, id_servicio, fecha, idDocente } = req.body;

      // idDocente es opcional, pero id_grado, id_servicio y fecha son obligatorios
      if (!id_grado || !id_servicio || !fecha) {
        return res.status(400).json({
          message: "Datos requeridos: id_grado, id_servicio, fecha",
        });
      }

      console.log("📝 Inicializando asistencias en estado Pendiente...");
      console.log({
        id_grado,
        id_servicio,
        fecha,
        idDocente,
      });

      // Obtener el nombreGrado basado en id_grado
      const [grados] = await connection.query(
        "SELECT nombreGrado FROM Grados WHERE id_grado = ?",
        [id_grado],
      );

      if (!grados || grados.length === 0) {
        return res.status(404).json({
          message: "Grado no encontrado",
        });
      }

      const nombreGrado = grados[0].nombreGrado;

      // Obtener alumnos del grado usando nombreGrado
      const query = `
        SELECT id_alumnoGrado 
        FROM AlumnoGrado 
        WHERE nombreGrado = ?
      `;

      const [alumnos] = await connection.query(query, [nombreGrado]);

      console.log(`Found ${alumnos.length} students in grade ${nombreGrado}`);

      if (alumnos.length === 0) {
        return res.status(404).json({
          message: "No se encontraron alumnos para este grado",
        });
      }

      const resultados = [];

      // Crear registros de asistencia en estado Pendiente
      for (const alumno of alumnos) {
        try {
          const resultado = await this.asistenciaModel.upsertAsistencia({
            idServicio: parseInt(id_servicio),
            idAlumnoGrado: alumno.id_alumnoGrado,
            fecha,
            estado: "Pendiente", // Estado inicial Pendiente
          });

          resultados.push(resultado);
          console.log(
            `✅ Asistencia inicializada para alumno ${alumno.id_alumnoGrado}`,
          );
        } catch (error) {
          console.warn(
            `⚠️ Error al inicializar asistencia para alumno ${alumno.id_alumnoGrado}:`,
            error.message,
          );
          // Continuar con otros alumnos si uno falla
        }
      }

      console.log(
        `🎉 Asistencias inicializadas: ${resultados.length} registros`,
      );
      res.status(201).json({
        message: "Asistencias inicializadas en estado Pendiente correctamente",
        inicializadas: resultados.length,
        asistencias: resultados,
      });
    } catch (error) {
      console.error("❌ Error en initializePendingAsistencias:");
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);

      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  obtenerRegistrosAsistencias = async (req, res) => {
    try {
      const { fecha, idServicio, idGrado } = req.query;

      let query = `
        SELECT 
          a.id_asistencia,
          a.id_servicio,
          a.id_alumnoGrado,
          DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha,
          a.tipoAsistencia,
          a.estado,
          g.id_grado,
          g.nombreGrado as nombreGrado,
          p.nombre,
          p.apellido,
          s.nombre as nombreServicio
        FROM Asistencias a
        JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
        JOIN Grados g ON ag.nombreGrado = g.nombreGrado
        JOIN Personas p ON ag.id_persona = p.id_persona
        JOIN Servicios s ON a.id_servicio = s.id_servicio
        WHERE 1=1
      `;

      const params = [];

      if (fecha) {
        query += " AND a.fecha = ?";
        params.push(fecha);
      }

      if (idServicio) {
        query += " AND a.id_servicio = ?";
        params.push(idServicio);
      }

      if (idGrado) {
        query += " AND g.id_grado = ?";
        params.push(idGrado);
      }

      query += " ORDER BY a.fecha DESC, s.nombre, g.nombreGrado, p.nombre";

      const [asistencias] = await connection.query(query, params);

      // Reformatear datos para que coincidan con lo esperado en el frontend
      const registrosFormateados = asistencias.map((asistencia) => ({
        id_asistencia: asistencia.id_asistencia,
        id_servicio: asistencia.id_servicio,
        id_alumnoGrado: asistencia.id_alumnoGrado,
        id_grado: asistencia.id_grado,
        fecha: asistencia.fecha,
        tipoAsistencia: asistencia.tipoAsistencia,
        estado: asistencia.estado,
        nombreGrado: asistencia.nombreGrado,
        nombreServicio: asistencia.nombreServicio,
        nombreAlumno: `${asistencia.nombre} ${asistencia.apellido}`,
      }));

      res.json({
        success: true,
        data: registrosFormateados,
        message: "Registros obtenidos exitosamente",
      });
    } catch (error) {
      console.error("Error al obtener registros de asistencias:", error);
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };

  obtenerRegistrosAsistenciasServicio = async (req, res) => {
    try {
      const { fecha, idServicio, idGrado } = req.query;

      let query = `
        SELECT 
          a.id_asistencia,
          a.id_servicio,
          a.id_grado,
          a.cantidadPresentes,
          DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha,
          DATE_FORMAT(a.fechaCreacion, '%Y-%m-%d %H:%i:%s') as fechaCreacion,
          DATE_FORMAT(a.fechaActualizacion, '%Y-%m-%d %H:%i:%s') as fechaActualizacion,
          g.nombreGrado,
          s.nombre as nombreServicio
        FROM RegistrosAsistencias a
        LEFT JOIN Grados g ON a.id_grado = g.id_grado
        LEFT JOIN Servicios s ON a.id_servicio = s.id_servicio
        WHERE 1=1
      `;

      const params = [];

      if (fecha) {
        query += " AND DATE(a.fecha) = ?";
        params.push(fecha);
      }

      if (idServicio) {
        query += " AND a.id_servicio = ?";
        params.push(idServicio);
      }

      if (idGrado) {
        query += " AND a.id_grado = ?";
        params.push(idGrado);
      }

      query += " ORDER BY a.fecha DESC, s.nombre, g.nombreGrado";

      const [registros] = await connection.query(query, params);

      res.json({
        success: true,
        data: registros || [],
        message: "Registros de asistencia por servicio obtenidos exitosamente",
      });
    } catch (error) {
      console.error(
        "Error al obtener registros de asistencias por servicio:",
        error,
      );
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };

  // Procesar asistencias completadas y crear registro automático
  procesarAsistenciaCompletada = async (req, res) => {
    try {
      const { fecha, idServicio, idGrado } = req.body;

      if (!fecha || !idServicio || !idGrado) {
        return res.status(400).json({
          success: false,
          message: "Faltan parámetros requeridos: fecha, idServicio, idGrado",
        });
      }

      // Contar asistencias marcadas como "Presente" para esta fecha/servicio/grado
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as cantidadPresentes
         FROM Asistencias 
         WHERE fecha = ? 
         AND id_servicio = ? 
         AND id_grado = ? 
         AND tipoAsistencia = 'Si'`,
        [fecha, idServicio, idGrado],
      );

      const cantidadPresentes = countResult[0]?.cantidadPresentes || 0;

      // Verificar si ya existe un registro en RegistrosAsistencias para esta combinación
      const [existingRecord] = await connection.query(
        `SELECT BIN_TO_UUID(id_asistencia) as id_asistencia, cantidadPresentes
         FROM RegistrosAsistencias 
         WHERE fecha = ? 
         AND id_servicio = ? 
         AND id_grado = ?`,
        [fecha, idServicio, idGrado],
      );

      if (existingRecord.length > 0) {
        // Actualizar registro existente
        await connection.query(
          `UPDATE RegistrosAsistencias 
           SET cantidadPresentes = ?, fechaActualizacion = CURRENT_TIMESTAMP
           WHERE id_asistencia = UUID_TO_BIN(?)`,
          [cantidadPresentes, existingRecord[0].id_asistencia],
        );

        res.json({
          success: true,
          message: `Registro actualizado: ${cantidadPresentes} presentes`,
          data: {
            action: "updated",
            cantidadPresentes,
            id_asistencia: existingRecord[0].id_asistencia,
          },
        });
      } else {
        // Crear nuevo registro
        await connection.query(
          `INSERT INTO RegistrosAsistencias (id_grado, id_servicio, fecha, cantidadPresentes)
           VALUES (?, ?, ?, ?)`,
          [idGrado, idServicio, fecha, cantidadPresentes],
        );

        // Obtener el ID del registro recién creado
        const [newRecord] = await connection.query(
          `SELECT BIN_TO_UUID(id_asistencia) as id_asistencia
           FROM RegistrosAsistencias 
           WHERE fecha = ? AND id_servicio = ? AND id_grado = ?
           ORDER BY fechaCreacion DESC LIMIT 1`,
          [fecha, idServicio, idGrado],
        );

        res.json({
          success: true,
          message: `Registro creado: ${cantidadPresentes} presentes`,
          data: {
            action: "created",
            cantidadPresentes,
            id_asistencia: newRecord[0]?.id_asistencia,
          },
        });
      }
    } catch (error) {
      console.error("Error al procesar asistencia completada:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // Procesar todas las asistencias de una fecha específica
  procesarTodasAsistenciasFecha = async (req, res) => {
    try {
      const { fecha } = req.body;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: "Falta parámetro requerido: fecha",
        });
      }

      // Obtener todas las combinaciones únicas de servicio/grado para la fecha
      const [combinaciones] = await connection.query(
        `SELECT DISTINCT a.id_servicio, 
                g.id_grado,
                g.nombreGrado,
                s.nombre as nombreServicio
         FROM Asistencias a
         JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
         JOIN Grados g ON ag.nombreGrado = g.nombreGrado
         JOIN Servicios s ON a.id_servicio = s.id_servicio
         WHERE DATE(a.fecha) = ?`,
        [fecha],
      );

      const resultados = [];

      for (const combinacion of combinaciones) {
        try {
          // Contar presentes para esta combinación específica
          const [countResult] = await connection.query(
            `SELECT COUNT(*) as cantidadPresentes
             FROM Asistencias a
             JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
             JOIN Grados g ON ag.nombreGrado = g.nombreGrado
             WHERE DATE(a.fecha) = ? 
             AND a.id_servicio = ? 
             AND g.id_grado = ? 
             AND a.tipoAsistencia = 'Si'`,
            [fecha, combinacion.id_servicio, combinacion.id_grado],
          );

          const cantidadPresentes = countResult[0]?.cantidadPresentes || 0;

          // Verificar si ya existe registro
          const [existingRecord] = await connection.query(
            `SELECT id_asistencia
             FROM RegistrosAsistencias 
             WHERE fecha = ? 
             AND id_servicio = ? 
             AND id_grado = ?`,
            [fecha, combinacion.id_servicio, combinacion.id_grado],
          );

          if (existingRecord.length > 0) {
            // Actualizar
            await connection.query(
              `UPDATE RegistrosAsistencias 
               SET cantidadPresentes = ?, fechaActualizacion = CURRENT_TIMESTAMP
               WHERE id_asistencia = ?`,
              [cantidadPresentes, existingRecord[0].id_asistencia],
            );

            resultados.push({
              servicio: combinacion.nombreServicio,
              grado: combinacion.nombreGrado,
              cantidadPresentes,
              action: "updated",
            });
          } else {
            // Crear nuevo
            await connection.query(
              `INSERT INTO RegistrosAsistencias (id_grado, id_servicio, fecha, cantidadPresentes)
               VALUES (?, ?, ?, ?)`,
              [
                combinacion.id_grado,
                combinacion.id_servicio,
                fecha,
                cantidadPresentes,
              ],
            );

            resultados.push({
              servicio: combinacion.nombreServicio,
              grado: combinacion.nombreGrado,
              cantidadPresentes,
              action: "created",
            });
          }
        } catch (combError) {
          console.error(
            `Error procesando ${combinacion.nombreServicio} - ${combinacion.nombreGrado}:`,
            combError,
          );
          resultados.push({
            servicio: combinacion.nombreServicio,
            grado: combinacion.nombreGrado,
            error: combError.message,
            action: "error",
          });
        }
      }

      const exitosos = resultados.filter((r) => r.action !== "error");
      const errores = resultados.filter((r) => r.action === "error");

      res.json({
        success: true,
        message: `Procesados ${exitosos.length} registros exitosamente${
          errores.length > 0 ? `, ${errores.length} con errores` : ""
        }`,
        data: {
          resultados,
          estadisticas: {
            total: combinaciones.length,
            exitosos: exitosos.length,
            errores: errores.length,
          },
        },
      });
    } catch (error) {
      console.error("Error al procesar todas las asistencias:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // 🔧 NUEVO: Generar datos de prueba para las estadísticas
  generarDatosPrueba = async (req, res) => {
    try {
      console.log("🔧 Generando datos de prueba...");

      const hoy = new Date().toISOString().split("T")[0];

      // Obtener un servicio y un grado activos
      const [servicios] = await connection.query(
        "SELECT id_servicio FROM Servicios WHERE estado = 'Activo' LIMIT 1",
      );
      const [grados] = await connection.query(
        "SELECT nombreGrado FROM Grados WHERE estado = 'Activo' LIMIT 1",
      );

      if (servicios.length === 0 || grados.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No hay servicios o grados activos para crear datos de prueba",
        });
      }

      const idServicio = servicios[0].id_servicio;
      const nombreGrado = grados[0].nombreGrado;

      // Obtener alumnos del grado
      const [alumnos] = await connection.query(
        "SELECT id_alumnoGrado FROM AlumnoGrado WHERE nombreGrado = ? LIMIT 20",
        [nombreGrado],
      );

      if (alumnos.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No hay alumnos en este grado",
        });
      }

      console.log(`Creando asistencias para ${alumnos.length} alumnos...`);

      // Crear registros de asistencia
      const registrosCreados = [];
      for (const alumno of alumnos) {
        try {
          const tipoAsistencia = Math.random() > 0.2 ? "Si" : "No"; // 80% presentes
          const query = `
            INSERT INTO Asistencias 
            (id_servicio, id_alumnoGrado, fecha, tipoAsistencia, estado)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            tipoAsistencia = VALUES(tipoAsistencia),
            estado = VALUES(estado)
          `;

          await connection.query(query, [
            idServicio,
            alumno.id_alumnoGrado,
            hoy,
            tipoAsistencia,
            "Completado",
          ]);

          registrosCreados.push({
            id_alumnoGrado: alumno.id_alumnoGrado,
            tipoAsistencia,
          });
        } catch (error) {
          console.warn(
            `⚠️ Error al crear asistencia para alumno ${alumno.id_alumnoGrado}:`,
            error.message,
          );
        }
      }

      console.log(
        `✅ Se crearon ${registrosCreados.length} registros de prueba`,
      );

      res.json({
        success: true,
        message: `Se generaron ${registrosCreados.length} datos de prueba`,
        data: {
          fecha: hoy,
          servicio: idServicio,
          grado: nombreGrado,
          registros: registrosCreados.length,
        },
      });
    } catch (error) {
      console.error("❌ Error al generar datos de prueba:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar datos de prueba",
      });
    }
  };
}
