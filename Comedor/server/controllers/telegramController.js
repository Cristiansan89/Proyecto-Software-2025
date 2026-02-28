import telegramService from "../services/telegramService.js";

export class TelegramController {
  // Obtener estado del bot de Telegram
  static async getStatus(req, res) {
    try {
      const { botType = "sistema" } = req.query;
      const status = telegramService.getStatus(botType);
      res.json({
        status,
        botType,
        message: status.isReady
          ? `Bot ${botType} de Telegram conectado`
          : `Bot ${botType} de Telegram desconectado`,
      });
    } catch (error) {
      console.error("Error al obtener estado de Telegram:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Inicializar el bot de Telegram
  static async initialize(req, res) {
    try {
      const { botType = "sistema" } = req.body;
      const result = await telegramService.initialize(botType);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error al inicializar Telegram:", error);
      res.status(500).json({
        message: "Error al inicializar Telegram",
        error: error.message,
      });
    }
  }

  // Enviar mensaje a un chat específico
  static async sendMessage(req, res) {
    try {
      const { chatId, message, botType = "sistema", options } = req.body;

      if (!chatId || !message) {
        return res.status(400).json({
          success: false,
          message: "chatId y message son requeridos",
        });
      }

      const result = await telegramService.sendMessage(
        chatId,
        message,
        botType,
        options
      );

      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId,
          message: "Mensaje enviado correctamente",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Error al enviar mensaje",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Error al enviar mensaje por Telegram:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // Enviar enlaces de asistencia formateados
  static async sendAsistencias(req, res) {
    try {
      // Los enlaces ahora vienen como objetos simples, necesitamos reconstruir los URLs correctos
      const { gradosData, fecha, mensaje, chatId } = req.body;

      console.log("📨 Datos recibidos en sendAsistencias:", {
        gradosData: gradosData?.length,
        fecha,
        mensaje,
        chatId,
      });

      if (
        !gradosData ||
        !Array.isArray(gradosData) ||
        gradosData.length === 0
      ) {
        console.error(
          "❌ Validación fallida: gradosData inválidos",
          gradosData
        );
        return res.status(400).json({
          success: false,
          message: "Se requiere un array de datos de grados válido",
        });
      }

      if (!fecha) {
        console.error("❌ Validación fallida: fecha no proporcionada");
        return res.status(400).json({
          success: false,
          message: "La fecha es requerida",
        });
      }

      console.log(
        "✅ Validaciones pasadas, generando enlaces con FRONTEND_URL..."
      );
      console.log("🔍 FRONTEND_URL actual:", process.env.FRONTEND_URL);

      // Importar la clase AsistenciaModel si es necesario
      // Por ahora asumimos que los tokens ya vienen
      const enlacesConURLCorrecta = gradosData.map((grado) => ({
        ...grado,
        // Si el enlace es un token base64, reconstruirlo con FRONTEND_URL
        // Cambiar a /asistencias/login para requerir autenticación primero
        enlace: grado.token
          ? `${process.env.FRONTEND_URL}/asistencias/login/${grado.token}`
          : grado.enlace,
      }));

      const formattedMessage = telegramService.formatAsistenciasMessage(
        enlacesConURLCorrecta,
        fecha,
        mensaje
      );
      const buttons = telegramService.formatAsistenciasButtons(
        enlacesConURLCorrecta
      );

      console.log("✅ Mensaje formateado. Enviando...");

      // Obtener chat ID de la BD si no se proporciona
      let targetChatId = chatId;
      if (!targetChatId) {
        try {
          // Importar conexión a la base de datos
          const { connection } = await import("../models/db.js");
          const [parametros] = await connection.query(
            "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo' LIMIT 1",
            ["TELEGRAM_DOCENTES_CHAT_ID"]
          );

          if (parametros && parametros.length > 0) {
            targetChatId = parametros[0].valor;
            console.log("📱 Chat ID obtenido de BD:", targetChatId);
          } else {
            console.warn(
              "⚠️ TELEGRAM_DOCENTES_CHAT_ID no encontrado en BD, usando valor por defecto"
            );
            // Usar un valor por defecto (puedes cambiar esto por el chat ID real)
            targetChatId =
              process.env.TELEGRAM_DOCENTES_CHAT_ID || "-1002419447293";
          }
        } catch (dbError) {
          console.warn(
            "⚠️ Error obteniendo chat ID de BD:",
            dbError.message,
            "usando valor por defecto"
          );
          targetChatId =
            process.env.TELEGRAM_DOCENTES_CHAT_ID || "-1002419447293";
        }
      }

      // Validar que tenemos un chat ID
      if (!targetChatId) {
        console.error("❌ No hay chat ID especificado");
        return res.status(400).json({
          success: false,
          message: "Se requiere un chat ID para enviar el mensaje",
        });
      }

      console.log("📨 Chat ID a usar:", targetChatId);

      const result = await telegramService.sendMessageWithButtons(
        targetChatId,
        formattedMessage,
        buttons,
        "docente" // Usar el bot DocenteComedor_Bot para enviar enlaces a docentes
      );

      if (result.success) {
        console.log("✅ Mensaje enviado exitosamente");
        res.json({
          success: true,
          messageId: result.messageId,
          message: "Enlaces de asistencia enviados correctamente",
        });
      } else {
        console.error("❌ Error en sendMessageWithButtons:", result.error);
        res.status(500).json({
          success: false,
          message: result.error || "Error al enviar mensaje",
        });
      }
    } catch (error) {
      console.error("❌ Error en sendAsistencias:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Guardar el Chat ID de docentes en la BD
  static async saveDocentesChatId(req, res) {
    try {
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un chatId",
        });
      }

      const { connection } = await import("../models/db.js");

      // Verificar si ya existe el parámetro
      const [existente] = await connection.query(
        "SELECT id_parametro FROM Parametros WHERE nombreParametro = ? LIMIT 1",
        ["TELEGRAM_DOCENTES_CHAT_ID"]
      );

      if (existente && existente.length > 0) {
        // Actualizar
        await connection.query(
          "UPDATE Parametros SET valor = ?, estado = 'Activo' WHERE nombreParametro = ?",
          [String(chatId), "TELEGRAM_DOCENTES_CHAT_ID"]
        );
        console.log("✅ Chat ID de docentes actualizado:", chatId);
      } else {
        // Crear nuevo
        await connection.query(
          "INSERT INTO Parametros (nombreParametro, valor, tipoParametro, estado) VALUES (?, ?, ?, ?)",
          ["TELEGRAM_DOCENTES_CHAT_ID", String(chatId), "telegram", "Activo"]
        );
        console.log("✅ Chat ID de docentes guardado:", chatId);
      }

      res.json({
        success: true,
        message: "Chat ID de docentes guardado correctamente",
        chatId,
      });
    } catch (error) {
      console.error("❌ Error al guardar Chat ID de docentes:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Obtener el Chat ID de docentes desde la BD
  static async getDocentesChatId(req, res) {
    try {
      const { connection } = await import("../models/db.js");

      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo' LIMIT 1",
        ["TELEGRAM_DOCENTES_CHAT_ID"]
      );

      if (parametros && parametros.length > 0) {
        const chatId = parametros[0].valor;
        res.json({
          success: true,
          chatId,
          message: "Chat ID de docentes obtenido",
        });
      } else {
        res.json({
          success: false,
          chatId: null,
          message: "Chat ID de docentes no configurado",
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener Chat ID de docentes:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Guardar el Chat ID de cocinera en la BD
  static async saveCocineraparaChatId(req, res) {
    try {
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un chatId",
        });
      }

      const { connection } = await import("../models/db.js");

      // Verificar si ya existe el parámetro
      const [existente] = await connection.query(
        "SELECT id_parametro FROM Parametros WHERE nombreParametro = ? LIMIT 1",
        ["TELEGRAM_COCINERA_CHAT_ID"]
      );

      if (existente && existente.length > 0) {
        // Actualizar
        await connection.query(
          "UPDATE Parametros SET valor = ?, estado = 'Activo' WHERE nombreParametro = ?",
          [String(chatId), "TELEGRAM_COCINERA_CHAT_ID"]
        );
        console.log("✅ Chat ID de cocinera actualizado:", chatId);
      } else {
        // Crear nuevo
        await connection.query(
          "INSERT INTO Parametros (nombreParametro, valor, tipoParametro, estado) VALUES (?, ?, ?, ?)",
          ["TELEGRAM_COCINERA_CHAT_ID", String(chatId), "telegram", "Activo"]
        );
        console.log("✅ Chat ID de cocinera guardado:", chatId);
      }

      res.json({
        success: true,
        message: "Chat ID de cocinera guardado correctamente",
        chatId,
      });
    } catch (error) {
      console.error("❌ Error al guardar Chat ID de cocinera:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Obtener el Chat ID de cocinera desde la BD
  static async getCocineraparaChatId(req, res) {
    try {
      const { connection } = await import("../models/db.js");

      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo' LIMIT 1",
        ["TELEGRAM_COCINERA_CHAT_ID"]
      );

      if (parametros && parametros.length > 0) {
        const chatId = parametros[0].valor;
        res.json({
          success: true,
          chatId,
          message: "Chat ID de cocinera obtenido",
        });
      } else {
        res.json({
          success: false,
          chatId: null,
          message: "Chat ID de cocinera no configurado",
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener Chat ID de cocinera:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Guardar Chat ID para un proveedor específico en la BD
  static async saveProveedorChatId(req, res) {
    try {
      let { proveedorId, chatId, telegramUsuario } = req.body;

      console.log("📥 Datos recibidos:", {
        proveedorId,
        chatId,
        telegramUsuario,
      });
      console.log(
        "📥 Tipo de proveedorId:",
        typeof proveedorId,
        "Es Buffer:",
        Buffer.isBuffer(proveedorId)
      );

      if (!proveedorId || !chatId) {
        return res.status(400).json({
          success: false,
          message: "Se requieren proveedorId y chatId",
        });
      }

      const { connection } = await import("../models/db.js");

      // Convertir a string si viene en otro formato
      if (typeof proveedorId === "object" && proveedorId !== null) {
        // Si es un objeto Buffer o similar, extraer la propiedad necesaria o convertir
        if (proveedorId.type === "Buffer" && Array.isArray(proveedorId.data)) {
          // Reconstruir UUID desde el array de bytes
          proveedorId = Buffer.from(proveedorId.data).toString("hex");
          // Formatear como UUID (8-4-4-4-12)
          proveedorId = [
            proveedorId.slice(0, 8),
            proveedorId.slice(8, 12),
            proveedorId.slice(12, 16),
            proveedorId.slice(16, 20),
            proveedorId.slice(20, 32),
          ].join("-");
        } else if (Buffer.isBuffer(proveedorId)) {
          proveedorId = proveedorId.toString("hex");
          proveedorId = [
            proveedorId.slice(0, 8),
            proveedorId.slice(8, 12),
            proveedorId.slice(12, 16),
            proveedorId.slice(16, 20),
            proveedorId.slice(20, 32),
          ].join("-");
        }
      }

      console.log("✅ proveedorId después de conversión:", proveedorId);

      // Insertar o actualizar la configuración de Telegram del proveedor
      const [result] = await connection.query(
        `INSERT INTO ProveedorConfiguracionTelegram (id_proveedor, telegramChatId, telegramUsuario, notificacionesTelegram)
         VALUES (UUID_TO_BIN(?), ?, ?, 'Activo')
         ON DUPLICATE KEY UPDATE
         telegramChatId = VALUES(telegramChatId),
         telegramUsuario = VALUES(telegramUsuario),
         notificacionesTelegram = VALUES(notificacionesTelegram)`,
        [proveedorId, String(chatId), telegramUsuario || ""]
      );

      console.log(
        `✅ Chat ID de proveedor ${proveedorId} actualizado:`,
        chatId
      );
      res.json({
        success: true,
        message: "Chat ID del proveedor guardado correctamente",
        proveedorId,
        chatId,
      });
    } catch (error) {
      console.error("❌ Error al guardar Chat ID del proveedor:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Obtener Chat ID de un proveedor específico
  static async getProveedorChatId(req, res) {
    try {
      const { proveedorId } = req.query;

      if (!proveedorId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere proveedorId",
        });
      }

      const { connection } = await import("../models/db.js");

      const [resultado] = await connection.query(
        `SELECT p.id_proveedor, p.razonSocial, p.email, p.telefono,
                ct.telegramChatId, ct.telegramUsuario, ct.notificacionesTelegram
         FROM Proveedores p
         LEFT JOIN ProveedorConfiguracionTelegram ct ON p.id_proveedor = ct.id_proveedor
         WHERE p.id_proveedor = ? LIMIT 1`,
        [proveedorId]
      );

      if (resultado && resultado.length > 0) {
        const p = resultado[0];
        res.json({
          success: true,
          proveedorId: p.id_proveedor,
          razonSocial: p.razonSocial,
          email: p.email,
          telefono: p.telefono,
          chatId: p.telegramChatId,
          telegramUsuario: p.telegramUsuario,
          notificacionesActivas: p.notificacionesTelegram === "Activo",
          message: "Chat ID del proveedor obtenido",
        });
      } else {
        res.json({
          success: false,
          chatId: null,
          message: "Proveedor no encontrado",
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener Chat ID del proveedor:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Listar todos los proveedores con sus Chat IDs de Telegram
  static async listProveedoresWithChatId(req, res) {
    try {
      const { connection } = await import("../models/db.js");

      const [proveedores] = await connection.query(
        `SELECT 
          p.id_proveedor,
          p.razonSocial,
          p.mail,
          p.telefono,
          ct.telegramChatId,
          ct.telegramUsuario,
          ct.notificacionesTelegram
        FROM Proveedores p
        LEFT JOIN ProveedorConfiguracionTelegram ct ON p.id_proveedor = ct.id_proveedor
        WHERE p.estado = 'Activo'
        ORDER BY p.razonSocial ASC`
      );

      if (proveedores && proveedores.length > 0) {
        const proveedoresConTelegram = proveedores.map((p) => ({
          id: p.id_proveedor,
          nombre: p.razonSocial,
          email: p.mail,
          telefono: p.telefono,
          chatId: p.telegramChatId,
          telegramUsuario: p.telegramUsuario,
          notificacionesActivas: p.notificacionesTelegram === "Activo",
          configurado: p.telegramChatId !== null,
        }));

        res.json({
          success: true,
          total: proveedoresConTelegram.length,
          configurados: proveedoresConTelegram.filter((p) => p.configurado)
            .length,
          proveedores: proveedoresConTelegram,
          message: "Listado de proveedores obtenido",
        });
      } else {
        res.json({
          success: true,
          total: 0,
          configurados: 0,
          proveedores: [],
          message: "No hay proveedores disponibles",
        });
      }
    } catch (error) {
      console.error("❌ Error al listar proveedores con Chat ID:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Guardar Chat ID para un docente específico
  static async saveDocenteChatId(req, res) {
    try {
      const { docenteId, chatId, telegramUsuario } = req.body;

      if (!docenteId || !chatId) {
        return res.status(400).json({
          success: false,
          message: "Se requieren docenteId y chatId",
        });
      }

      const { connection } = await import("../models/db.js");

      // Insertar o actualizar la configuración de Telegram del docente
      const [result] = await connection.query(
        `INSERT INTO DocenteConfiguracionTelegram (id_docenteTitular, telegramChatId, telegramUsuario, notificacionesTelegram)
         VALUES (?, ?, ?, 'Activo')
         ON DUPLICATE KEY UPDATE
         telegramChatId = VALUES(telegramChatId),
         telegramUsuario = VALUES(telegramUsuario),
         notificacionesTelegram = VALUES(notificacionesTelegram)`,
        [docenteId, String(chatId), telegramUsuario || ""]
      );

      console.log(`✅ Chat ID del docente ${docenteId} guardado:`, chatId);
      res.json({
        success: true,
        message: "Chat ID del docente guardado correctamente",
        docenteId,
        chatId,
      });
    } catch (error) {
      console.error("❌ Error al guardar Chat ID del docente:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }

  // Listar todos los docentes con sus Chat IDs
  static async listDocentesWithChatId(req, res) {
    try {
      const { connection } = await import("../models/db.js");

      const [docentes] = await connection.query(
        `SELECT 
          dg.id_docenteTitular,
          p.nombre,
          p.apellido,
          dg.nombreGrado,
          u.mail,
          u.telefono,
          ct.telegramChatId,
          ct.telegramUsuario,
          ct.notificacionesTelegram
        FROM DocenteGrado dg
        JOIN Personas p ON dg.id_persona = p.id_persona
        LEFT JOIN Usuarios u ON p.id_persona = u.id_persona
        LEFT JOIN DocenteConfiguracionTelegram ct ON dg.id_docenteTitular = ct.id_docenteTitular
        WHERE p.nombreRol = 'Docente' AND p.estado = 'Activo'
        ORDER BY dg.nombreGrado ASC, p.apellido ASC, p.nombre ASC`
      );

      if (docentes && docentes.length > 0) {
        const docentesConTelegram = docentes.map((d) => ({
          id: d.id_docenteTitular,
          nombre: d.nombre,
          apellido: d.apellido,
          nombreGrado: d.nombreGrado,
          email: d.mail,
          telefono: d.telefono,
          chatId: d.telegramChatId,
          telegramUsuario: d.telegramUsuario,
          notificacionesActivas: d.notificacionesTelegram === "Activo",
          configurado: d.telegramChatId !== null,
        }));

        res.json({
          success: true,
          total: docentesConTelegram.length,
          configurados: docentesConTelegram.filter((d) => d.configurado).length,
          docentes: docentesConTelegram,
          message: "Listado de docentes obtenido",
        });
      } else {
        res.json({
          success: true,
          total: 0,
          configurados: 0,
          docentes: [],
          message: "No hay docentes disponibles",
        });
      }
    } catch (error) {
      console.error("❌ Error al listar docentes con Chat ID:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error interno del servidor",
      });
    }
  }
}
