import alertasService from "../services/alertasInventarioService.js";
import { AlertaInventarioModel } from "../models/alertaInventario.js";
import { InventarioModel } from "../models/inventario.js";
import UltimoPedidoAutomaticoModel from "../models/ultimoPedidoAutomatico.js";

export class AlertasInventarioController {
  // Inicializar el servicio de alertas
  static async inicializar(req, res) {
    try {
      const resultado = await alertasService.inicializar();
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al inicializar alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al inicializar el servicio de alertas",
        error: error.message,
      });
    }
  }

  // Obtener alertas activas
  static async obtenerAlertasActivas(req, res) {
    try {
      const resultado = await alertasService.obtenerAlertasActivas();
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas",
        error: error.message,
      });
    }
  }

  // Obtener estadísticas de alertas
  static async obtenerEstadisticas(req, res) {
    try {
      const resultado = await alertasService.obtenerEstadisticas();
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: error.message,
      });
    }
  }

  // Resolver alerta cuando cocinera ingresa
  static async resolverAlerta(req, res) {
    try {
      const { id_insumo } = req.params;

      if (!id_insumo) {
        return res.status(400).json({
          success: false,
          message: "id_insumo es requerido",
        });
      }

      const resultado = await alertasService.resolverAlertaCocineraIngresa(
        id_insumo
      );
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al resolver alerta:", error);
      res.status(500).json({
        success: false,
        message: "Error al resolver alerta",
        error: error.message,
      });
    }
  }

  // Obtener alertas de un insumo específico
  static async obtenerAlertas(req, res) {
    try {
      const { id_insumo } = req.params;

      if (!id_insumo) {
        return res.status(400).json({
          success: false,
          message: "id_insumo es requerido",
        });
      }

      const alertas = await AlertaInventarioModel.getAlertas({ id_insumo });
      res.json({
        success: true,
        alertas,
      });
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas",
        error: error.message,
      });
    }
  }

  // Cambiar tiempo de verificación
  static async cambiarTiempoVerificacion(req, res) {
    try {
      const { tiempoMinutos } = req.body;

      if (!tiempoMinutos || tiempoMinutos < 1) {
        return res.status(400).json({
          success: false,
          message: "tiempoMinutos debe ser mayor a 1",
        });
      }

      const tiempoMs = tiempoMinutos * 60 * 1000;
      alertasService.cambiarTiempoVerificacion(tiempoMs);

      res.json({
        success: true,
        message: `Tiempo de verificación actualizado a ${tiempoMinutos} minutos`,
        estado: alertasService.obtenerEstado(),
      });
    } catch (error) {
      console.error("Error al cambiar tiempo de verificación:", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar tiempo de verificación",
        error: error.message,
      });
    }
  }

  // Obtener estado del servicio
  static async obtenerEstado(req, res) {
    try {
      const estado = alertasService.obtenerEstado();
      res.json({
        success: true,
        estado,
      });
    } catch (error) {
      console.error("Error al obtener estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estado del servicio",
        error: error.message,
      });
    }
  }

  // Iniciar verificación manual
  static async iniciarVerificacionManual(req, res) {
    try {
      await alertasService.verificarYEnviarAlertas();
      res.json({
        success: true,
        message: "Verificación manual completada",
      });
    } catch (error) {
      console.error("Error en verificación manual:", error);
      res.status(500).json({
        success: false,
        message: "Error al realizar verificación manual",
        error: error.message,
      });
    }
  }

  // Detener el servicio de alertas
  static async detener(req, res) {
    try {
      alertasService.detenerVerificacion();
      res.json({
        success: true,
        message: "Servicio de alertas detenido",
      });
    } catch (error) {
      console.error("Error al detener servicio:", error);
      res.status(500).json({
        success: false,
        message: "Error al detener el servicio",
        error: error.message,
      });
    }
  }

  // Recalcular estados de inventario
  static async recalcularEstados(req, res) {
    try {
      const resultado = await alertasService.recalcularEstadosInventario();
      res.json({
        success: true,
        message: `Estados recalculados correctamente. ${resultado.actualizados} registros actualizados.`,
        data: resultado,
      });
    } catch (error) {
      console.error("Error al recalcular estados:", error);
      res.status(500).json({
        success: false,
        message: "Error al recalcular estados de inventario",
        error: error.message,
      });
    }
  }

  // Limpiar alertas obsoletas
  static async limpiarObsoletas(req, res) {
    try {
      await alertasService.limpiarAlertasObsoletas();
      res.json({
        success: true,
        message: "Alertas obsoletas limpiadas correctamente",
      });
    } catch (error) {
      console.error("Error al limpiar alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al limpiar alertas obsoletas",
        error: error.message,
      });
    }
  }

  // Obtener todas las alertas no vistas
  static async obtenerAlertasNoVistas(req, res) {
    try {
      const alertas = await AlertaInventarioModel.obtenerNoVistas();
      res.json(alertas);
    } catch (error) {
      console.error("Error al obtener alertas no vistas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas",
        error: error.message,
      });
    }
  }

  // Marcar alerta como vista
  static async marcarAlertaComoVista(req, res) {
    try {
      const { id_alerta } = req.params;

      if (!id_alerta) {
        return res.status(400).json({
          success: false,
          message: "id_alerta es requerido",
        });
      }

      await AlertaInventarioModel.marcarComoVisto(id_alerta);
      res.json({
        success: true,
        message: "Alerta marcada como vista",
      });
    } catch (error) {
      console.error("Error al marcar alerta como vista:", error);
      res.status(500).json({
        success: false,
        message: "Error al marcar alerta como vista",
        error: error.message,
      });
    }
  }

  // Confirmar alerta recibida por Telegram
  static async confirmarAlertaTelegram(req, res) {
    try {
      const { id_insumo, numero_envio } = req.body;

      if (!id_insumo) {
        return res.status(400).json({
          success: false,
          message: "id_insumo es requerido",
        });
      }

      // Marcar la alerta como resuelta
      await AlertaInventarioModel.marcarComoResuelta({ id_insumo });

      res.json({
        success: true,
        message: "✅ Alerta confirmada. Gracias por la confirmación.",
      });
    } catch (error) {
      console.error("Error al confirmar alerta por Telegram:", error);
      res.status(500).json({
        success: false,
        message: "Error al confirmar alerta",
        error: error.message,
      });
    }
  }

  // Manejar webhook de Telegram (para callbacks de botones)
  static async manejarWebhookTelegram(req, res) {
    try {
      const { callback_query } = req.body;

      if (!callback_query) {
        return res.status(400).json({
          success: false,
          message: "callback_query es requerido",
        });
      }

      const { data } = callback_query;
      const [, id_insumo] = data.match(/confirmado_(\d+)/) || [];

      if (!id_insumo) {
        return res.status(400).json({
          success: false,
          message: "No se pudo extraer id_insumo del callback",
        });
      }

      // Marcar la alerta como resuelta
      await AlertaInventarioModel.marcarComoResuelta({ id_insumo });

      console.log(
        `✅ Alerta confirmada por Telegram para insumo: ${id_insumo}`
      );

      res.json({
        success: true,
        message: "Alerta confirmada",
      });
    } catch (error) {
      console.error("Error al manejar webhook de Telegram:", error);
      res.status(500).json({
        success: false,
        message: "Error al procesar webhook",
        error: error.message,
      });
    }
  }

  // ========== MÉTODOS PÚBLICOS PARA PÁGINA WEB DE TELEGRAM ==========

  // Obtener insumos faltantes (sin autenticación - accesible desde Telegram)
  static async obtenerInsumosFaltantesWeb(req, res) {
    try {
      console.log("📱 Solicitud: Obtener insumos faltantes desde página web");

      const { connection } = await import("../models/db.js");

      // 1. Insumos con stock bajo (Agotado/Critico) sin pedido activo en tránsito
      const [insumosConStockBajo] = await connection.query(
        `SELECT 
            inv.id_insumo,
            ins.nombreInsumo,
            ins.unidadMedida,
            inv.cantidadActual,
            inv.nivelMinimoAlerta,
            inv.estado
          FROM Inventarios inv
          JOIN Insumos ins ON inv.id_insumo = ins.id_insumo
          WHERE inv.estado IN ('Agotado', 'Critico')
            AND inv.id_insumo NOT IN (
              SELECT dp.id_insumo
              FROM DetallePedido dp
              JOIN Pedidos p ON dp.id_pedido = p.id_pedido
              WHERE p.id_estadoPedido IN (1, 2, 3, 4, 5)
            )
          ORDER BY inv.estado DESC, ins.nombreInsumo`
      );

      if (!insumosConStockBajo || insumosConStockBajo.length === 0) {
        console.log("ℹ️ No hay insumos con stock crítico sin pedido activo");
        return res.json({
          success: true,
          message: "No hay insumos con stock crítico",
          insumos: [],
        });
      }

      // 2. Calcular demanda real: insumos necesarios para los días de servicio
      //    que quedan esta semana (hoy → jueves, solo días de servicio).
      const mapJStoEnum = { 1: 'Lunes', 2: 'Martes', 3: 'Miercoles', 4: 'Jueves' };
      const hoy = new Date();
      const diaSemanaJS = hoy.getDay(); // 0=dom … 6=sáb

      // Días de servicio restantes (lunes=1 a jueves=4)
      const diasRestantes = [];
      for (let d = Math.max(diaSemanaJS, 1); d <= 4; d++) {
        diasRestantes.push(mapJStoEnum[d]);
      }

      console.log(`📅 Día actual: ${diaSemanaJS}. Días restantes de servicio: [${diasRestantes.join(', ')}]`);

      // Mapa de demanda: id_insumo → cantidadNecesaria (para el resto de la semana)
      const demandaMap = {}; // { id_insumo: number }
      let hayPlanificacion = false;

      if (diasRestantes.length > 0) {
        // Buscar planificación activa para la semana actual
        const [planificaciones] = await connection.query(
          `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion, comensalesEstimados
           FROM PlanificacionMenus
           WHERE estado = 'Activo'
             AND fechaInicio <= CURDATE()
             AND fechaFin >= CURDATE()
           ORDER BY fechaInicio DESC
           LIMIT 1`
        );

        if (planificaciones && planificaciones.length > 0) {
          hayPlanificacion = true;
          const plan = planificaciones[0];
          console.log(`📋 Planificación activa: ${plan.id_planificacion}`);

          // CORRECCIÓN: Obtener comensales POR SERVICIO, no un total único
          const { PlanificacionMenuModel } = await import("../models/planificacionmenu.js");

          console.log(`📊 Calculando demanda por SERVICIO para ${diasRestantes.length} día(s)...`);

          // Para cada día restante
          for (const diaEnum of diasRestantes) {
            // Convertir enum a fecha
            const jsDay = Object.keys(mapJStoEnum).find(k => mapJStoEnum[k] === diaEnum);
            const fechaDia = new Date(hoy);
            fechaDia.setDate(hoy.getDate() + (parseInt(jsDay) - diaSemanaJS));

            // Obtener comensales reales por servicio para ese día
            const comensalesPorServicio = await PlanificacionMenuModel.calcularComensalesPorServicioYFecha({
              fecha: fechaDia.toISOString().split('T')[0]
            });

            console.log(`  📅 ${diaEnum} (${fechaDia.toISOString().split('T')[0]}): ${comensalesPorServicio.length} servicios`);

            // Crear mapa id_servicio → comensales para este día
            const servicioComensalesMap = {};
            comensalesPorServicio.forEach(s => {
              servicioComensalesMap[s.id_servicio] = s.totalComensales;
              console.log(`     → ${s.nombreServicio}: ${s.totalComensales} comensales`);
            });

            // Obtener items de receta para este día, agrupados por SERVICIO
            const [itemsReceta] = await connection.query(
              `SELECT ir.id_insumo, 
                      jp.id_jornada,
                      COALESCE(st.id_servicio, (SELECT id_servicio FROM Servicios WHERE estado='Activo' LIMIT 1)) as id_servicio,
                      SUM(ir.cantidadPorPorcion) AS cantidadPorServicio
               FROM JornadaPlanificada jp
               LEFT JOIN ServicioTurno st ON jp.id_turno = st.id_turno
               JOIN RecetaJornada rj ON jp.id_jornada = rj.id_jornada
               JOIN ItemsRecetas ir ON rj.id_receta = ir.id_receta
               WHERE jp.id_planificacion = UUID_TO_BIN(?)
                 AND jp.diaSemana = ?
                 AND ir.id_insumo IS NOT NULL
               GROUP BY ir.id_insumo, jp.id_jornada, id_servicio`,
              [plan.id_planificacion, diaEnum]
            );

            // Acumular demanda: cantidad_por_porcion × comensales_real_del_servicio
            for (const item of itemsReceta) {
              const comensales = servicioComensalesMap[item.id_servicio] || 0;
              const cantidadNecesaria = parseFloat(item.cantidadPorServicio || 0) * comensales;
              
              demandaMap[item.id_insumo] = (demandaMap[item.id_insumo] || 0) + cantidadNecesaria;
              
              console.log(`     💾 Insumo ${item.id_insumo}: ${item.cantidadPorServicio} × ${comensales} = ${cantidadNecesaria}`);
            }
          }

          console.log(`📊 Demanda semanal calculada para ${Object.keys(demandaMap).length} insumos`);
        } else {
          console.log("ℹ️ No hay planificación activa para la semana actual. Se usa solo criterio de stock mínimo.");
        }
      }

      // 3. Filtrar: solo mostrar insumos donde stock < demanda real (o sin planificación → criterio mínimo)
      const insumosValidos = [];
      for (const insumo of insumosConStockBajo) {
        const cantidadActual = parseFloat(insumo.cantidadActual || 0);
        const nivelMinimo = parseFloat(insumo.nivelMinimoAlerta || 0);

        if (nivelMinimo <= 0 && cantidadActual > 0) continue; // nivel mínimo no configurado

        let necesario = 0;
        let criterio = "stock_minimo";

        if (hayPlanificacion && demandaMap[insumo.id_insumo] !== undefined) {
          necesario = demandaMap[insumo.id_insumo];
          criterio = "demanda_semanal";

          // Si el stock alcanza para cubrir la demanda de la semana, NO alertar
          if (cantidadActual >= necesario) {
            console.log(`✅ ${insumo.nombreInsumo}: stock (${cantidadActual}) alcanza para la demanda semanal (${necesario}). No se alerta.`);
            continue;
          }
        } else if (hayPlanificacion && demandaMap[insumo.id_insumo] === undefined) {
          // Este insumo no aparece en ninguna receta de la semana → no es necesario esta semana
          console.log(`✅ ${insumo.nombreInsumo}: no se usa en recetas esta semana. No se alerta.`);
          continue;
        } else {
          // Sin planificación: criterio clásico de stock mínimo
          necesario = nivelMinimo;
          if (cantidadActual > nivelMinimo) continue;
        }

        insumosValidos.push({
          id_insumo: insumo.id_insumo,
          nombreInsumo: insumo.nombreInsumo,
          cantidadActual: cantidadActual,
          nivelMinimoAlerta: nivelMinimo,
          totalNecesario: necesario,
          criterio,
          unidadMedida: insumo.unidadMedida,
          estado: cantidadActual <= 0 ? "Agotado" : "Critico",
        });
      }

      console.log(`✅ ${insumosValidos.length} insumo(s) requieren pedido según demanda de alumnos por servicio`);

      res.json({
        success: true,
        message: insumosValidos.length > 0
          ? `Se encontraron ${insumosValidos.length} insumo(s) que no cubren la demanda de alumnos por servicio esta semana`
          : "El stock actual es suficiente para cubrir a los alumnos de esta semana",
        insumos: insumosValidos,
        diasRestantes,
        hayPlanificacion,
      });
    } catch (error) {
      console.error("❌ Error al obtener insumos faltantes:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener insumos",
        error: error.message,
      });
    }
  }

  // Realizar pedido automático desde página web (sin autenticación)
  static async realizarPedidoAutomaticoWeb(req, res) {
    try {
      const { idsInsumos, origen_pedido = 'Automático' } = req.body;

      console.log("📦 Solicitud: Realizar pedido automático desde página web");
      console.log(`   IDs de insumos: ${idsInsumos}`);
      console.log(`   Origen: ${origen_pedido}`);

      if (!idsInsumos) {
        return res.status(400).json({
          success: false,
          message: "idsInsumos es requerido",
        });
      }

      // VALIDACIÓN: Solo permitir de lunes a jueves
      const hoy = new Date();
      const diaSemana = hoy.getDay(); // 0=domingo, 5=viernes, 6=sábado

      if (diaSemana === 5 || diaSemana === 0 || diaSemana === 6) {
        const dias = [
          "domingo",
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
        ];
        const mensajeError = `No se pueden crear pedidos el ${dias[diaSemana]}. Solo de lunes a jueves.`;
        console.log(`⏰ ${mensajeError}`);

        return res.status(400).json({
          success: false,
          message: mensajeError,
        });
      }

      // VALIDACIÓN: Verificar que no se haya creado un pedido en los últimos 30 segundos
      const validacion = await UltimoPedidoAutomaticoModel.puedeCrearPedido();
      if (!validacion.permitido) {
        const segundosRestantes = validacion.segundosRestantes || 1;
        const mensajeError = `⏳ Debe esperar ${segundosRestantes} segundo(s) antes de crear otro pedido automático.`;
        console.log(`⏰ ${mensajeError}`);

        return res.status(429).json({
          success: false,
          message: mensajeError,
          segundosRestantes,
        });
      }

      // Usar el servicio de alertas para realizar el pedido
      // No enviar mensaje de Telegram para pedidos desde web pública
      const resultado = await alertasService.realizarPedidoAutomatico(
        idsInsumos,
        false, // No enviar confirmación por Telegram
        origen_pedido
      );

      if (resultado.success) {
        // Actualizar el registro del último pedido automático
        await UltimoPedidoAutomaticoModel.actualizarUltimoPedido();
        
        console.log(
          `✅ Pedido(s) creado(s) exitosamente: ${resultado.pedidos?.length || 0}`
        );
        
        const respuesta = {
          success: true,
          message: resultado.message,
          pedidos: resultado.pedidos,
        };
        
        console.log("📤 Respondiendo al cliente:", JSON.stringify(respuesta));
        res.json(respuesta);
      } else {
        console.error(`❌ Error creando pedido: ${resultado.error}`);
        res.status(400).json({
          success: false,
          message: resultado.error || "Error al crear pedido",
        });
      }
    } catch (error) {
      console.error("❌ Error en realizarPedidoAutomaticoWeb:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear pedido",
        error: error.message,
      });
    }
  }
}
