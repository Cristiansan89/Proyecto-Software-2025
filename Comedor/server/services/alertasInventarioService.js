import { InventarioModel } from "../models/inventario.js";
import { AlertaInventarioModel } from "../models/alertaInventario.js";
import telegramService from "./telegramService.js";

class AlertasInventarioService {
  constructor() {
    this.isRunning = false;
    this.intervalo = null;
    this.tiempoVerificacion = 5 * 60 * 1000; // Verificar cada 5 minutos
  }

  // Inicializar el servicio de alertas
  async inicializar() {
    try {
      console.log("🚀 Iniciando servicio de alertas de inventario...");

      // Inicializar Telegram
      const telegramInit = await telegramService.initialize();
      if (!telegramInit.success) {
        console.warn("⚠️ Telegram no está disponible para enviar alertas");
      }

      // Iniciar verificación periódica
      this.iniciarVerificacionPeriodica();

      return { success: true, message: "Servicio de alertas inicializado" };
    } catch (error) {
      console.error("❌ Error al inicializar servicio de alertas:", error);
      return { success: false, error: error.message };
    }
  }

  // Iniciar verificación periódica
  iniciarVerificacionPeriodica() {
    if (this.isRunning) {
      console.warn("⚠️ El servicio de alertas ya está en ejecución");
      return;
    }

    this.isRunning = true;
    console.log("✅ Verificación periódica de alertas iniciada");

    // Ejecutar inmediatamente
    this.verificarYEnviarAlertas();

    // Luego ejecutar cada X minutos
    this.intervalo = setInterval(() => {
      this.verificarYEnviarAlertas();
    }, this.tiempoVerificacion);
  }

