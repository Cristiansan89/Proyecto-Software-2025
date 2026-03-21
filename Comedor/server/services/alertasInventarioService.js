import { InventarioModel } from "../models/inventario.js";
import { AlertaInventarioModel } from "../models/alertaInventario.js";
import telegramService from "./telegramService.js";
import { construirMensajePedidoTelegram, construirBotonesPedidoTelegram, construirBotonesAlertasInsumos } from "../utils/mensajesTelegram.js";
import { formatearFechaLocal } from "../utils/formatoFechas.js";

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

  // Verificar y enviar alertas (AGRUPADAS EN UN SOLO MENSAJE)
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

      // Filtrar por déficit real contra la planificación semanal antes de alertar
      const insumosConDeficit = await this._filtrarPorDemandaSemanal(insumosConStockBajo);

      if (insumosConDeficit.length === 0) {
        console.log("\u2705 Stock suficiente para cubrir la demanda semanal planificada. No se envían alertas.");
        return;
      }

      console.log(`📊 Insumos con déficit real respecto a la planificación: ${insumosConDeficit.length}`);

      // Validar y agrupar insumos con alertas válidas
      const insumosValidos = [];
      for (const insumo of insumosConDeficit) {
        const esAlertaValida = await this.validarAlerta(insumo);
        if (esAlertaValida) {
          insumosValidos.push(insumo);
        } else {
          console.log(
            `⚠️ Alerta inválida ignorada para: ${insumo.nombreInsumo}`
          );
        }
      }

      // Si hay insumos válidos, procesar y enviar un ÚNICO mensaje con todos
      if (insumosValidos.length > 0) {
        await this.procesarYEnviarAlertasAgrupadas(insumosValidos);
      }
    } catch (error) {
      console.error("❌ Error en verificación de alertas:", error);
    }
  }

  // Filtrar insumos por déficit real contra la demanda semanal planificada
  // Retorna solo los insumos cuyo stock no cubre la demanda de los días de servicio restantes
  async _filtrarPorDemandaSemanal(insumos) {
    try {
      const { connection } = await import("../models/db.js");
      const mapJStoEnum = { 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves' };
      const hoy = new Date();
      const diaSemanaJS = hoy.getDay();

      // Fuera del rango de servicio (vie, sáb, dom) → usar criterio de stock mínimo
      if (diaSemanaJS === 0 || diaSemanaJS === 5 || diaSemanaJS === 6) {
        return insumos;
      }

      const diasRestantes = [];
      for (let d = Math.max(diaSemanaJS, 1); d <= 4; d++) {
        diasRestantes.push(mapJStoEnum[d]);
      }

      if (diasRestantes.length === 0) return insumos;

      // Buscar planificación activa para la semana actual
      const [planificaciones] = await connection.query(
        `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion, comensalesEstimados
         FROM PlanificacionMenus
         WHERE estado = 'Activo'
           AND fechaInicio <= CURDATE()
           AND fechaFin >= CURDATE()
         ORDER BY fechaInicio DESC LIMIT 1`
      );

      if (!planificaciones || planificaciones.length === 0) {
        console.log("ℹ️ Sin planificación activa. Se usa criterio de stock mínimo para alertas.");
        return insumos; // Fallback: alertar por stock mínimo
      }

      const plan = planificaciones[0];
      const comensales = plan.comensalesEstimados || 120;
      console.log(`📋 Planificación activa: ${plan.id_planificacion} | Comensales: ${comensales} | Días restantes: [${diasRestantes.join(', ')}]`);

      const placeholders = diasRestantes.map(() => '?').join(', ');
      const [itemsReceta] = await connection.query(
        `SELECT ir.id_insumo, SUM(ir.cantidadPorPorcion) AS cantidadTotal
         FROM JornadaPlanificada jp
         JOIN RecetaJornada rj ON jp.id_jornada = rj.id_jornada
         JOIN ItemsRecetas ir ON rj.id_receta = ir.id_receta
         WHERE jp.id_planificacion = UUID_TO_BIN(?)
           AND jp.diaSemana IN (${placeholders})
           AND ir.id_insumo IS NOT NULL
         GROUP BY ir.id_insumo`,
        [plan.id_planificacion, ...diasRestantes]
      );

      const demandaMap = {};
      for (const item of itemsReceta) {
        demandaMap[item.id_insumo] = parseFloat(item.cantidadTotal) * comensales;
      }

      return insumos.filter(insumo => {
        const demanda = demandaMap[insumo.id_insumo];
        if (demanda === undefined) {
          console.log(`✅ ${insumo.nombreInsumo}: no se usa en recetas esta semana. Sin alerta.`);
          return false;
        }
        const stock = parseFloat(insumo.cantidadActual || 0);
        if (stock >= demanda) {
          console.log(`✅ ${insumo.nombreInsumo}: stock (${stock}) cubre demanda semanal (${demanda}). Sin alerta.`);
          return false;
        }
        console.log(`🔔 ${insumo.nombreInsumo}: stock (${stock}) < demanda (${demanda}). Se envía alerta.`);
        return true;
      });
    } catch (error) {
      console.error("⚠️ Error en filtro de demanda semanal, fallback a criterio de stock mínimo:", error.message);
      return insumos; // Fallback seguro: no silenciar alertas
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

  // Procesar y enviar alertas agrupadas en UN SOLO MENSAJE
  async procesarYEnviarAlertasAgrupadas(insumosValidos) {
    try {
      // Obtener alertas existentes
      const { connection } = await import("../models/db.js");
      
      // Crear/actualizar alertas para cada insumo
      for (const insumo of insumosValidos) {
        const alertasPrevias = await AlertaInventarioModel.getAlertas({
          id_insumo: insumo.id_insumo,
        });

        let alerta = alertasPrevias.find((a) => a.estado === "activa");

        if (alerta) {
          // Si existe alerta activa, no crear duplicada
          continue;
        } else {
          // Crear nueva alerta
          await AlertaInventarioModel.create({
            id_insumo: insumo.id_insumo,
            tipoAlerta: insumo.estado,
            contadorEnvios: 1,
          });
        }
      }

      // Enviar UN SOLO MENSAJE con todos los insumos
      await this.enviarAlertasAgrupadasTelegram(insumosValidos);
    } catch (error) {
      console.error(
        `❌ Error procesando alertas agrupadas:`,
        error
      );
    }
  }

  // Enviar alertas agrupadas por Telegram
  async enviarAlertasAgrupadasTelegram(insumos) {
    try {
      // VALIDACIÓN: Solo enviar de lunes a jueves
      const hoy = new Date();
      const diaSemana = hoy.getDay(); // 0=domingo, 5=viernes, 6=sábado
      
      if (diaSemana === 5 || diaSemana === 0 || diaSemana === 6) {
        const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
        console.log(`⏰ Es ${dias[diaSemana]}. No se envían alertas (solo lunes-jueves)`);
        return;
      }

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

      // Obtener URL base para el enlace
      const urlBase = process.env.FRONTEND_URL || "http://localhost:5173";
      const enlacePedidos = `${urlBase}/cocinera/alertas-insumos`;

      // Construir mensaje con enlace
      const mensaje = this.construirMensajeAlertasConEnlace(insumos, enlacePedidos);

      // Construir botones para acceso directo
      const botones = construirBotonesAlertasInsumos(enlacePedidos);

      // Enviar por Telegram usando el bot del sistema
      const resultado = await telegramService.sendMessageWithButtons(
        chatId,
        mensaje,
        botones,
        "sistema"
      );

      if (resultado.success) {
        console.log(
          `✅ Alerta agrupada enviada a Telegram - ${insumos.length} insumo(s)`
        );
      } else {
        console.error(
          `❌ Error enviando alerta agrupada por Telegram:`,
          resultado.error
        );
      }
    } catch (error) {
      console.error("❌ Error enviando alertas agrupadas:", error);
    }
  }

  // Construir mensaje con enlace (será acompañado de botones)
  construirMensajeAlertasConEnlace(insumos, enlace) {
    const tieneAgotados = insumos.some(i => i.estado === "Agotado");
    const emoji = tieneAgotados ? "🚨" : "⚠️";
    
    let mensaje = `${emoji} *ALERTA DE INSUMOS FALTANTES*\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    mensaje += `Se detectaron *${insumos.length} insumo(s)* con stock crítico.\n\n`;

    // Mostrar los insumos brevemente
    insumos.forEach((insumo, index) => {
      const estadoEmoji = insumo.estado === "Agotado" ? "🔴" : "🟡";
      mensaje += `${index + 1}. ${estadoEmoji} ${insumo.nombreInsumo}\n`;
    });

    mensaje += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `⚡ Haz clic en los botones de abajo para gestionar esta alerta.`;

    return mensaje;
  }

  // Construir mensaje agrupado de alertas
  construirMensajeAlertasAgrupadas(insumos) {
    const tieneAgotados = insumos.some(i => i.estado === "Agotado");
    const emoji = tieneAgotados ? "🚨" : "⚠️";
    
    let mensaje = `${emoji} ALERTA DE INSUMOS FALTANTES\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    mensaje += `Se detectaron ${insumos.length} insumo(s) con stock crítico:\n\n`;

    // Listar cada insumo con su información
    insumos.forEach((insumo, index) => {
      const estadoEmoji = insumo.estado === "Agotado" ? "🔴" : "🟡";
      mensaje += `${index + 1}. ${estadoEmoji} ${insumo.nombreInsumo}\n`;
      mensaje += `   📊 Stock: ${Math.round(parseFloat(insumo.cantidadActual))} ${insumo.unidadMedida}\n`;
      mensaje += `   📈 Mínimo: ${Math.round(parseFloat(insumo.nivelMinimoAlerta))} ${insumo.unidadMedida}\n`;
      mensaje += `   ⚡ Estado: ${insumo.estado}\n\n`;
    });

    mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `Acciones disponibles:\n`;
    mensaje += `• 👁️ Dar visto: Reconocer esta alerta\n`;
    mensaje += `• 📦 Realizar Pedido: Crear pedido automático a proveedores\n\n`;
    mensaje += `Selecciona una de las opciones para continuar.`;

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

  // Resolver alerta - Dar visto
  async darVisto(idsInsumos) {
    try {
      console.log(`\n👁️ === INICIANDO: Dar Visto ===`);
      console.log(`📥 Entrada: ${typeof idsInsumos} = "${idsInsumos}"`);
      
      if (!idsInsumos) {
        throw new Error("idsInsumos es requerido");
      }

      const idsArray = idsInsumos.split(",").map(id => id.trim()).filter(id => id);
      console.log(`📊 IDs a procesar: [${idsArray.join(", ")}]`);
      console.log(`📈 Total: ${idsArray.length} insumo(s)`);

      if (idsArray.length === 0) {
        throw new Error("No hay IDs válidos para procesar");
      }

      let exitosos = 0;
      let errores = [];

      for (const id_insumo of idsArray) {
        try {
          console.log(`  ⏳ Procesando ID ${id_insumo}...`);
          
          // Marcar alerta como resuelta
          const resultado = await AlertaInventarioModel.actualizarEstado({
            id_insumo,
            estado: "resuelta",
          });

          console.log(`  ✅ Alerta #${id_insumo} marcada como resuelta`);
          exitosos++;
        } catch (idError) {
          console.error(`  ❌ Error con ID ${id_insumo}: ${idError.message}`);
          errores.push(`ID ${id_insumo}: ${idError.message}`);
        }
      }

      const mensaje = `Se marcaron ${exitosos}/${idsArray.length} alerta(s) como visto`;
      console.log(`\n✅ Resultado: ${mensaje}`);
      if (errores.length > 0) {
        console.warn(`⚠️ Errores: ${errores.join("\n")}`);
      }

      return {
        success: exitosos > 0,
        message: mensaje,
        exitosos,
        errores: errores.length > 0 ? errores : null,
      };
    } catch (error) {
      console.error(`\n❌ ERROR EN darVisto: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      return { 
        success: false, 
        error: error.message,
        message: `Error: ${error.message}`
      };
    }
  }

  // Realizar pedido automático
  async realizarPedidoAutomatico(idsInsumos, enviarConfirmacion = true, origen = 'Automático') {
    try {
      console.log(`\n📦 === INICIANDO: Realizar Pedido Automático ===`);
      console.log(`📥 Entrada: ${typeof idsInsumos} = "${idsInsumos}"`);
      
      if (!idsInsumos) {
        throw new Error("idsInsumos es requerido");
      }

      const { connection } = await import("../models/db.js");
      const { PedidoModel } = await import("../models/pedido.js");
      const { LineaPedidoModel } = await import("../models/lineapedido.js");

      const idsArray = idsInsumos.split(",").map(id => id.trim()).filter(id => id);
      console.log(`📊 IDs a procesar: [${idsArray.join(", ")}]`);

      if (idsArray.length === 0) {
        throw new Error("No hay IDs válidos para procesar");
      }

      console.log(`📦 Creando pedido automático para ${idsArray.length} insumo(s)...`);

      // Obtener información de los insumos
      let insumosInfo = [];
      for (const id_insumo of idsArray) {
        try {
          console.log(`  ⏳ Obteniendo info del insumo ID ${id_insumo}...`);
          const [insumos] = await connection.query(
            `SELECT i.id_insumo, i.nombreInsumo, COALESCE(inv.cantidadActual, 0) as cantidadActual, 
                     inv.nivelMinimoAlerta, inv.stockMaximo, BIN_TO_UUID(ip.id_proveedor) as id_proveedor
              FROM Insumos i
              LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
              LEFT JOIN ProveedorInsumo ip ON i.id_insumo = ip.id_insumo
              WHERE i.id_insumo = ?`,
            [id_insumo]
          );

          if (insumos.length > 0) {
            console.log(`  ✅ ID ${id_insumo}: ${insumos[0].nombreInsumo} (Proveedor: ${insumos[0].id_proveedor})`);
            insumosInfo.push(insumos[0]);
          } else {
            console.warn(`  ⚠️ ID ${id_insumo}: No encontrado en BD`);
          }
        } catch (queryError) {
          console.error(`  ❌ Error consultando ID ${id_insumo}: ${queryError.message}`);
        }
      }

      if (insumosInfo.length === 0) {
        throw new Error("No se encontró información de los insumos solicitados");
      }

      console.log(`\n📋 Insumos válidos encontrados: ${insumosInfo.length}`);

      // Si el origen es Automático, re-validar demanda semanal antes de crear pedidos
      if (origen === 'Automático') {
        console.log(`\n🔍 Origen Automático: validando demanda semanal...`);
        const mapJStoEnum = { 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves' };
        const hoy = new Date();
        const diaSemanaJS = hoy.getDay();
        const diasRestantes = [];
        for (let d = Math.max(diaSemanaJS, 1); d <= 4; d++) {
          diasRestantes.push(mapJStoEnum[d]);
        }

        if (diasRestantes.length > 0) {
          const [planificaciones] = await connection.query(
            `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion, comensalesEstimados
             FROM PlanificacionMenus
             WHERE estado = 'Activo'
               AND fechaInicio <= CURDATE()
               AND fechaFin >= CURDATE()
             ORDER BY fechaInicio DESC LIMIT 1`
          );

          if (planificaciones && planificaciones.length > 0) {
            const plan = planificaciones[0];
            const comensales = plan.comensalesEstimados || 120;
            const placeholders = diasRestantes.map(() => '?').join(', ');
            const [itemsReceta] = await connection.query(
              `SELECT ir.id_insumo, SUM(ir.cantidadPorPorcion) AS cantidadTotal
               FROM JornadaPlanificada jp
               JOIN RecetaJornada rj ON jp.id_jornada = rj.id_jornada
               JOIN ItemsRecetas ir ON rj.id_receta = ir.id_receta
               WHERE jp.id_planificacion = UUID_TO_BIN(?)
                 AND jp.diaSemana IN (${placeholders})
                 AND ir.id_insumo IS NOT NULL
               GROUP BY ir.id_insumo`,
              [plan.id_planificacion, ...diasRestantes]
            );

            const demandaMap = {};
            for (const item of itemsReceta) {
              demandaMap[item.id_insumo] = parseFloat(item.cantidadTotal) * comensales;
            }

            const antesCount = insumosInfo.length;
            insumosInfo = insumosInfo.filter(insumo => {
              const demanda = demandaMap[insumo.id_insumo];
              if (demanda === undefined) {
                console.log(`  ✅ ${insumo.nombreInsumo}: no se usa en recetas esta semana. Omitido.`);
                return false;
              }
              if (parseFloat(insumo.cantidadActual) >= demanda) {
                console.log(`  ✅ ${insumo.nombreInsumo}: stock (${insumo.cantidadActual}) cubre demanda semanal (${demanda}). Omitido.`);
                return false;
              }
              return true;
            });

            console.log(`📊 Post-validación demanda: ${antesCount} → ${insumosInfo.length} insumo(s) requieren pedido`);
          } else {
            console.log(`ℹ️ Sin planificación activa. Se procesan todos los insumos solicitados.`);
          }
        }

        if (insumosInfo.length === 0) {
          return {
            success: true,
            message: 'El stock actual cubre la demanda semanal. No se generaron pedidos.',
            pedidos: [],
          };
        }
      } else {
        console.log(`\n⚡ Origen Manual: omitiendo validación de demanda. Procesando ${insumosInfo.length} insumo(s) directamente.`);
      }

      // Agrupar por proveedor
      const pedidosPorProveedor = {};
      insumosInfo.forEach((insumo) => {
        if (insumo.id_proveedor) {
          if (!pedidosPorProveedor[insumo.id_proveedor]) {
            pedidosPorProveedor[insumo.id_proveedor] = [];
          }
          pedidosPorProveedor[insumo.id_proveedor].push(insumo);
        } else {
          console.warn(`⚠️ ${insumo.nombreInsumo} no tiene proveedor asignado`);
        }
      });

      console.log(`\n🏪 Proveedores identificados: ${Object.keys(pedidosPorProveedor).length}`);

      // Crear pedidos para cada proveedor
      const pedidosCreados = [];
      for (const [id_proveedor, insumos] of Object.entries(pedidosPorProveedor)) {
        try {
          console.log(`\n  🏭 Creando pedido para proveedor ${id_proveedor} (${insumos.length} insumo(s))...`);
          
          // Crear pedido
          const origenDB = origen === 'Manual' ? 'Manual' : 'Generado';
          const nuevoPedido = await PedidoModel.create({
            input: {
              id_usuario: null, // Sistema automático
              id_estadoPedido: 2, // Aprobado directamente
              id_proveedor,
              origen: origenDB,
              fechaAprobacion: new Date().toISOString().split("T")[0],
            },
          });

          console.log(`     ✅ Pedido creado: ${nuevoPedido.id_pedido}`);

          // Agregar líneas de pedido
          for (const insumo of insumos) {
            const cantidadAComprar = Math.max(
              (insumo.stockMaximo || insumo.nivelMinimoAlerta * 2) - insumo.cantidadActual,
              0
            );

            console.log(`     ⏳ Agregando ${insumo.nombreInsumo} x${cantidadAComprar}...`);

            await LineaPedidoModel.create({
              input: {
                id_pedido: nuevoPedido.id_pedido,
                id_proveedor: id_proveedor,
                id_insumo: insumo.id_insumo,
                cantidadSolicitada: cantidadAComprar,
              },
            });

            console.log(`     ✅ Línea agregada`);
          }

          // Enviar enlace de confirmación por Telegram al proveedor (el email se envía después de que el proveedor confirma)
          try {
            const { PedidoModel } = await import("../models/pedido.js");
            const { connection: conn } = await import("../models/db.js");
            const token = await PedidoModel.generateTokenForProveedor({ idPedido: nuevoPedido.id_pedido, idProveedor: id_proveedor });
            const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const enlace = `${baseUrl}/proveedor/confirmacion/${token}`;

            const [configTelegram] = await conn.query(
              `SELECT telegramChatId FROM ProveedorConfiguracionTelegram WHERE id_proveedor = UUID_TO_BIN(?) AND notificacionesTelegram = 'Activo' LIMIT 1`,
              [id_proveedor]
            );
            const chatIdProveedor = configTelegram?.[0]?.telegramChatId;

            if (chatIdProveedor) {
              const fecha = formatearFechaLocal(new Date().toISOString().split("T")[0]);
              const mensaje = construirMensajePedidoTelegram({
                idPedido: nuevoPedido.id_pedido,
                fecha,
                cantidadInsumos: insumos.length,
                enlace
              });
              
              const buttons = construirBotonesPedidoTelegram(enlace);
              await telegramService.sendMessageWithButtons(chatIdProveedor, mensaje, buttons, "proveedor");
              console.log(`     ✅ Enlace de confirmación enviado por Telegram al proveedor del pedido ${nuevoPedido.id_pedido}`);
            } else {
              console.warn(`     ⚠️ El proveedor ${id_proveedor} no tiene Telegram configurado`);
            }
          } catch (tgErr) {
            console.warn(`     ⚠️ No se pudo enviar Telegram para pedido ${nuevoPedido.id_pedido}:`, tgErr.message);
          }

          pedidosCreados.push({
            id_pedido: nuevoPedido.id_pedido,
            id_proveedor,
            insumos: insumos.length,
          });

          console.log(`  ✅ Pedido completado para proveedor ${id_proveedor}`);
        } catch (pedidoError) {
          console.error(`  ❌ Error creando pedido para proveedor ${id_proveedor}: ${pedidoError.message}`);
        }
      }

      console.log(`\n✅ Pedidos creados: ${pedidosCreados.length}`);

      // Marcar alertas como resueltas
      console.log(`\n👁️ Marcando alertas como resueltas...`);
      await this.darVisto(idsInsumos);

      // Enviar mensaje de confirmación solo si se indica
      if (enviarConfirmacion) {
        console.log(`📢 Enviando confirmación por Telegram...`);
        await this.enviarConfirmacionPedidos(pedidosCreados);
      } else {
        console.log(`⏭️ Confirmación de Telegram desactivada`);
      }

      const mensaje = `Se crearon ${pedidosCreados.length} pedido(s) automático(s)`;
      console.log(`\n✅ COMPLETADO: ${mensaje}\n`);

      return {
        success: true,
        message: mensaje,
        pedidos: pedidosCreados,
      };
    } catch (error) {
      console.error(`\n❌ ERROR EN realizarPedidoAutomatico: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      return { 
        success: false, 
        error: error.message,
        message: `Error: ${error.message}`
      };
    }
  }

  // Enviar confirmación de pedidos creados
  async enviarConfirmacionPedidos(pedidos) {
    try {
      if (pedidos.length === 0) return;

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

      let mensaje = `✅ PEDIDOS ENVIADOS A PROVEEDORES\n`;
      mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      mensaje += `Se crearon ${pedidos.length} pedido(s) automático(s):\n\n`;

      pedidos.forEach((pedido, index) => {
        mensaje += `${index + 1}. Pedido: ${pedido.id_pedido.substring(0, 8)}...\n`;
        mensaje += `   Insumos: ${pedido.insumos}\n\n`;
      });

      mensaje += `✅ Pedidos enviados exitosamente`;

      const resultado = await telegramService.sendMessage(
        chatId,
        mensaje,
        "sistema"
      );

      if (resultado.success) {
        console.log(`✅ Confirmación de pedidos enviada a Telegram`);
      }
    } catch (error) {
      console.error("❌ Error enviando confirmación de pedidos:", error);
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
