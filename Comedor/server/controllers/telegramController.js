import telegramService from "../services/telegramService.js";

export class TelegramController {
  // Obtener estado del bot de Telegram
  static async getStatus(req, res) {
    try {
      const status = telegramService.getStatus();
      res.json({
        status,
        message: status.isReady
          ? "Bot de Telegram conectado"
          : "Bot de Telegram desconectado",
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
      const result = await telegramService.initialize();

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
      const { chatId, message, options } = req.body;

      if (!chatId || !message) {
        return res.status(400).json({
          success: false,
          message: "chatId y message son requeridos",
        });
      }

      const result = await telegramService.sendMessage(
        chatId,
        message,
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
        enlace: grado.token
          ? `${process.env.FRONTEND_URL}/asistencias/registro/${grado.token}`
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

      let result;
      const targetChatId = chatId || telegramService.getMainChatId();

      if (!targetChatId) {
        console.error("❌ No hay chat ID especificado");
        return res.status(400).json({
          success: false,
          message: "No hay chat ID especificado",
        });
      }

      result = await telegramService.sendMessageWithButtons(
        targetChatId,
        formattedMessage,
        buttons
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
}
