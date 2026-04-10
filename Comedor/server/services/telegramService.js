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
      
      // Configurar manejador de callbacks (botones)
      this.setupCallbackHandlers(botType);

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

  setupCallbackHandlers(botType = "sistema") {
    // Configurar manejador de botones (callback queries)
    if (!this.bots[botType]) {
      console.warn(`⚠️ Bot ${botType} no existe`);
      return;
    }

    const bot = this.bots[botType];

    bot.on("callback_query", async (callbackQuery) => {
      const startTime = Date.now();
      const timestampLog = `[${new Date().toISOString().substr(11, 8)}]`;
      
      try {
        console.log(`\n${timestampLog} 🔔 [${botType.toUpperCase()}] ═══════════════════════════════════`);
        console.log(`${timestampLog} 🔔 CALLBACK QUERY RECIBIDO`);
        console.log(`${timestampLog}    ├─ ID Callback: ${callbackQuery.id}`);
        console.log(`${timestampLog}    ├─ Datos: "${callbackQuery.data}"`);
        console.log(`${timestampLog}    ├─ Chat ID: ${callbackQuery.message.chat.id}`);
        console.log(`${timestampLog}    ├─ Message ID: ${callbackQuery.message.message_id}`);
        console.log(`${timestampLog}    └─ Usuario: ${callbackQuery.from?.username || callbackQuery.from?.first_name || 'desconocido'}`);

        const callback_query_id = callbackQuery.id;
        const callback_data = callbackQuery.data;
        const chat_id = callbackQuery.message.chat.id;
        const message_id = callbackQuery.message.message_id;

        // ✅ PASO 1: Responder INMEDIATAMENTE a Telegram (BLOQUEANTE - con await)
        console.log(`${timestampLog} 📱 Respondiendo a Telegram (answerCallbackQuery)...`);
        try {
          await bot.answerCallbackQuery(callback_query_id, {
            text: "⏳ Procesando tu solicitud...",
            show_alert: false,
          });
          console.log(`${timestampLog} ✅ Telegram notificado - descargando botón`);
        } catch (answerError) {
          console.error(`${timestampLog} ❌ Error en answerCallbackQuery: ${answerError.message}`);
          // Continuar de todas formas
        }

        // ✅ PASO 2: Importar servicio de alertas
        console.log(`${timestampLog} 📦 Importando alertasService...`);
        const { default: alertasService } = await import("./alertasInventarioService.js");
        console.log(`${timestampLog} ✅ alertasService importado`);

        let respuesta = "";
        let exito = false;

        console.log(`${timestampLog} 📋 Analizando tipo de callback: "${callback_data}"`);

        // Parse del formato: "dar_visto|62,105,94" o "realizar_pedido|62,105,94"
        const [accion, idsInsumosStr] = callback_data.split("|");
        
        if (!idsInsumosStr) {
          throw new Error(`Formato inválido: "${callback_data}". Esperado: "accion|ids"`);
        }

        console.log(`${timestampLog} 📋 Acción: "${accion}", IDs: "${idsInsumosStr}"`);

        // ✅ PASO 3: Procesar la acción
        if (accion === "dar_visto") {
          console.log(`${timestampLog} → Tipo detectado: DAR VISTO`);
          console.log(`${timestampLog} 👁️ Llamando a alertasService.darVisto()...`);
          
          const resultado = await alertasService.darVisto(idsInsumosStr);
          console.log(`${timestampLog} 👁️ Resultado recibido:`, {
            success: resultado.success,
            message: resultado.message,
            exitosos: resultado.exitosos,
            errores: resultado.errores?.length || 0
          });

          if (resultado.success) {
            respuesta = `✅ ${resultado.message}`;
            exito = true;
          } else {
            respuesta = `❌ Error: ${resultado.error || "Error desconocido"}`;
          }
        } else if (accion === "realizar_pedido") {
          console.log(`${timestampLog} → Tipo detectado: REALIZAR PEDIDO`);
          console.log(`${timestampLog} 📦 Llamando a alertasService.realizarPedidoAutomatico()...`);
          
          const resultado = await alertasService.realizarPedidoAutomatico(idsInsumosStr);
          console.log(`${timestampLog} 📦 Resultado recibido:`, {
            success: resultado.success,
            message: resultado.message,
            pedidos: resultado.pedidos?.length || 0
          });

          if (resultado.success) {
            respuesta = `✅ ${resultado.message}`;
            exito = true;
          } else {
            respuesta = `❌ ${resultado.error || "Error creando pedido"}`;
          }
        } else {
          respuesta = `❌ Acción no reconocida: ${accion}`;
          console.warn(`${timestampLog} ⚠️ Acción desconocida: "${accion}"`);
        }

        // ✅ PASO 4: Editar el mensaje original si fue exitoso
        if (exito) {
          try {
            console.log(`${timestampLog} 📝 Editando mensaje ${message_id}...`);
            await bot.editMessageText(respuesta, {
              chat_id: chat_id,
              message_id: message_id,
              parse_mode: "Markdown",
            });
            console.log(`${timestampLog} ✅ Mensaje editado exitosamente`);
          } catch (editError) {
            console.warn(`${timestampLog} ⚠️ Error editando mensaje: ${editError.message}`);
          }
        }

        const elapsed = Date.now() - startTime;
        console.log(`${timestampLog} ✅ CALLBACK COMPLETADO (${elapsed}ms)`);
        console.log(`${timestampLog} ═══════════════════════════════════\n`);
      } catch (mainError) {
        const elapsed = Date.now() - startTime;
        console.error(`${timestampLog}\n❌ ERROR EN CALLBACK HANDLER (${elapsed}ms)\n`);
        console.error(`${timestampLog}    Mensaje: ${mainError.message}`);
        console.error(`${timestampLog}    Tipo: ${mainError.name}`);
        console.error(`${timestampLog}    Stack:`);
        console.error(mainError.stack);
        console.error(`${timestampLog}\n`);
        
        try {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: `❌ Error: ${mainError.message}`,
            show_alert: true,
          });
        } catch (errorNotify) {
          console.error(`${timestampLog} ❌ Fallo doble - error notificando error: ${errorNotify.message}`);
        }
      }
    });

    console.log(`📱 [${botType.toUpperCase()}] Manejador de callbacks configurado ✅`);
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
      // "chat not found" significa que el usuario no ha iniciado conversación con el bot
      const esChatNoEncontrado =
        error.message?.includes("chat not found") ||
        error.response?.body?.description?.includes("chat not found");

      if (esChatNoEncontrado) {
        console.warn(
          `⚠️ Telegram (${botType}): chat_id=${chatId} no encontrado. ` +
          `El usuario debe iniciar conversación con el bot primero (/start).`
        );
      } else {
        console.error(
          `❌ Error enviando mensaje por Telegram ${botType}:`,
          error.message || error
        );
      }
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

    // Parsear fecha en zona horaria local (YYYY-MM-DD -> DD/MM/YYYY)
    let fechaFormato;
    if (typeof fecha === "string" && fecha.includes("-")) {
      // Si es formato ISO (YYYY-MM-DD), convertir a DD/MM/YYYY
      const [year, month, day] = fecha.split("-");
      fechaFormato = `${day}/${month}/${year}`;
    } else {
      // Si es un Date, formatear localmente
      fechaFormato = new Date(fecha).toLocaleDateString("es-ES");
    }

    messageText += `📅 *Fecha:* ${fechaFormato}\n`;
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

  // Editar mensaje existente
  async editMessage(chatId, messageId, newText, botType = "sistema") {
    try {
      const bot = this.bots[botType];
      if (!bot) {
        throw new Error(`Bot ${botType} no inicializado`);
      }

      const result = await bot.editMessageText(newText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });

      console.log(`✅ Mensaje editado por Telegram ${botType}`);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Error editando mensaje por Telegram ${botType}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Responder a callback query (notificar al usuario)
  async answerCallbackQuery(callbackQueryId, text, showAlert = false, botType = "sistema") {
    try {
      const bot = this.bots[botType];
      if (!bot) {
        throw new Error(`Bot ${botType} no inicializado`);
      }

      const result = await bot.answerCallbackQuery(callbackQueryId, {
        text,
        show_alert: showAlert,
      });

      console.log(`✅ Respuesta a callback enviada por Telegram ${botType}`);
      return { success: true, result };
    } catch (error) {
      console.error(
        `❌ Error respondiendo a callback por Telegram ${botType}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔄 MÉTODO PRINCIPAL: Envía mensajes personalizados a múltiples destinatarios
   * 
   * Flujo:
   * 1. Filtra registros según una condición customizable
   * 2. Itera sobre cada destinatario
   * 3. Extrae chat_id único de cada registro
   * 4. Construye mensaje personalizado con datos del destinatario
   * 5. Envía mensaje individual
   * 
   * @param {Array<Object>} registros - Array de objetos con datos de destinatarios
   * @param {Function|null} filtro - Función que recibe un registro y retorna true/false
   * @param {Function} constructorMensaje - Función que recibe un registro y retorna el mensaje personalizado
   * @param {string} botType - Tipo de bot ('docente', 'proveedor', 'sistema')
   * @param {Object} options - Opciones adicionales (buttons, parse_mode, etc)
   * 
   * @returns {Object} { success, enviados, fallidos, detalles[] }
   */
  async sendPersonalizedMessages(
    registros,
    filtro = null,
    constructorMensaje,
    botType = "sistema",
    options = {}
  ) {
    const timestampLog = `[${new Date().toISOString().substr(11, 8)}]`;
    const resultados = {
      success: true,
      enviados: [],
      fallidos: [],
      filtrados: 0,
      detalles: [],
    };

    try {
      // 📋 VALIDACIONES
      if (!Array.isArray(registros) || registros.length === 0) {
        throw new Error("registros debe ser un array no vacío");
      }

      if (typeof constructorMensaje !== "function") {
        throw new Error("constructorMensaje debe ser una función");
      }

      // 🤖 INICIALIZAR BOT SI ES NECESARIO
      if (!this.isReady[botType]) {
        const initResult = await this.initialize(botType);
        if (!initResult.success) {
          throw new Error(`No se pudo inicializar bot ${botType}: ${initResult.message}`);
        }
      }

      console.log(
        `\n${timestampLog} 📨 INICIANDO ENVÍO PERSONALIZADO DE MENSAJES`
      );
      console.log(
        `${timestampLog} ├─ Total registros: ${registros.length}`
      );
      console.log(
        `${timestampLog} ├─ Tipo de bot: ${botType}`
      );
      console.log(
        `${timestampLog} ├─ Filtro aplicado: ${filtro ? "Sí" : "No"}`
      );
      console.log(
        `${timestampLog} └─ Con botones: ${options.buttons ? "Sí" : "No"}\n`
      );

      // 🔄 FILTRAR REGISTROS
      let registrosFiltrados = registros;
      if (filtro && typeof filtro === "function") {
        registrosFiltrados = registros.filter((reg) => {
          try {
            return filtro(reg);
          } catch (e) {
            console.warn(`${timestampLog} ⚠️ Error en función filtro:`, e.message);
            return false;
          }
        });
        resultados.filtrados = registros.length - registrosFiltrados.length;
        console.log(
          `${timestampLog} 🔍 FILTRADO: ${registrosFiltrados.length} de ${registros.length} registros`
        );
      }

      if (registrosFiltrados.length === 0) {
        console.log(`${timestampLog} ⚠️ No hay registros que cumplan el filtro`);
        return {
          ...resultados,
          success: true,
          message: "No hay registros para enviar",
        };
      }

      // 📤 ITERAR Y ENVIAR A CADA DESTINATARIO
      for (let i = 0; i < registrosFiltrados.length; i++) {
        const registro = registrosFiltrados[i];
        const chatId = registro.chat_id || registro.chatId || registro.telegramChatId;

        if (!chatId) {
          resultados.fallidos.push({
            registro,
            error: "chat_id no encontrado en el registro",
            indice: i,
          });
          console.warn(
            `${timestampLog} ⚠️ [${i + 1}/${registrosFiltrados.length}] chat_id faltante`
          );
          continue;
        }

        try {
          // 📝 CONSTRUIR MENSAJE PERSONALIZADO
          const mensaje = constructorMensaje(registro);

          if (!mensaje || typeof mensaje !== "string") {
            throw new Error(
              "constructorMensaje debe retornar un string (el mensaje)"
            );
          }

          // 📤 ENVIAR MENSAJE
          let result;
          if (options.buttons && typeof options.buttons === "function") {
            // Si buttons es una función, usarla para generar botones personalizados
            const botones = options.buttons(registro);
            result = await this.bots[botType].sendMessage(chatId, mensaje, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: botones,
              },
            });
          } else {
            // Envío simple sin botones
            result = await this.bots[botType].sendMessage(chatId, mensaje, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            });
          }

          // ✅ REGISTRAR ÉXITO
          resultados.enviados.push({
            chatId,
            messageId: result.message_id,
            registro,
            indice: i,
          });

          console.log(
            `${timestampLog} ✅ [${i + 1}/${registrosFiltrados.length}] Enviado a chat_id=${chatId} (msg_id=${result.message_id})`
          );
        } catch (error) {
          // ❌ REGISTRAR ERROR
          resultados.fallidos.push({
            chatId,
            registro,
            error: error.message || String(error),
            indice: i,
          });

          const esChatNoEncontrado =
            error.message?.includes("chat not found") ||
            error.response?.body?.description?.includes("chat not found");

          const tipoError = esChatNoEncontrado
            ? "chat_id inválido o usuario no inició /start"
            : error.message;

          console.warn(
            `${timestampLog} ❌ [${i + 1}/${registrosFiltrados.length}] Error en chat_id=${chatId}: ${tipoError}`
          );
        }
      }

      console.log(
        `\n${timestampLog} 📊 RESUMEN FINAL`
      );
      console.log(
        `${timestampLog} ├─ Enviados: ${resultados.enviados.length} ✅`
      );
      console.log(
        `${timestampLog} ├─ Fallidos: ${resultados.fallidos.length} ❌`
      );
      console.log(
        `${timestampLog} └─ Filtrados: ${resultados.filtrados}\n`
      );

      resultados.success =
        resultados.fallidos.length === 0;
      resultados.message = `Enviados: ${resultados.enviados.length}, Fallidos: ${resultados.fallidos.length}`;

      return resultados;
    } catch (mainError) {
      console.error(
        `${timestampLog} ❌ ERROR CRÍTICO en sendPersonalizedMessages:`,
        mainError.message
      );
      return {
        ...resultados,
        success: false,
        error: mainError.message,
        detalles: [{ error: mainError.message }],
      };
    }
  }

  /**
   * 🎯 HELPER: Formatea un mensaje personalizado
   * Útil cuando necesitas usar la lógica de construcción en el controlador
   * 
   * @param {Object} destinatario - Objeto con datos del destinatario
   * @param {string} tipo - Tipo de mensaje ('docente', 'proveedor', 'alumno', etc)
   * @param {Object} datos - Datos específicos para el mensaje
   * 
   * @returns {string} Mensaje formateado
   */
  formatPersonalizedMessage(destinatario, tipo, datos = {}) {
    let mensaje = "";

    switch (tipo) {
      case "docente":
        // Para docentes: mostrar grado, sección y asistencias pendientes
        mensaje = `👨‍🏫 *Hola ${destinatario.nombre || "Docente"}*\n\n`;
        mensaje += `📚 *Grado/Sección:* ${datos.grado || "No especificado"}\n`;
        if (datos.asistenciasPendientes && datos.asistenciasPendientes > 0) {
          mensaje += `⏳ *Asistencias pendientes:* ${datos.asistenciasPendientes}\n`;
        }
        if (datos.mensaje) {
          mensaje += `\n📝 ${datos.mensaje}`;
        }
        mensaje += `\n\n✅ Accede al sistema para completar el registro.`;
        break;

      case "proveedor":
        // Para proveedores: mostrar pedidos pendientes y detalles
        mensaje = `🏪 *Hola ${destinatario.razonSocial || destinatario.nombre || "Proveedor"}*\n\n`;
        if (datos.pedidosPendientes && datos.pedidosPendientes > 0) {
          mensaje += `📦 *Pedidos pendientes:* ${datos.pedidosPendientes}\n`;
        }
        if (datos.insumosPendientes && datos.insumosPendientes.length > 0) {
          mensaje += `📋 *Insumos solicitados:*\n`;
          datos.insumosPendientes.forEach((insumo) => {
            mensaje += `  • ${insumo.nombre || insumo} (${insumo.cantidad || ""})  \n`;
          });
        }
        if (datos.mensaje) {
          mensaje += `\n📝 ${datos.mensaje}`;
        }
        mensaje += `\n\n⏰ *Fecha de entrega esperada:* ${datos.fechaEntrega || "A confirmar"}\n`;
        mensaje += `✅ Por favor confirma la disponibilidad.`;
        break;

      case "alumno":
        // Para alumnos: información sobre comidas del día
        mensaje = `👋 *Hola ${destinatario.nombre || "Alumno"}*\n\n`;
        mensaje += `🍽️ *Menú del día ${datos.fecha || new Date().toLocaleDateString("es-ES")}:*\n`;
        if (datos.menu && datos.menu.length > 0) {
          datos.menu.forEach((item) => {
            mensaje += `  • ${item}\n`;
          });
        }
        if (datos.mensaje) {
          mensaje += `\n📝 ${datos.mensaje}`;
        }
        break;

      default:
        // Mensaje genérico
        mensaje = `*Mensaje del Sistema*\n\n`;
        mensaje += datos.mensaje || "Notificación sin contenido";
    }

    return mensaje;
  }
}

// Singleton instance
const telegramService = new TelegramService();

export default telegramService;
