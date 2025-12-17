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

      // Recalcular estados de inventario al iniciar
      await this.recalcularEstadosInventario();

      // Limpiar alertas obsoletas
      await this.limpiarAlertasObsoletas();

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
      // Verificar si las alertas están habilitadas
      const alertasHabilitadas = await this.verificarAlertasHabilitadas();
      if (!alertasHabilitadas) {
        console.log(
          "ℹ️ Alertas deshabilitadas en configuración. Saltando verificación."
        );
        return;
      }

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

      // Diagnosticar cada insumo antes de procesar
      for (const insumo of insumosConStockBajo) {
        const esAlertaValida = await this.validarAlerta(insumo);
        if (esAlertaValida) {
          await this.procesarAlerta(insumo);
        } else {
          console.log(
            `⚠️ Alerta inválida ignorada para: ${insumo.nombreInsumo}`
          );
        }
      }
    } catch (error) {
      console.error("❌ Error en verificación de alertas:", error);
    }
  }

  // Verificar si las alertas están habilitadas en los parámetros
  async verificarAlertasHabilitadas() {
    try {
      const { connection } = await import("../models/db.js");
      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = 'ALERTAS_INVENTARIO_HABILITADAS' AND estado = 'Activo' LIMIT 1"
      );

      if (!parametros || parametros.length === 0) {
        // Si no existe el parámetro, asumir que está habilitado por defecto
        return true;
      }

      const valor = parametros[0].valor;
      return valor === "true" || valor === "1" || valor === 1 || valor === true;
    } catch (error) {
      console.error("Error verificando si alertas están habilitadas:", error);
      // En caso de error, permitir alertas por defecto
      return true;
    }
  }

  // Validar si la alerta es realmente necesaria
  async validarAlerta(insumo) {
    try {
      const cantidadActual = parseInt(insumo.cantidadActual || 0);
      const nivelMinimo = parseInt(insumo.nivelMinimoAlerta || 0);

      // Log para diagnóstico
      console.log(`🔍 Validando alerta para ${insumo.nombreInsumo}:`);
      console.log(`   Stock actual: ${cantidadActual}`);
      console.log(`   Nivel mínimo: ${nivelMinimo}`);
      console.log(`   Estado actual: ${insumo.estado}`);

      // Si el stock actual es mayor que el nivel mínimo, la alerta no es válida
      if (cantidadActual > nivelMinimo && nivelMinimo > 0) {
        console.log(
          `   ❌ Alerta inválida: Stock (${cantidadActual}) > Mínimo (${nivelMinimo})`
        );

        // Actualizar estado a Normal si es necesario
        await InventarioModel.updateEstadoByNiveles({
          id_insumo: insumo.id_insumo,
        });
        return false;
      }

      // Si el nivel mínimo es 0 pero hay stock, no alertar
      if (nivelMinimo === 0 && cantidadActual > 0) {
        console.log(
          `   ❌ Alerta inválida: Nivel mínimo no configurado pero hay stock`
        );
        return false;
      }

      console.log(`   ✅ Alerta válida`);
      return true;
    } catch (error) {
      console.error(
        `Error validando alerta para ${insumo.nombreInsumo}:`,
        error
      );
      return false;
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
          console.log(
            `⚠️ Límite de alertas alcanzado para: ${insumo.nombreInsumo} (${alerta.contador_envios}/3)`
          );
          return;
        }

        // Incrementar contador y enviar
        const nuevoContador = alerta.contador_envios + 1;
        await this.enviarAlerta(insumo, nuevoContador);

        // Actualizar contador en la BD
        await AlertaInventarioModel.actualizarContador({
          id_insumo: insumo.id_insumo,
          contador_envios: nuevoContador,
        });
      } else {
        // Crear nueva alerta y enviar
        await AlertaInventarioModel.create({
          id_insumo: insumo.id_insumo,
          tipo_alerta: insumo.estado,
          contador_envios: 1,
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
      // Obtener Chat ID de la cocinera desde la BD
      const { connection } = await import("../models/db.js");
      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo'",
        ["TELEGRAM_COCINERA_CHAT_ID"]
      );

      let chatId =
        parametros?.[0]?.valor || process.env.TELEGRAM_COCINERA_CHAT_ID;

      if (!chatId) {
        console.warn("⚠️ TELEGRAM_COCINERA_CHAT_ID no configurado");
        return;
      }

      // Obtener parámetro de Telegram habilitado
      const [telegramparam] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = 'TELEGRAM_HABILITADO' AND estado = 'Activo' LIMIT 1"
      );

      const telegramHabilitado =
        !telegramparam ||
        telegramparam[0]?.valor === "true" ||
        telegramparam[0]?.valor === "1";
      if (!telegramHabilitado) {
        console.log(
          "ℹ️ Telegram deshabilitado en configuración. Alerta no enviada."
        );
        return;
      }

      // Construir mensaje
      const mensaje = this.construirMensajeAlerta(insumo, numeroEnvio);

      // Crear botones de confirmación
      const opciones = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Confirmado - He recibido la alerta",
                callback_data: `confirmado_${insumo.id_insumo}_${numeroEnvio}`,
              },
            ],
          ],
        },
      };

      // Enviar por Telegram usando el bot del sistema
      const resultado = await telegramService.sendMessage(
        chatId,
        mensaje,
        "sistema",
        opciones
      );

      if (resultado.success) {
        console.log(
          `✅ Alerta enviada a Telegram - ${insumo.nombreInsumo} (Envío ${numeroEnvio}/3)`
        );
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

    let mensaje = `${emoji} ALERTA DE INVENTARIO\n\n`;
    mensaje += `Estado: ${estadoTexto}\n`;
    mensaje += `Insumo: ${insumo.nombreInsumo}\n`;
    mensaje += `Categoría: ${insumo.categoria || "No especificada"}\n`;
    mensaje += `Stock Actual: ${Math.round(
      parseFloat(insumo.cantidadActual)
    )} ${insumo.unidadMedida}\n`;
    mensaje += `Nivel Mínimo: ${Math.round(
      parseFloat(insumo.nivelMinimoAlerta)
    )} ${insumo.unidadMedida}\n\n`;

    // Mostrar el contador de notificaciones de forma clara
    const barra = this.crearBarra(numeroEnvio, 3);
    mensaje += `📊 Notificación: ${numeroEnvio}/3\n`;
    mensaje += `${barra}\n\n`;

    mensaje += `🔔 Acciones sugeridas:\n`;
    mensaje += `• Revisa el inventario del sistema\n`;
    mensaje += `• Verifica los proveedores disponibles\n`;
    mensaje += `• Realiza un pedido manual si es necesario\n\n`;

    mensaje += `📋 Por favor, haz clic en el botón de confirmación\n`;
    mensaje += `para indicar que has recibido esta alerta.\n\n`;

    mensaje += `⏰ Si no confirmas, recibirás más notificaciones\n`;
    mensaje += `hasta ${3 - numeroEnvio} vez(ces) más.`;

    return mensaje;
  }

  // Crear barra de progreso visual
  crearBarra(actual, total) {
    const lleno = "🟦".repeat(actual);
    const vacio = "⬜".repeat(total - actual);
    return `[${lleno}${vacio}]`;
  }

  // Método para recalcular todos los estados de inventario
  async recalcularEstadosInventario() {
    try {
      console.log("🔄 Recalculando estados de inventario...");

      // Obtener todos los inventarios
      const inventarios = await InventarioModel.getAll();

      let actualizados = 0;
      for (const inventario of inventarios) {
        const cantidadActual = parseInt(inventario.cantidadActual || 0);
        const nivelMinimo = parseInt(inventario.nivelMinimoAlerta || 0);

        let nuevoEstado = "Normal";
        if (cantidadActual <= 0) {
          nuevoEstado = "Agotado";
        } else if (nivelMinimo > 0 && cantidadActual <= nivelMinimo) {
          nuevoEstado = "Critico";
        }

        if (inventario.estado !== nuevoEstado) {
          await InventarioModel.updateEstadoByNiveles({
            id_insumo: inventario.id_insumo,
          });
          actualizados++;
          console.log(
            `   📝 ${inventario.nombreInsumo}: ${inventario.estado} → ${nuevoEstado}`
          );
        }
      }

      console.log(
        `✅ Recálculo completado. Estados actualizados: ${actualizados}`
      );
      return { actualizados };
    } catch (error) {
      console.error("❌ Error recalculando estados:", error);
      throw error;
    }
  }

  // Método para limpiar alertas obsoletas
  async limpiarAlertasObsoletas() {
    try {
      console.log("🧹 Limpiando alertas obsoletas...");

      // Marcar como completadas las alertas de insumos que ya no están en estado crítico
      await AlertaInventarioModel.marcarCompletadasSiNoEsCritico();

      console.log("✅ Alertas obsoletas limpiadas");
    } catch (error) {
      console.error("❌ Error limpiando alertas:", error);
    }
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