  // Detener verificación periódica
  detenerVerificacion() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.isRunning = false;
      console.log("⏹️ Verificación periódica de alertas detenida");
    }
  }

  // Verificar y enviar alertas
  async verificarYEnviarAlertas() {
    try {
      // Obtener insumos con stock bajo
      const insumosConStockBajo =
        await InventarioModel.getInsumosConStockBajo();

      if (insumosConStockBajo.length === 0) {
        console.log("✅ Todos los insumos tienen stock adecuado");
        return;
      }

      console.log(
        `🔔 Se detectaron ${insumosConStockBajo.length} insumos con stock bajo`
      );

      // Procesar cada insumo
      for (const insumo of insumosConStockBajo) {
        await this.procesarAlerta(insumo);
      }
    } catch (error) {
      console.error("❌ Error en verificación de alertas:", error);
    }
  }

  // Procesar alerta individual
  async procesarAlerta(insumo) {
    try {
      // Obtener alertas previas
      const alertasPrevias = await AlertaInventarioModel.getAlertas({
        id_insumo: insumo.id_insumo,
      });

      // Si existe una alerta activa
      let alerta = alertasPrevias.find((a) => a.estado === "activa");

      if (alerta) {
        // Verificar si ya se han enviado 3 alertas
        if (alerta.contador_envios >= 3) {
          await AlertaInventarioModel.marcarComoCompletada({
            id_insumo: insumo.id_insumo,
          });
          console.log(
            `⚠️ Límite de alertas alcanzado para: ${insumo.nombreInsumo}`
          );
          return;
        }

        // Actualizar contador y enviar
        await this.enviarAlerta(insumo, alerta.contador_envios + 1);
      } else {
        // Crear nueva alerta y enviar
        await AlertaInventarioModel.create({
          id_insumo: insumo.id_insumo,
          tipo_alerta: insumo.estado,
        });
        await this.enviarAlerta(insumo, 1);
      }
    } catch (error) {
      console.error(
        `❌ Error procesando alerta para insumo ${insumo.id_insumo}:`,
        error
      );
    }
  }

  // Enviar alerta por Telegram
  async enviarAlerta(insumo, numeroEnvio) {
    try {
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!chatId) {
        console.warn("⚠️ TELEGRAM_CHAT_ID no configurado");
        return;
      }

      // Construir mensaje
      const mensaje = this.construirMensajeAlerta(insumo, numeroEnvio);

      // Enviar por Telegram
      const resultado = await telegramService.sendMessage(chatId, mensaje);

      if (resultado.success) {
        console.log(
          `✅ Alerta enviada a Telegram - ${insumo.nombreInsumo} (Envío ${numeroEnvio}/3)`
        );

        // Actualizar contador en DB
        await AlertaInventarioModel.create({
          id_insumo: insumo.id_insumo,
          tipo_alerta: insumo.estado,
          contador_envios: numeroEnvio,
        });
      } else {
        console.error(
          `❌ Error enviando alerta por Telegram:`,
          resultado.error
        );
      }
    } catch (error) {
      console.error("❌ Error enviando alerta:", error);
    }
  }

  // Construir mensaje de alerta
  construirMensajeAlerta(insumo, numeroEnvio) {
    const emoji = insumo.estado === "Agotado" ? "🚨" : "⚠️";
    const estadoTexto = insumo.estado === "Agotado" ? "AGOTADO" : "CRÍTICO";

    let mensaje = `${emoji} *ALERTA DE INVENTARIO*\n\n`;
    mensaje += `*Estado:* ${estadoTexto}\n`;
    mensaje += `*Insumo:* ${insumo.nombreInsumo}\n`;
    mensaje += `*Categoría:* ${insumo.categoria}\n`;
    mensaje += `*Stock Actual:* ${Math.round(
      parseFloat(insumo.cantidadActual)
    )} ${insumo.unidadMedida}\n`;
    mensaje += `*Nivel Mínimo:* ${Math.round(
      parseFloat(insumo.nivelMinimoAlerta)
    )} ${insumo.unidadMedida}\n`;
    mensaje += `*Notificación:* ${numeroEnvio}/3\n\n`;

    mensaje += "🔔 *Por favor:*\n";
    mensaje += "• Revisa el inventario del sistema\n";
    mensaje += "• Ingresa al sistema para confirmar lectura\n";
    mensaje += "• Coordina la solicitud del insumo\n\n";

    mensaje +=
      "⏰ Se enviarán hasta 3 notificaciones hasta que ingreses al sistema.";

    return mensaje;
  }

  // Resolver alerta cuando la cocinera ingresa
  async resolverAlertaCocineraIngresa(id_insumo) {
    try {
      await AlertaInventarioModel.marcarComoResuelta({ id_insumo });
      console.log(`✅ Alerta resuelta para insumo: ${id_insumo}`);
      return { success: true, message: "Alerta resuelta" };
    } catch (error) {
      console.error("Error al resolver alerta:", error);
      return { success: false, error: error.message };
    }
  }

  // Obtener alertas activas
  async obtenerAlertasActivas() {
    try {
      const alertas = await AlertaInventarioModel.getAlertasActivas();
      return { success: true, alertas };
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      return { success: false, error: error.message };
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas() {
    try {
      const stats = await AlertaInventarioModel.getEstadisticas();
      return { success: true, stats };
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return { success: false, error: error.message };
    }
  }

  // Cambiar tiempo de verificación (en milisegundos)
  cambiarTiempoVerificacion(tiempoMs) {
    this.tiempoVerificacion = tiempoMs;
    if (this.isRunning) {
      this.detenerVerificacion();
      this.iniciarVerificacionPeriodica();
    }
  }

  // Obtener estado del servicio
  obtenerEstado() {
    return {
      activo: this.isRunning,
      tiempoVerificacion: this.tiempoVerificacion,
      proxisoVerificacion: this.isRunning
        ? new Date(Date.now() + this.tiempoVerificacion)
        : null,
    };
  }
}

// Singleton instance
const alertasService = new AlertasInventarioService();

export default alertasService;
