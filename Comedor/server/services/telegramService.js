import TelegramBot from "node-telegram-bot-api";

class TelegramService {
  constructor() {
    this.bots = {
      sistema: null, // SistemaComedor_Bot - Notificaciones a cocinera
      docente: null, // DocenteComedor_Bot - Mensajes al docente
      proveedor: null, // Sistema_Proveedorbot - Confirmación de pedidos
    };
    this.isReady = {
      sistema: false,
      docente: false,
      proveedor: false,
    };
    this.botTokens = {
      sistema: process.env.TELEGRAM_BOT_TOKEN_SISTEMA,
      docente: process.env.TELEGRAM_BOT_TOKEN_DOCENTE,
      proveedor: process.env.TELEGRAM_BOT_TOKEN_PROVEEDOR,
    };
    this.isInitialized = {
      sistema: false,
      docente: false,
      proveedor: false,
    };

    // Inicializar automáticamente los bots después de un pequeño delay
    // para permitir que dotenv termine de cargar
    setImmediate(() => {
      this.autoInitializeDocente();
      this.autoInitializeProveedor();
    });
  }

  async autoInitializeDocente() {
    try {
      if (this.botTokens.docente) {
        await this.initialize("docente");
      }
    } catch (error) {
      console.warn(
        "⚠️ Error en inicialización automática del bot docente:",
        error.message
      );
    }
  }

  async autoInitializeProveedor() {
    try {
      if (this.botTokens.proveedor) {
        await this.initialize("proveedor");
      }
    } catch (error) {
      console.warn(
        "⚠️ Error en inicialización automática del bot proveedor:",
        error.message
      );
    }
  }

  async initialize(botType = "sistema") {
    try {
      if (this.isInitialized[botType]) {
        return {
          success: true,
          message: `Telegram ${botType} ya está inicializado`,
        };
      }

      const token = this.botTokens[botType];
      if (!token) {
        console.warn(
          `⚠️ TELEGRAM_BOT_TOKEN_${botType.toUpperCase()} no encontrado en variables de entorno`
        );
        return {
          success: false,
          message: `Token de bot ${botType} de Telegram no configurado`,
        };
      }

      // Crear instancia del bot
      this.bots[botType] = new TelegramBot(token, { polling: false });

      // Verificar que el bot funciona
      const botInfo = await this.bots[botType].getMe();
      console.log(`✅ Bot ${botType} de Telegram conectado:`, botInfo.username);

      this.isReady[botType] = true;
      this.isInitialized[botType] = true;

      // Configurar comandos básicos
      this.setupCommands(botType);

      return {
        success: true,
        message: `Bot ${botType} de Telegram inicializado correctamente`,
        botInfo: {
          username: botInfo.username,
          firstName: botInfo.first_name,
          id: botInfo.id,
          type: botType,
        },
      };
    } catch (error) {
      console.error(`❌ Error al inicializar Telegram ${botType}:`, error);
      this.isReady[botType] = false;
      return {
        success: false,
        message: `Error al conectar con Telegram ${botType}: ` + error.message,
      };
    }
  }

  setupCommands(botType = "sistema") {
    // Configurar comandos básicos del bot
    if (!this.bots[botType]) return;

    const bot = this.bots[botType];

    // Comando /start
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      let mensaje;

      if (botType === "docente") {
        mensaje =
          "🏫 ¡Hola Docente! Soy el bot para registro de asistencias del Comedor Escolar.";
      } else if (botType === "proveedor") {
        mensaje =
          "🏪 ¡Hola Proveedor! Soy el bot para confirmación de pedidos del Comedor Escolar.\n\nUsa el comando /chatid para registrar tu ID de chat.";
      } else {
        mensaje =
          "🏫 ¡Hola! Soy el bot del Comedor Escolar. Recibirás notificaciones sobre el estado de las asistencias.";
      }

      bot.sendMessage(chatId, mensaje);
    });

    // Comando /chatid para obtener el ID del chat
    bot.onText(/\/chatid/, (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from.username
        ? `@${msg.from.username}`
        : "No configurado";
      let mensaje;

      if (botType === "proveedor") {
        mensaje = `📱 Tu Chat ID es: \`${chatId}\`\n`;
        mensaje += `👤 Tu usuario: ${username}\n\n`;
        mensaje += "📋 Instrucciones:\n";
        mensaje += "1. Proporciona este Chat ID al administrador\n";
        mensaje += "2. El administrador lo registrará en el sistema\n";
        mensaje += "3. Recibirás notificaciones de pedidos automáticamente\n\n";
        mensaje +=
          "✅ Una vez registrado, podrás recibir confirmaciones de pedidos.";
      } else {
        mensaje =
          `📱 Tu Chat ID es: \`${chatId}\`\n\n` +
          "Proporciona este ID al administrador para recibir notificaciones.";
      }

      bot.sendMessage(chatId, mensaje, { parse_mode: "Markdown" });
    });

    console.log(`🤖 Comandos de Telegram ${botType} configurados`);
  }

  async sendMessage(chatId, message, botType = "sistema", options = {}) {
    try {
      if (!this.isReady[botType]) {
        const initResult = await this.initialize(botType);
        if (!initResult.success) {
          throw new Error(initResult.message);
        }
      }

      const result = await this.bots[botType].sendMessage(chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...options,
      });

      console.log(
        `✅ Mensaje enviado por Telegram ${botType}:`,
        result.message_id
      );
      return { success: true, messageId: result.message_id };
    } catch (error) {
      console.error(
        `❌ Error enviando mensaje por Telegram ${botType}:`,
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getStatus(botType = "sistema") {
    return {
      isReady: this.isReady[botType],
      isInitialized: this.isInitialized[botType],
      hasToken: !!this.botTokens[botType],
      botInfo: this.isReady[botType] ? "Conectado" : "Desconectado",
      botType,
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

  async sendMessageWithButtons(
    chatId,
    message,
    buttons,
    botType = "sistema",
    options = {}
  ) {
    try {
      if (!this.isReady[botType]) {
        const initResult = await this.initialize(botType);
        if (!initResult.success) {
          throw new Error(initResult.message);
        }
      }

      const result = await this.bots[botType].sendMessage(chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: buttons,
        },
        ...options,
      });

      console.log(
        `✅ Mensaje con botones enviado por Telegram ${botType}:`,
        result.message_id
      );
      return { success: true, messageId: result.message_id };
    } catch (error) {
      console.error(
        `❌ Error enviando mensaje con botones por Telegram ${botType}:`,
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
const telegramService = new TelegramService();

export default telegramService;
