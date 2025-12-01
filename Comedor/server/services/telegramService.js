import TelegramBot from "node-telegram-bot-api";

class TelegramService {
  constructor() {
    this.bot = null;
    this.isReady = false;
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID; // Tu chat ID personal o del grupo
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return { success: true, message: "Telegram ya está inicializado" };
      }

      if (!this.botToken) {
        console.warn(
          "⚠️ TELEGRAM_BOT_TOKEN no encontrado en variables de entorno"
        );
        return {
          success: false,
          message: "Token de bot de Telegram no configurado",
        };
      }

      // Crear instancia del bot
      this.bot = new TelegramBot(this.botToken, { polling: false });

      // Verificar que el bot funciona
      const botInfo = await this.bot.getMe();
      console.log("✅ Bot de Telegram conectado:", botInfo.username);

      this.isReady = true;
      this.isInitialized = true;

      // Configurar comandos básicos
      this.setupCommands();

      return {
        success: true,
        message: "Bot de Telegram inicializado correctamente",
        botInfo: {
          username: botInfo.username,
          firstName: botInfo.first_name,
          id: botInfo.id,
        },
      };
    } catch (error) {
      console.error("❌ Error al inicializar Telegram:", error);
      this.isReady = false;
      return {
        success: false,
        message: "Error al conectar con Telegram: " + error.message,
      };
    }
  }

  setupCommands() {
    // Configurar comandos básicos del bot
    if (!this.bot) return;

    // Comando /start
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        "🏫 ¡Hola! Soy el bot del Comedor Escolar.\n\n" +
          "📋 Puedo ayudarte con:\n" +
          "• Recibir enlaces de asistencias\n" +
          "• Notificaciones del sistema\n\n" +
          "📧 Para más información, contacta con el administrador."
      );
    });

    // Comando /chatid para obtener el ID del chat
    this.bot.onText(/\/chatid/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        `📱 Tu Chat ID es: \`${chatId}\`\n\n` +
          "Proporciona este ID al administrador para recibir notificaciones.",
        { parse_mode: "Markdown" }
      );
    });

    console.log("🤖 Comandos de Telegram configurados");
  }

  async sendMessage(chatId, message, options = {}) {
    try {
      if (!this.isReady) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(initResult.message);
        }
      }

      const result = await this.bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...options,
      });

      console.log("✅ Mensaje enviado por Telegram:", result.message_id);
      return { success: true, messageId: result.message_id };
    } catch (error) {
      console.error("❌ Error enviando mensaje por Telegram:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendToMainChat(message, options = {}) {
    if (!this.chatId) {
      throw new Error("TELEGRAM_CHAT_ID no configurado");
    }
    return this.sendMessage(this.chatId, message, options);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isInitialized: this.isInitialized,
      hasToken: !!this.botToken,
      hasChatId: !!this.chatId,
      botInfo: this.isReady ? "Conectado" : "Desconectado",
    };
  }

  formatAsistenciasMessage(enlaces, fecha, mensaje = "") {
    let messageText = "🔔 *Enlaces de Asistencia*\n\n";

    if (mensaje) {
      messageText += `📝 *Mensaje:* ${mensaje}\n\n`;
    }

    messageText += `📅 *Fecha:* ${new Date(fecha).toLocaleDateString(
      "es-ES"
    )}\n`;
    messageText += `⏰ *Generado:* ${new Date().toLocaleString("es-ES")}\n\n`;

    enlaces.forEach((enlace, index) => {
      messageText += `📚 *${enlace.grado}*\n`;
      if (enlace.docente && enlace.docente.nombre) {
        messageText += `👨‍🏫 ${enlace.docente.nombre}\n`;
      }
      messageText += `🔗 ${enlace.enlace}\n\n`;
    });

    messageText += "📱 *Instrucciones:*\n";
    messageText += "• Haz clic en el enlace correspondiente a tu grado\n";
    messageText += "• Completa el registro de asistencias\n";
    messageText += "• Confirma el envío\n\n";
    messageText += "✅ ¡Gracias por tu colaboración!";

    return messageText;
  }

  formatAsistenciasButtons(enlaces) {
    // Crear botones para cada enlace
    const buttons = enlaces.map((enlace) => [
      {
        text: `📚 ${enlace.grado}${
          enlace.docente && enlace.docente.nombre
            ? ` (${enlace.docente.nombre})`
            : ""
        }`,
        url: enlace.enlace,
      },
    ]);

    return buttons;
  }

  async sendMessageWithButtons(chatId, message, buttons, options = {}) {
    try {
      if (!this.isReady) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(initResult.message);
        }
      }

      const result = await this.bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: buttons,
        },
        ...options,
      });

      console.log(
        "✅ Mensaje con botones enviado por Telegram:",
        result.message_id
      );
      return { success: true, messageId: result.message_id };
    } catch (error) {
      console.error(
        "❌ Error enviando mensaje con botones por Telegram:",
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getMainChatId() {
    return this.chatId;
  }
}

// Singleton instance
const telegramService = new TelegramService();

export default telegramService;
