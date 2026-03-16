import { connection } from "../models/db.js";
import { ParametroSistemaModel } from "../models/parametrosistema.js";
import { PedidoModel } from "../models/pedido.js";
import telegramService from "../services/telegramService.js";
import { randomUUID } from "crypto";
import { construirMensajePedidoTelegram, construirBotonesPedidoTelegram } from "../utils/mensajesTelegram.js";
import { formatearFechaLocal, obtenerFechaActualLocal } from "../utils/formatoFechas.js";

// Convierte una cantidad entre unidades del mismo sistema (masa o volumen)
function convertirEntrUnidades(cantidad, origen, destino) {
  if (!origen || !destino) return cantidad;
  const o = origen.toLowerCase().replace(/s$/, ""); // gramos → gramo, kilogramos → kilogramo
  const d = destino.toLowerCase().replace(/s$/, "");
  if (o === d) return cantidad;
  // Masa
  if (o === "gramo" && d === "kilogramo") return cantidad / 1000;
  if (o === "kilogramo" && d === "gramo") return cantidad * 1000;
  // Volumen
  if (o === "mililitro" && d === "litro") return cantidad / 1000;
  if (o === "litro" && d === "mililitro") return cantidad * 1000;
  // Sin conversión conocida → devuelve tal cual (evita errores silenciosos)
  return cantidad;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Generar insumos semanales
export const generarInsumosSemanales = async (req, res) => {
  try {
    // Obtener la planificación activa o pendiente
    const [planificaciones] = await connection.query(
      "SELECT BIN_TO_UUID(id_planificacion) as id_planificacion, fechaInicio, fechaFin, comensalesEstimados FROM PlanificacionMenus WHERE estado IN ('Activo', 'Pendiente') ORDER BY estado = 'Activo' DESC, fechaInicio DESC LIMIT 1"
    );

    if (!planificaciones || planificaciones.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: "No hay planificación activa o pendiente",
      });
    }

    const planificacion = planificaciones[0];

    // Obtener todas las jornadas (días de la semana) con sus recetas asignadas
    const [jornadas] = await connection.query(
      `SELECT 
        BIN_TO_UUID(jp.id_jornada) as id_jornada,
        jp.diaSemana,
        BIN_TO_UUID(psr.id_receta) as id_receta,
        r.nombreReceta,
        s.nombre as nombreServicio
       FROM JornadaPlanificada jp
       LEFT JOIN RecetaJornada psr ON jp.id_jornada = psr.id_jornada
       LEFT JOIN Recetas r ON psr.id_receta = r.id_receta
       LEFT JOIN Servicios s ON jp.id_servicio = s.id_servicio
       WHERE jp.id_planificacion = UUID_TO_BIN(?)
       ORDER BY jp.diaSemana, s.nombre`,
      [planificacion.id_planificacion]
    );

    if (!jornadas || jornadas.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: "No hay jornadas configuradas en la planificación activa",
      });
    }

    // Obtener insumos agrupados
    const insumosMap = {};
    const comensales = planificacion.comensalesEstimados || 100; // Valor por defecto

    for (const jornada of jornadas) {
      if (!jornada.id_receta) {
        console.log(
          `[${new Date().toISOString()}] ⚠️ Sin receta asignada: ${
            jornada.diaSemana
          } - ${jornada.nombreServicio}`
        );
        continue; // Saltar si no hay receta
      }

      try {
        const [items] = await connection.query(
          "SELECT id_insumo, cantidadPorPorcion, unidadPorPorcion FROM ItemsRecetas WHERE id_receta = UUID_TO_BIN(?)",
          [jornada.id_receta]
        );

        for (const item of items) {
          // Validar que el item tenga un id_insumo asignado
          if (!item.id_insumo) {
            console.warn(
              `⚠️ Item de receta sin insumo asignado en la receta ${jornada.id_receta}`
            );
            continue; // Saltar este item
          }

          const key = `${item.id_insumo}`;

          if (!insumosMap[key]) {
            const [insumo] = await connection.query(
              "SELECT nombreInsumo, unidadMedida FROM Insumos WHERE id_insumo = ?",
              [item.id_insumo]
            );

            insumosMap[key] = {
              id_insumo: item.id_insumo,
              nombre: insumo[0]?.nombreInsumo || "Insumo desconocido",
              unidad: insumo[0]?.unidadMedida || item.unidadPorPorcion,
              cantidad: 0,
            };
          }

          // Acumular en la unidadMedida del insumo (convirtiendo desde unidadPorPorcion si difieren)
          const cantidadConvertida = convertirEntrUnidades(
            item.cantidadPorPorcion * comensales,
            item.unidadPorPorcion,
            insumosMap[key].unidad,
          );
          insumosMap[key].cantidad += cantidadConvertida;
        }
      } catch (itemError) {
        console.warn(
          `[${new Date().toISOString()}] ⚠️ Error procesando items de receta ${
            jornada.id_receta
          }:`,
          itemError.message
        );
        // Continuar con la siguiente jornada
      }
    }

    // Guardar resultado en tabla o log
    const insumos = Object.values(insumosMap);

    // Enriquecer con datos de Inventario: cantidadActual, stockMaximo y flag enPedido
    if (insumos.length > 0) {
      const ids = insumos.map((i) => i.id_insumo);

      const [inventarios] = await connection.query(
        `SELECT id_insumo, cantidadActual, stockMaximo
         FROM Inventarios WHERE id_insumo IN (?)`,
        [ids]
      );
      const invMap = {};
      for (const inv of inventarios) invMap[inv.id_insumo] = inv;

      // Detectar insumos que ya tienen un pedido Aprobado/Pendiente esta semana
      const [pedidosActivos] = await connection.query(
        `SELECT DISTINCT dp.id_insumo
         FROM DetallePedido dp
         JOIN Pedidos p ON dp.id_pedido = p.id_pedido
         JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
         WHERE dp.id_insumo IN (?)
           AND ep.nombreEstado IN ('Aprobado', 'Pendiente')
           AND p.fechaEmision >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
        [ids]
      );
      const enPedidoSet = new Set(pedidosActivos.map((r) => r.id_insumo));

      for (const insumo of insumos) {
        const inv = invMap[insumo.id_insumo] || {};
        insumo.cantidad_disponible = inv.cantidadActual ?? 0;
        insumo.unidad_inventario = insumo.unidad;
        insumo.stockMaximo = inv.stockMaximo ?? 0;
        insumo.enPedido = enPedidoSet.has(insumo.id_insumo);
      }
    }

    // Log de generación
    console.log(
      `[${new Date().toISOString()}] ✅ Insumos generados: ${
        insumos.length
      } productos`
    );

    res.json({
      success: true,
      mensaje: "Insumos semanales generados correctamente",
      insumos,
      planificacion: planificacion.id_planificacion,
      comensales,
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error generando insumos semanales:`,
      error
    );
    res.status(500).json({
      success: false,
      mensaje: "Error al generar insumos semanales",
      error: error.message,
      detalles:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Generar pedidos automáticos
export const generarPedidosAutomaticos = async (req, res) => {
  try {
    // ── 1. Obtener insumos de la planificación activa ──────────────────────
    const insumosResponse = await new Promise((resolve, reject) => {
      const mockReq = req;
      const mockRes = {
        json: (data) => resolve(data),
        status: (code) => ({
          json: (data) => reject(new Error(data.mensaje)),
        }),
      };
      generarInsumosSemanales(mockReq, mockRes);
    });

    if (!insumosResponse.success) {
      return res.status(400).json({ success: false, mensaje: insumosResponse.mensaje });
    }

    const insumos = insumosResponse.insumos || [];
    if (insumos.length === 0) {
      return res.json({ success: true, mensaje: "No hay insumos en la planificación activa", pedidosCreados: [], total: 0 });
    }

    // ── 2. Filtrar usando los mismos datos que muestra InsumosSemanal.jsx ──
    // "generarInsumosSemanales" ya devuelve cantidad_disponible, stockMaximo y
    // enPedido por insumo. La diferencia es exactamente la misma que muestra la
    // tabla: stockFinal = cantidadActual - demanda (ambas en unidadMedida del insumo).
    const insumosFaltantes = [];
    for (const insumo of insumos) {
      // Omitir si ya hay un pedido activo esta semana (flag del backend)
      if (insumo.enPedido) {
        console.log(`[Pedidos] Insumo "${insumo.nombre}" ya tiene pedido activo esta semana — omitido`);
        continue;
      }
      // Omitir si no tiene datos de inventario
      if (insumo.cantidad_disponible === undefined) {
        console.warn(`[Pedidos] Sin inventario para insumo ${insumo.id_insumo} ("${insumo.nombre}") — omitido`);
        continue;
      }

      // Misma fórmula que InsumosSemanal.jsx: diferencia = stock_actual - demanda_semanal
      const stockFinal = (insumo.cantidad_disponible || 0) - insumo.cantidad;
      if (stockFinal >= 0) continue; // Stock suficiente, no pedir

      console.log(`[Pedidos] "${insumo.nombre}": stock=${insumo.cantidad_disponible} demanda=${insumo.cantidad.toFixed(2)} → déficit=${stockFinal.toFixed(2)} ${insumo.unidad}`);
      insumosFaltantes.push({
        id_insumo: insumo.id_insumo,
        nombre: insumo.nombre,
        cantidadPedido: insumo.stockMaximo || insumo.cantidad, // pedir stockMaximo
        unidad: insumo.unidad,
        stockFinal,
      });
    }

    if (insumosFaltantes.length === 0) {
      return res.json({
        success: true,
        mensaje: "No hay insumos con stock insuficiente — no se generaron pedidos",
        pedidosCreados: [],
        total: 0,
      });
    }

    console.log(`[Pedidos] ${insumosFaltantes.length} insumo(s) con stock negativo detectados`);

    // ── 4. Obtener proveedores activos con calificación ordenados por prioridad ──
    const idsFaltantes = insumosFaltantes.map((i) => i.id_insumo);
    const [proveedoresConCalif] = await connection.query(
      `SELECT
        BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
        pi.id_insumo,
        pi.calificacion,
        pr.razonSocial as nombre,
        CASE pi.calificacion
          WHEN 'Excelente' THEN 1
          WHEN 'Bueno'     THEN 2
          WHEN 'Regular'   THEN 3
          WHEN 'Malo'      THEN 4
          ELSE 5
        END as prioridad
       FROM ProveedorInsumo pi
       INNER JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
       WHERE pi.estado = 'Activo' AND pi.id_insumo IN (?)
       ORDER BY pi.id_insumo ASC, prioridad ASC`,
      [idsFaltantes]
    );

    // ── 5. Seleccionar el proveedor con mejor calificación por insumo ──────
    const mejorProveedorPorInsumo = {};
    for (const prov of proveedoresConCalif) {
      if (!mejorProveedorPorInsumo[prov.id_insumo]) {
        mejorProveedorPorInsumo[prov.id_insumo] = prov;
      }
    }

    // ── 6. Agrupar insumos faltantes por proveedor seleccionado ──────────
    const pedidosPorProveedor = {};
    for (const insumo of insumosFaltantes) {
      const mejorProveedor = mejorProveedorPorInsumo[insumo.id_insumo];
      if (!mejorProveedor) {
        console.warn(`[Pedidos] Sin proveedor activo para insumo ${insumo.id_insumo} ("${insumo.nombre}")`);
        continue;
      }
      if (!pedidosPorProveedor[mejorProveedor.id_proveedor]) {
        pedidosPorProveedor[mejorProveedor.id_proveedor] = {
          id_proveedor: mejorProveedor.id_proveedor,
          nombreProveedor: mejorProveedor.nombre,
          items: [],
        };
      }
      pedidosPorProveedor[mejorProveedor.id_proveedor].items.push({
        ...insumo,
        calificacion: mejorProveedor.calificacion,
      });
    }

    const pedidos = Object.values(pedidosPorProveedor);

    // ── 7. Resolver id_estadoPedido 'Aprobado' dinámicamente ─────────────
    const [estadoAprobadoRows] = await connection.query(
      "SELECT id_estadoPedido FROM EstadoPedido WHERE nombreEstado = 'Aprobado' LIMIT 1"
    );
    if (!estadoAprobadoRows || estadoAprobadoRows.length === 0) {
      throw new Error("No se encontró el estado 'Aprobado' en la tabla EstadoPedido");
    }
    const idEstadoAprobado = estadoAprobadoRows[0].id_estadoPedido;

    // ── 8. Crear pedidos en BD con fechaAprobacion y notificar por Telegram ──
    const pedidosCreados = [];

    for (const pedido of pedidos) {
      try {
        // UUID pre-generado para evitar ambigüedad en el SELECT posterior
        const idPedido = randomUUID();
        await connection.query(
          `INSERT INTO Pedidos (id_pedido, id_usuario, id_estadoPedido, id_proveedor, fechaEmision, origen, fechaAprobacion)
           VALUES (UUID_TO_BIN(?), NULL, ?, UUID_TO_BIN(?), CURDATE(), 'Generado', CURDATE())`,
          [idPedido, idEstadoAprobado, pedido.id_proveedor]
        );

        // Insertar líneas de pedido con cantidad = stockMaximo
        for (const item of pedido.items) {
          await connection.query(
            "INSERT INTO DetallePedido (id_pedido, id_proveedor, id_insumo, cantidadSolicitada) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)",
            [idPedido, pedido.id_proveedor, item.id_insumo, item.cantidadPedido]
          );
        }

        // ── Notificar al proveedor por Telegram ──────────────────────────
        try {
          // Usar método centralizado del modelo para generar token
          const token = await PedidoModel.generateTokenForProveedor({
            idPedido,
            idProveedor: pedido.id_proveedor,
          });
          
          const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
          const enlace = `${baseUrl}/proveedor/confirmacion/${token}`;

          const [configTelegram] = await connection.query(
            `SELECT telegramChatId FROM ProveedorConfiguracionTelegram
             WHERE id_proveedor = UUID_TO_BIN(?) AND notificacionesTelegram = 'Activo' LIMIT 1`,
            [pedido.id_proveedor]
          );
          const chatIdProveedor = configTelegram?.[0]?.telegramChatId;

          if (chatIdProveedor) {
            // Usar función centralizada para construir el mensaje
            const fecha = formatearFechaLocal(obtenerFechaActualLocal());
            const cantidadInsumos = pedido.items.length;
            
            const mensajeProveedor = construirMensajePedidoTelegram({
              idPedido,
              fecha,
              cantidadInsumos,
              enlace
            });

            const buttons = construirBotonesPedidoTelegram(enlace);

            await telegramService.initialize("proveedor");
            await telegramService.sendMessageWithButtons(chatIdProveedor, mensajeProveedor, buttons, "proveedor");
            console.log(`✅ Telegram enviado al proveedor ${pedido.nombreProveedor} (${idPedido.substring(0, 8)})`);
            await delay(5000); // Evitar rate-limit de Telegram entre mensajes consecutivos
          } else {
            console.warn(`⚠️ Proveedor "${pedido.nombreProveedor}" sin Telegram configurado — pedido creado sin notificación`);
          }
        } catch (telegramErr) {
          console.warn(`⚠️ Error notificando a proveedor ${pedido.nombreProveedor}:`, telegramErr.message);
        }

        pedidosCreados.push({
          id_pedido: idPedido,
          proveedor: pedido.nombreProveedor,
          items: pedido.items.length,
        });
      } catch (error) {
        console.error(`Error creando pedido para proveedor ${pedido.id_proveedor}:`, error);
      }
    }

    // ── 9. Notificar resumen a la cocinera ─────────────────────────────────
    try {
      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo'",
        ["TELEGRAM_COCINERA_CHAT_ID"]
      );
      const chatId = parametros?.[0]?.valor || process.env.TELEGRAM_COCINERA_CHAT_ID;

      if (chatId && pedidosCreados.length > 0) {
        const [paramDia] = await connection.query(
          "SELECT valor FROM Parametros WHERE nombreParametro = 'PEDIDOS_AUTOMATICOS_DIA' LIMIT 1"
        ).catch(() => [[]]);
        const diaSiguiente = paramDia?.[0]?.valor || "viernes";

        const mensaje = construirMensajePedidosAutomaticos(pedidosCreados, diaSiguiente);
        await telegramService.initialize("sistema");
        await telegramService.sendMessage(chatId, mensaje, "sistema");
        console.log("✅ Resumen de pedidos enviado a la cocinera por Telegram");
      }
    } catch (error) {
      console.warn("⚠️ Error al enviar resumen a la cocinera:", error.message);
    }

    res.json({
      success: true,
      mensaje: "Pedidos automáticos generados correctamente",
      pedidosCreados,
      total: pedidosCreados.length,
    });
  } catch (error) {
    console.error("Error generando pedidos automáticos:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al generar pedidos automáticos",
      error: error.message,
    });
  }
};

// Obtener estado de próximas generaciones
export const obtenerEstadoGeneracion = async (req, res) => {
  try {
    const parametros = await ParametroSistemaModel.getAll();

    const estado = {
      insumosSemanales: {
        habilitado:
          parametros.find(
            (p) => p.nombreParametro === "INSUMOS_SEMANALES_HABILITADO"
          )?.valor === "true",
        dia:
          parametros.find((p) => p.nombreParametro === "INSUMOS_SEMANALES_DIA")
            ?.valor || "viernes",
        hora:
          parametros.find((p) => p.nombreParametro === "INSUMOS_SEMANALES_HORA")
            ?.valor || "08:00",
        notificacion:
          parametros.find(
            (p) => p.nombreParametro === "INSUMOS_SEMANALES_NOTIFICACION"
          )?.valor === "true",
      },
      pedidosAutomaticos: {
        habilitado:
          parametros.find(
            (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_HABILITADO"
          )?.valor === "true",
        dia:
          parametros.find(
            (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_DIA"
          )?.valor || "viernes",
        hora:
          parametros.find(
            (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_HORA"
          )?.valor || "09:00",
        notificacion:
          parametros.find(
            (p) => p.nombreParametro === "PEDIDOS_AUTOMATICOS_NOTIFICACION"
          )?.valor === "true",
      },
    };

    res.json({
      success: true,
      estado,
    });
  } catch (error) {
    console.error("Error obteniendo estado de generación:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener estado de generación",
      error: error.message,
    });
  }
};

// Finalizar planificaciones automáticamente
export const finalizarPlanificacionesAutomaticas = async (req, res) => {
  try {
    console.log("[Finalización] Verificando planificaciones para finalizar...");

    const hoy = new Date().toISOString().split("T")[0];
    // getDay(): 0=Domingo ... 5=Viernes
    const esViernes = new Date().getDay() === 5;

    // ── PASO 1: Finalizar planificaciones Activas cuya fechaFin ya venció ──
    const [planificacionesVencidas] = await connection.query(
      `SELECT
        BIN_TO_UUID(id_planificacion) as id_planificacion,
        fechaInicio,
        fechaFin,
        comensalesEstimados
       FROM PlanificacionMenus
       WHERE estado = 'Activo'
       AND DATE(fechaFin) <= ?
       ORDER BY fechaFin DESC`,
      [hoy]
    );

    let finalizadas = 0;
    const planificacionesFinalizadas = [];

    if (planificacionesVencidas && planificacionesVencidas.length > 0) {
      for (const plan of planificacionesVencidas) {
        const label = `${plan.fechaInicio} - ${plan.fechaFin}`;
        console.log(`[Finalización] Finalizando planificación: ${label}`);

        await connection.query(
          `UPDATE PlanificacionMenus SET estado = 'Finalizado' WHERE id_planificacion = UUID_TO_BIN(?)`,
          [plan.id_planificacion]
        );

        console.log(`[Finalización] ✓ Planificación finalizada: ${label}`);
        finalizadas++;
        planificacionesFinalizadas.push({ id: plan.id_planificacion, label, fechaFin: plan.fechaFin });
      }
    } else {
      console.log("[Finalización] No hay planificaciones Activas vencidas");
    }

    // ── PASO 2: Activar la siguiente planificación Pendiente si no hay una Activa vigente ──
    const [activasVigentes] = await connection.query(
      `SELECT id_planificacion FROM PlanificacionMenus
       WHERE estado = 'Activo' AND DATE(fechaFin) > ?
       LIMIT 1`,
      [hoy]
    );

    let planificacionActivada = null;

    if (!activasVigentes || activasVigentes.length === 0) {
      // No existe ninguna planificación vigente → activar la más próxima en estado Pendiente
      const [siguientes] = await connection.query(
        `SELECT
          BIN_TO_UUID(id_planificacion) as id_planificacion,
          fechaInicio,
          fechaFin,
          comensalesEstimados
         FROM PlanificacionMenus
         WHERE estado = 'Pendiente'
         ORDER BY fechaInicio ASC
         LIMIT 1`
      );

      if (siguientes && siguientes.length > 0) {
        const siguiente = siguientes[0];
        const labelSig = `${siguiente.fechaInicio} - ${siguiente.fechaFin}`;

        await connection.query(
          `UPDATE PlanificacionMenus SET estado = 'Activo' WHERE id_planificacion = UUID_TO_BIN(?)`,
          [siguiente.id_planificacion]
        );

        console.log(`[Finalización] ✓ Planificación activada para semana entrante: ${labelSig}`);
        planificacionActivada = {
          id: siguiente.id_planificacion,
          label: labelSig,
          fechaInicio: siguiente.fechaInicio,
          fechaFin: siguiente.fechaFin,
        };
      } else {
        // ── PASO 3: Sin planificación siguiente → alerta de brecha ──
        console.warn(
          "[Finalización] ⚠️ No hay planificaciones Pendientes para activar"
        );

        if (esViernes) {
          console.warn(
            "[Finalización] ⚠️ ALERTA: No hay planificación configurada para la semana entrante"
          );
          try {
            const [parametros] = await connection.query(
              "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo'",
              ["TELEGRAM_COCINERA_CHAT_ID"]
            );
            const chatId =
              parametros?.[0]?.valor || process.env.TELEGRAM_COCINERA_CHAT_ID;

            if (chatId) {
              const mensajeAlerta =
                `⚠️ *ALERTA: Falta de Planificación Semanal*\n\n` +
                `No existe ninguna planificación de menú configurada para la semana entrante.\n\n` +
                `📅 Fecha actual: ${hoy}\n\n` +
                `Por favor, cree y configure la planificación lo antes posible para que el sistema pueda generar los pedidos automáticos.`;

              await telegramService.initialize("sistema");
              await telegramService.sendMessage(chatId, mensajeAlerta, "sistema");
              console.log(
                "[Finalización] ✓ Alerta de falta de planificación enviada por Telegram"
              );
            }
          } catch (telegramError) {
            console.warn(
              "[Finalización] ⚠️ Error al enviar alerta por Telegram:",
              telegramError.message
            );
          }
        }
      }
    } else {
      console.log("[Finalización] Ya existe una planificación Activa vigente, no se activa ninguna");
    }

    return res.json({
      success: true,
      mensaje:
        finalizadas > 0
          ? `${finalizadas} planificación(es) finalizada(s) correctamente`
          : "No había planificaciones vencidas para finalizar",
      finalizadas,
      planificacionesFinalizadas,
      planificacionActivada,
    });
  } catch (error) {
    console.error("[Finalización] Error al finalizar planificaciones:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al finalizar planificaciones",
      error: error.message,
      detalles:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Obtener insumos semanales generados
export const obtenerInsumosSemanales = async (req, res) => {
  try {
    // Obtener la planificación activa o pendiente
    const [planificaciones] = await connection.query(
      "SELECT BIN_TO_UUID(id_planificacion) as id_planificacion, fechaInicio, fechaFin, comensalesEstimados FROM PlanificacionMenus WHERE estado IN ('Activo', 'Pendiente') ORDER BY estado = 'Activo' DESC, fechaInicio DESC LIMIT 1"
    );

    if (!planificaciones || planificaciones.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje:
          "No hay planificación activa o pendiente. Por favor, cree una planificación semanal primero.",
      });
    }

    const planificacion = planificaciones[0];

    // Convertir fechaInicio a Date
    const fechaInicio = new Date(planificacion.fechaInicio);

    // Función para calcular fecha de una jornada
    const calcularFechaJornada = (diaSemana) => {
      const diasMap = {
        Lunes: 0,
        Martes: 1,
        Miércoles: 2,
        Jueves: 3,
        Viernes: 4,
      };
      const offset = diasMap[diaSemana] || 0;
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + offset);
      return fecha.toISOString().split("T")[0];
    };

    // Obtener todas las jornadas (días de la semana) con sus recetas asignadas
    const [jornadas] = await connection.query(
      `SELECT 
        jp.id_jornada,
        jp.diaSemana,
        jp.id_servicio,
        psr.id_receta,
        r.nombreReceta,
        s.nombre as nombreServicio
       FROM JornadaPlanificada jp
       LEFT JOIN RecetaJornada psr ON jp.id_jornada = psr.id_jornada
       LEFT JOIN Recetas r ON psr.id_receta = r.id_receta
       LEFT JOIN Servicios s ON jp.id_servicio = s.id_servicio
       WHERE jp.id_planificacion = UUID_TO_BIN(?)
       ORDER BY jp.diaSemana, s.nombre`,
      [planificacion.id_planificacion]
    );

    if (!jornadas || jornadas.length === 0) {
      return res.json({
        success: true,
        mensaje: "No hay jornadas configuradas",
        insumos: [],
      });
    }

    // Obtener insumos agrupados
    const insumosMap = {};

    for (const jornada of jornadas) {
      if (!jornada.id_receta) continue;

      try {
        // Calcular fecha de esta jornada
        const fechaStr = calcularFechaJornada(jornada.diaSemana);

        // Obtener comensales específicos para este servicio/fecha
        let comensalesParaCalculo = 119; // valor por defecto

        // Mapeo de servicios a números de comensales típicos
        const comensalesPorServicio = {
          Desayuno: 119,
          Almuerzo: 119,
          Merienda: 109,
        };

        comensalesParaCalculo =
          comensalesPorServicio[jornada.nombreServicio] || 119;

        // console.log(
        //   `📌 ${fechaStr} - ${jornada.nombreServicio}: ${jornada.nombreReceta} (${comensalesParaCalculo} comensales específicos del servicio)`
        // );
        const [items] = await connection.query(
          "SELECT id_insumo, cantidadPorPorcion, unidadPorPorcion FROM ItemsRecetas WHERE id_receta = ?",
          [jornada.id_receta]
        );

        for (const item of items) {
          // Validar que el item tenga un id_insumo asignado
          if (!item.id_insumo) {
            console.warn(
              `⚠️ Item de receta sin insumo asignado en la receta ${jornada.id_receta}`
            );
            continue; // Saltar este item
          }

          const key = `${item.id_insumo}`;

          // Obtener insumo básico SIEMPRE (primera vez o actualización)
          if (!insumosMap[key]) {
            const [insumo] = await connection.query(
              "SELECT id_insumo, nombreInsumo, unidadMedida FROM Insumos WHERE id_insumo = ?",
              [item.id_insumo]
            );

            insumosMap[key] = {
              id_insumo: item.id_insumo,
              nombre: insumo[0]?.nombreInsumo || "Insumo desconocido",
              unidad: item.unidadPorPorcion || insumo[0]?.unidadMedida,
              cantidad: 0,
              cantidad_disponible: 0,
              unidad_inventario:
                insumo[0]?.unidadMedida || item.unidadPorPorcion,
            };
          }

          // OBTENER STOCK SIEMPRE (no solo primera vez)
          let cantidadDisponible = 0;
          // console.log(`   🔍 Buscando stock para insumo ID: ${item.id_insumo}`);

          try {
            // Primero intenta obtener con cantidadActual
            let query = `SELECT i.cantidadActual as stock 
               FROM Inventarios i 
               WHERE i.id_insumo = ? 
               LIMIT 1`;

            let [stockInventario] = await connection.query(query, [
              item.id_insumo,
            ]);

            // Si no encuentra, intenta con cantidad
            if (!stockInventario || stockInventario.length === 0) {
              // console.log(
              //   `   ⚠️ No encontrado con cantidadActual, intentando con cantidad`
              // );
              query = `SELECT i.cantidad as stock 
                 FROM Inventarios i 
                 WHERE i.id_insumo = ? 
                 LIMIT 1`;
              [stockInventario] = await connection.query(query, [
                item.id_insumo,
              ]);
            }

            if (stockInventario && stockInventario.length > 0) {
              cantidadDisponible = parseInt(stockInventario[0].stock) || 0;
              // console.log(
              //   `   ✅ Stock encontrado: ${cantidadDisponible} ${insumosMap[key].unidad_inventario}`
              // );
            } else {
              // console.log(
              //   `   ❌ No hay registros en Inventarios para insumo ${item.id_insumo}`
              // );
            }
          } catch (invError) {
            console.warn(
              `⚠️ Error obteniendo inventario para insumo ${item.id_insumo}:`,
              invError.message
            );
          }

          // Actualizar cantidad disponible en cada iteración
          insumosMap[key].cantidad_disponible = cantidadDisponible;

          // Calcular cantidad paso a paso con logs detallados
          const cantidadPorPorcion = parseInt(item.cantidadPorPorcion);
          const cantidadDia = cantidadPorPorcion * comensalesParaCalculo;
          const cantidadAnterior = insumosMap[key].cantidad;

          // console.log(`📊 Calculando insumo: ${insumosMap[key].nombre}`);
          // console.log(
          //   `   📏 Cantidad por porción: ${cantidadPorPorcion} ${insumosMap[key].unidad}`
          // );
          // console.log(`   👥 Comensales del día: ${comensalesParaCalculo}`);
          // console.log(
          //   `   🍽️ Cantidad total día: ${cantidadPorPorcion} × ${comensalesParaCalculo} = ${cantidadDia} ${insumosMap[key].unidad}`
          // );

          // Multiplicar por cantidad real de comensales de este servicio
          insumosMap[key].cantidad += cantidadDia;

          // console.log(
          //   `   📈 Cantidad acumulada semanal: ${cantidadAnterior} + ${cantidadDia} = ${insumosMap[key].cantidad} ${insumosMap[key].unidad}`
          // );
          // console.log(`   ─────────────────────────────────────`);
        }
      } catch (itemError) {
        console.warn(
          `Error procesando items de receta ${jornada.id_receta}:`,
          itemError.message
        );
      }
    }

    const insumos = Object.values(insumosMap);

    console.log(`✅ Total de insumos únicos calculados: ${insumos.length}`);

    res.json({
      success: true,
      mensaje: "Insumos semanales obtenidos correctamente",
      insumos,
      planificacion: planificacion.id_planificacion,
    });
  } catch (error) {
    console.error("Error obteniendo insumos semanales:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener insumos semanales",
      error: error.message,
      detalles:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Generar pedidos automáticos por insumos faltantes
export const generarPedidosPorInsumosFaltantes = async (req, res) => {
  // Función auxiliar para conversión de unidades (igual que en frontend)
  const obtenerMejorUnidad = (cantidad, unidadOriginal) => {
    // Normalizar la unidad de entrada
    const uNormalizada = normalizarUnidad(unidadOriginal);
    
    // Para gramos: si es >= 1000, convertir a kilogramos
    if (uNormalizada === "Gramo") {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Kilogramo", // Devolver normalizado
        };
      }
      return { cantidad, unidad: "Gramo" };
    }

    // Para mililitros: si es >= 1000, convertir a litros
    if (uNormalizada === "Mililitro") {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Litro", // Devolver normalizado
        };
      }
      return { cantidad, unidad: "Mililitro" };
    }

    return { cantidad, unidad: uNormalizada };
  };

  // Función para normalizar nombres de unidades
  const normalizarUnidad = (unidad) => {
    if (!unidad) return null;
    
    // Normalizar a minúsculas y eliminar espacios
    const normalizado = unidad.trim().toLowerCase();
    
    // Mapear todas las variantes a la forma canónica singular en mayúscula
    const mapas = {
      'gramo': 'Gramo',
      'gramos': 'Gramo',
      'kilogramo': 'Kilogramo',
      'kilogramos': 'Kilogramo',
      'kg': 'Kilogramo',
      'mililitro': 'Mililitro',
      'mililitros': 'Mililitro',
      'ml': 'Mililitro',
      'litro': 'Litro',
      'litros': 'Litro',
      'l': 'Litro',
      'unidad': 'Unidad',
      'unidades': 'Unidad',
    };

    return mapas[normalizado] || unidad; // Si no se encuentra en el mapa, retorna la original
  };

  // Función para convertir cantidad entre unidades (con normalización)
  const convertirCantidadEntre = (cantidad, unidadOrigen, unidadDestino) => {
    // Normalizar ambas unidades
    const uOrigen = normalizarUnidad(unidadOrigen);
    const uDestino = normalizarUnidad(unidadDestino);
    
    if (uOrigen === uDestino) return cantidad;

    const CONVERSIONES = {
      Gramo: { Kilogramo: 0.001, Gramo: 1, Litro: null, Mililitro: null, Unidad: null },
      Kilogramo: { Gramo: 1000, Kilogramo: 1, Litro: null, Mililitro: null, Unidad: null },
      Mililitro: { Litro: 0.001, Mililitro: 1, Gramo: null, Kilogramo: null, Unidad: null },
      Litro: { Mililitro: 1000, Litro: 1, Gramo: null, Kilogramo: null, Unidad: null },
      Unidad: { Unidad: 1 },
    };

    const conversiones = CONVERSIONES[uOrigen];
    if (!conversiones) {
      console.warn(`⚠️ Unidad desconocida para origen: ${uOrigen} (original: ${unidadOrigen})`);
      return cantidad;
    }

    const factor = conversiones[uDestino];
    if (factor === null) {
      console.warn(`⚠️ No se puede convertir entre ${uOrigen} y ${uDestino}`);
      return cantidad;
    }

    if (factor === undefined) {
      console.warn(`⚠️ No se encontró conversión para ${uOrigen} -> ${uDestino}`);
      return cantidad;
    }

    const resultado = cantidad * factor;
    console.log(`📏 Conversión: ${cantidad} ${unidadOrigen} (${uOrigen}) -> ${resultado.toFixed(2)} ${unidadDestino} (${uDestino})`);
    return resultado;
  };

  try {
    console.log(
      "\n📦 INICIANDO GENERACIÓN DE PEDIDOS POR INSUMOS FALTANTES..."
    );

    // 1. Obtener insumos semanales con cálculos
    const [planificaciones] = await connection.query(
      "SELECT BIN_TO_UUID(id_planificacion) as id_planificacion, fechaInicio, fechaFin, comensalesEstimados FROM PlanificacionMenus WHERE estado = 'Activo' LIMIT 1"
    );

    if (!planificaciones || planificaciones.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: "No hay planificación activa",
      });
    }

    const planificacion = planificaciones[0];
    const fechaInicio = new Date(planificacion.fechaInicio);

    // Función para calcular fecha de una jornada
    const calcularFechaJornada = (diaSemana) => {
      const diasMap = {
        Lunes: 0,
        Martes: 1,
        Miércoles: 2,
        Jueves: 3,
        Viernes: 4,
      };
      const offset = diasMap[diaSemana] || 0;
      const fecha = new Date(fechaInicio);
      fecha.setDate(fecha.getDate() + offset);
      return fecha.toISOString().split("T")[0];
    };

    // 2. Obtener jornadas
    const [jornadas] = await connection.query(
      `SELECT 
        jp.id_jornada,
        jp.diaSemana,
        jp.id_servicio,
        psr.id_receta,
        r.nombreReceta,
        s.nombre as nombreServicio
       FROM JornadaPlanificada jp
       LEFT JOIN RecetaJornada psr ON jp.id_jornada = psr.id_jornada
       LEFT JOIN Recetas r ON psr.id_receta = r.id_receta
       LEFT JOIN Servicios s ON jp.id_servicio = s.id_servicio
       WHERE jp.id_planificacion = UUID_TO_BIN(?)
       ORDER BY jp.diaSemana, s.nombre`,
      [planificacion.id_planificacion]
    );

    if (!jornadas || jornadas.length === 0) {
      return res.json({
        success: true,
        mensaje: "No hay jornadas configuradas",
        pedidos: [],
      });
    }

    // 3. Calcular insumos requeridos
    const insumosMap = {};

    // Obtener comensales estimados de la planificación
    const comensalesEstimados = planificacion.comensalesEstimados || 0;

    // Distribuir comensales estimados entre los 3 servicios
    // Si comensalesEstimados es 0, no se pueden calcular los insumos
    if (comensalesEstimados === 0 || comensalesEstimados === null) {
      return res.status(400).json({
        success: false,
        mensaje:
          "La planificación no tiene comensales estimados. Por favor, especifique la cantidad de comensales en la planificación.",
      });
    }

    const comensalesPorServicio = {
      Desayuno: Math.floor(comensalesEstimados / 3),
      Almuerzo: Math.floor(comensalesEstimados / 3),
      Merienda: Math.ceil(comensalesEstimados / 3), // Usar ceil para el último servicio para que sume correctamente
    };

    for (const jornada of jornadas) {
      if (!jornada.id_receta) continue;

      const comensalesParaCalculo =
        comensalesPorServicio[jornada.nombreServicio] || 119;

      const [items] = await connection.query(
        "SELECT id_insumo, cantidadPorPorcion, unidadPorPorcion FROM ItemsRecetas WHERE id_receta = ?",
        [jornada.id_receta]
      );

      for (const item of items) {
        // Validar que el item tenga un id_insumo asignado
        if (!item.id_insumo) {
          console.warn(
            `⚠️ Item de receta sin insumo asignado en la receta ${jornada.id_receta}`
          );
          continue; // Saltar este item
        }

        const key = `${item.id_insumo}`;

        if (!insumosMap[key]) {
          const [insumo] = await connection.query(
            "SELECT id_insumo, nombreInsumo, unidadMedida FROM Insumos WHERE id_insumo = ?",
            [item.id_insumo]
          );

          // Obtener stock actual e información del inventario
          let cantidadDisponible = 0;
          let stockMaximo = 0;

          const [inventario] = await connection.query(
            "SELECT cantidadActual, stockMaximo FROM Inventarios WHERE id_insumo = ? LIMIT 1",
            [item.id_insumo]
          );

          if (inventario && inventario.length > 0) {
            cantidadDisponible = parseInt(inventario[0].cantidadActual) || 0;
            stockMaximo = parseInt(inventario[0].stockMaximo) || 0;
          }

          insumosMap[key] = {
            id_insumo: item.id_insumo,
            nombre: insumo[0]?.nombreInsumo || "Insumo desconocido",
            unidad: item.unidadPorPorcion || insumo[0]?.unidadMedida,
            cantidad: 0,
            cantidad_disponible: cantidadDisponible,
            stock_maximo: stockMaximo,
            unidad_inventario: insumo[0]?.unidadMedida || item.unidadPorPorcion,
          };
        }

        // Sumar cantidad requerida
        const cantidadPorPorcion = parseInt(item.cantidadPorPorcion);
        const cantidadDia = cantidadPorPorcion * comensalesParaCalculo;
        insumosMap[key].cantidad += cantidadDia;
      }
    }

    // 4. Identificar insumos faltantes y crear pedidos
    const insumosFaltantes = [];
    const pedidosAGenerar = {};

    console.log(`\n🔍 ANÁLISIS DE INSUMOS FALTANTES:`);
    console.log(`═══════════════════════════════════════════`);

    for (const [key, insumo] of Object.entries(insumosMap)) {
      // Usar la cantidad original para los cálculos de stock y diferencias
      const cantidadNecesariaOriginal = insumo.cantidad;
      const mejorUnidad = obtenerMejorUnidad(insumo.cantidad, insumo.unidad);
      const stockDisponible = insumo.cantidad_disponible || 0;

      // Convertir stock disponible a la mejorUnidad para comparación correcta
      const stockDisponibleEnMejorUnidad = convertirCantidadEntre(
        stockDisponible,
        insumo.unidad_inventario,
        mejorUnidad.unidad
      );

      // IMPORTANTE: Comparar usando la cantidad convertida a la mejor unidad
      const diferencia = stockDisponibleEnMejorUnidad - mejorUnidad.cantidad;

      console.log(`\n📦 Insumo: ${insumo.nombre}`);
      console.log(
        `   📊 Cantidad necesaria original: ${insumo.cantidad.toFixed(2)} ${
          insumo.unidad
        }`
      );
      console.log(
        `   📊 Cantidad necesaria convertida: ${mejorUnidad.cantidad.toFixed(
          2
        )} ${mejorUnidad.unidad}`
      );
      console.log(
        `   📦 Stock actual: ${stockDisponible} ${insumo.unidad_inventario}`
      );
      console.log(
        `   📦 Stock en mejor unidad: ${stockDisponibleEnMejorUnidad.toFixed(
          2
        )} ${mejorUnidad.unidad}`
      );
      console.log(
        `   📈 Stock máximo: ${insumo.stock_maximo || "No definido"}`
      );
      console.log(
        `   🔢 Diferencia: ${diferencia.toFixed(2)} ${mejorUnidad.unidad} (${
          diferencia < 0 ? "FALTANTE" : "SUFICIENTE"
        })`
      );

      // Si hay falta de stock
      if (diferencia < 0) {
        console.log(
          `   ⚠️ ¡FALTANTE DETECTADO! Faltan ${Math.abs(diferencia).toFixed(
            2
          )} ${mejorUnidad.unidad}`
        );

        // Usar stock máximo o calcular cantidad a pedir
        let cantidadAPedir = insumo.stock_maximo || 0;
        let cantidadAPedirEnMejorUnidad = 0;
        let cantidadAPedirEnUnidadInventario = 0;

        // Si no hay stock máximo definido, pedir al menos lo que falta más un 20%
        if (!cantidadAPedir || cantidadAPedir <= 0) {
          cantidadAPedirEnMejorUnidad = Math.abs(diferencia) * 1.2; // 20% extra como buffer en mejorUnidad
          console.log(
            `   📋 Sin stock máximo, pidiendo faltante + 20%: ${cantidadAPedirEnMejorUnidad.toFixed(
              2
            )} ${mejorUnidad.unidad}`
          );
        } else {
          // Stock máximo está en unidad_inventario, convertir a mejorUnidad primero
          cantidadAPedirEnMejorUnidad = convertirCantidadEntre(
            cantidadAPedir,
            insumo.unidad_inventario,
            mejorUnidad.unidad
          );
          console.log(
            `   📋 Usando stock máximo: ${cantidadAPedir} ${
              insumo.unidad_inventario
            } = ${cantidadAPedirEnMejorUnidad.toFixed(2)} ${mejorUnidad.unidad}`
          );
        }

        // Convertir cantidadAPedir de mejorUnidad a la unidad del inventario
        cantidadAPedirEnUnidadInventario = convertirCantidadEntre(
          cantidadAPedirEnMejorUnidad,
          mejorUnidad.unidad,
          insumo.unidad_inventario
        );

        console.log(
          `   📦 Cantidad a pedir en unidad del inventario: ${cantidadAPedirEnUnidadInventario.toFixed(
            2
          )} ${insumo.unidad_inventario}`
        );

        insumosFaltantes.push({
          id_insumo: insumo.id_insumo,
          nombre: insumo.nombre,
          cantidad_necesaria: cantidadNecesariaOriginal, // Usar cantidad original para base de datos
          cantidad_original: insumo.cantidad, // Mantener original para referencia
          cantidad_actual: stockDisponible,
          diferencia: diferencia,
          stock_maximo: insumo.stock_maximo || 0,
          unidad: insumo.unidad, // Usar unidad original para base de datos
          unidad_original: insumo.unidad, // Mantener original
          cantidad_a_pedir: cantidadAPedirEnUnidadInventario,
        });

        // Obtener proveedores del insumo
        const [proveedores] = await connection.query(
          `SELECT DISTINCT BIN_TO_UUID(pi.id_proveedor) as id_proveedor, pr.razonSocial as nombre 
           FROM ProveedorInsumo pi 
           INNER JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
           WHERE pi.id_insumo = ?`,
          [insumo.id_insumo]
        );

        if (proveedores && proveedores.length > 0) {
          const idProveedor = proveedores[0].id_proveedor;
          console.log(`   🏢 Proveedor encontrado: ${proveedores[0].nombre}`);

          if (!pedidosAGenerar[idProveedor]) {
            pedidosAGenerar[idProveedor] = {
              id_proveedor: idProveedor,
              nombreProveedor: proveedores[0].nombre,
              items: [],
            };
          }

          pedidosAGenerar[idProveedor].items.push({
            id_insumo: insumo.id_insumo,
            nombreInsumo: insumo.nombre,
            cantidad_a_pedir: cantidadAPedirEnUnidadInventario,
            unidad: insumo.unidad_inventario, // Usar unidad del inventario
            stock_maximo: insumo.stock_maximo || 0,
            cantidad_actual: stockDisponible,
          });

          console.log(
            `   ✅ Item agregado al pedido para ${proveedores[0].nombre}`
          );
        } else {
          console.log(
            `   ❌ No se encontró proveedor para el insumo ${insumo.nombre}`
          );
        }
      } else {
        console.log(`   ✅ Stock suficiente`);
      }
    }

    // 5. Crear los pedidos en la base de datos
    const pedidosCreados = [];

    for (const [idProveedor, pedido] of Object.entries(pedidosAGenerar)) {
      try {
        // Obtener el ID del estado 'Pendiente'
        const [estadoPendiente] = await connection.query(
          "SELECT id_estadoPedido FROM EstadoPedido WHERE nombreEstado = 'Pendiente' LIMIT 1"
        );

        if (!estadoPendiente || estadoPendiente.length === 0) {
          console.error(
            "❌ No se encontró el estado 'Pendiente' en EstadoPedido"
          );
          continue;
        }

        const idEstadoPendiente = estadoPendiente[0].id_estadoPedido;

        // Para pedidos automáticos, no asignar usuario inicialmente (será asignado al aprobar)
        // El campo 'origen' = 'Generado' identifica que es un proceso automático del sistema

        // Crear pedido automático del sistema (sin id_planificacion que fue eliminado)
        const [result] = await connection.query(
          "INSERT INTO Pedidos (id_usuario, id_estadoPedido, id_proveedor, fechaEmision, origen) VALUES (NULL, ?, UUID_TO_BIN(?), NOW(), 'Generado')",
          [idEstadoPendiente, pedido.id_proveedor]
        );

        // Obtener el ID del pedido que acabamos de crear
        const [pedidoCreado] = await connection.query(
          "SELECT BIN_TO_UUID(id_pedido) as id_pedido_uuid, id_pedido as id_pedido_bin FROM Pedidos WHERE id_usuario IS NULL AND id_estadoPedido = ? AND id_proveedor = UUID_TO_BIN(?) AND origen = 'Generado' ORDER BY fechaEmision DESC LIMIT 1",
          [idEstadoPendiente, pedido.id_proveedor]
        );

        if (!pedidoCreado || pedidoCreado.length === 0) {
          console.error("❌ No se pudo recuperar el pedido creado");
          continue;
        }

        const idPedidoBin = pedidoCreado[0].id_pedido_bin;
        const idPedidoUuid = pedidoCreado[0].id_pedido_uuid;

        // Agregar detalles de pedido
        for (const item of pedido.items) {
          await connection.query(
            "INSERT INTO DetallePedido (id_pedido, id_proveedor, id_insumo, cantidadSolicitada) VALUES (?, UUID_TO_BIN(?), ?, ?)",
            [
              idPedidoBin,
              pedido.id_proveedor,
              item.id_insumo,
              item.cantidad_a_pedir,
            ]
          );
        }

        pedidosCreados.push({
          id_pedido: idPedidoUuid,
          proveedor: pedido.nombreProveedor,
          items: pedido.items,
          origen: "Sistema - Generación Automática",
          tipo_proceso: "automatico",
        });

        console.log(
          `✅ Pedido automático creado por el SISTEMA para ${pedido.nombreProveedor} (ID: ${idPedidoUuid})`
        );
      } catch (error) {
        console.error(
          `❌ Error creando pedido para proveedor ${pedido.nombreProveedor}:`,
          error
        );
      }
    }

    console.log(`\n📊 RESUMEN DE PEDIDOS GENERADOS:`);
    console.log(`═════════════════════════════════════════`);
    console.log(`Total de insumos faltantes: ${insumosFaltantes.length}`);
    console.log(`Total de pedidos creados: ${pedidosCreados.length}`);
    console.log(`═════════════════════════════════════════\n`);

    res.json({
      success: true,
      mensaje: "Pedidos automáticos generados por el SISTEMA correctamente",
      origen: "Sistema - Proceso Automático",
      insumosFaltantes,
      pedidosCreados,
      totalPedidos: pedidosCreados.length,
      nota: "Estos pedidos fueron generados automáticamente por el sistema para cubrir faltantes de insumos",
    });
  } catch (error) {
    console.error("Error generando pedidos por insumos faltantes:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al generar pedidos por insumos faltantes",
      error: error.message,
      detalles:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Función auxiliar para construir el mensaje de pedidos automáticos
function construirMensajePedidosAutomaticos(pedidosCreados, diaSiguiente = "viernes") {
  const diasMap = {
    lunes: "lunes", martes: "martes", miercoles: "miércoles",
    jueves: "jueves", viernes: "viernes",
  };
  const diaLabel = diasMap[diaSiguiente] || diaSiguiente;

  let mensaje = `📦 *PEDIDOS AUTOMÁTICOS GENERADOS*\n\n`;
  mensaje += `📅 *Fecha:* ${new Date().toLocaleDateString("es-ES")}\n`;
  mensaje += `⏰ *Hora:* ${new Date().toLocaleTimeString("es-ES")}\n\n`;

  mensaje += `*Resumen de Pedidos:*\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (pedidosCreados.length > 0) {
    pedidosCreados.forEach((pedido, index) => {
      mensaje += `${index + 1}\. *${pedido.proveedor}*\n`;
      mensaje += `   📋 ${pedido.items} item${pedido.items !== 1 ? "s" : ""}\n\n`;
    });
  } else {
    mensaje += `❌ No se generaron pedidos\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `📊 *Total de Pedidos:* ${pedidosCreados.length}\n\n`;

  mensaje += `ℹ️ *Información:*\n`;
  mensaje += `• Los pedidos se generaron automáticamente\n`;
  mensaje += `• Verifica el estado en el sistema\n`;
  mensaje += `• Coordina con los proveedores\n`;
  mensaje += `• Próxima generación: próximo ${diaLabel}\n\n`;

  mensaje += `✅ Sistema de generación automática activado`;

  return mensaje;
}
