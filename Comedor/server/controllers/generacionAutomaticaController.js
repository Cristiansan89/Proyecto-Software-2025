import { connection } from "../models/db.js";
import { ParametroSistemaModel } from "../models/parametrosistema.js";
import telegramService from "../services/telegramService.js";

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
       LEFT JOIN PlanificacionServicioReceta psr ON jp.id_jornada = psr.id_jornada
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

          // Multiplicar por cantidad de comensales
          insumosMap[key].cantidad += item.cantidadPorPorcion * comensales;
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
    // Primero obtener insumos
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
      return res
        .status(400)
        .json({ success: false, mensaje: insumosResponse.mensaje });
    }

    const insumos = insumosResponse.insumos;

    // Obtener proveedores por insumo
    const [proveedoresInsumo] = await connection.query(
      "SELECT DISTINCT BIN_TO_UUID(pi.id_proveedor) as id_proveedor, pi.id_insumo, pr.razonSocial as nombre FROM ProveedorInsumo pi INNER JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor"
    );

    // Agrupar insumos por proveedor
    const pedidosPorProveedor = {};

    for (const insumo of insumos) {
      const proveedores = proveedoresInsumo.filter(
        (p) => p.id_insumo === insumo.id_insumo
      );

      if (proveedores.length === 0) continue;

      for (const proveedor of proveedores) {
        if (!pedidosPorProveedor[proveedor.id_proveedor]) {
          pedidosPorProveedor[proveedor.id_proveedor] = {
            id_proveedor: proveedor.id_proveedor,
            nombreProveedor: proveedor.nombre,
            items: [],
          };
        }

        pedidosPorProveedor[proveedor.id_proveedor].items.push({
          id_insumo: insumo.id_insumo,
          nombreInsumo: insumo.nombre,
          cantidad: insumo.cantidad,
          unidad: insumo.unidad,
        });
      }
    }

    const pedidos = Object.values(pedidosPorProveedor);

    // Log de pedidos generados
    console.log(`[${new Date().toISOString()}] Pedidos generados:`, pedidos);

    // Crear registros de pedidos en la base de datos
    const pedidosCreados = [];

    for (const pedido of pedidos) {
      try {
        // Generar UUID para el pedido
        const [uuidResult] = await connection.query(
          "SELECT UUID() as new_uuid"
        );
        const idPedidoUUID = uuidResult[0].new_uuid;

        const [result] = await connection.query(
          "INSERT INTO Pedidos (id_pedido, id_proveedor, id_estadoPedido, fechaEmision, id_usuario, id_planificacion) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, NOW(), ?, ?)",
          [
            idPedidoUUID,
            pedido.id_proveedor,
            idEstadoPendiente,
            idUsuarioBin,
            idPlanificacionBin,
          ]
        );

        const idPedido = idPedidoUUID;

        // Agregar líneas de pedido
        for (const item of pedido.items) {
          await connection.query(
            "INSERT INTO DetallePedido (id_pedido, id_proveedor, id_insumo, cantidadSolicitada) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)",
            [idPedido, pedido.id_proveedor, item.id_insumo, item.cantidad]
          );
        }

        pedidosCreados.push({
          id_pedido: idPedido,
          proveedor: pedido.nombreProveedor,
          items: pedido.items.length,
        });
      } catch (error) {
        console.error(
          `Error creando pedido para proveedor ${pedido.id_proveedor}:`,
          error
        );
      }
    }

    // Enviar notificación por Telegram
    try {
      const [parametros] = await connection.query(
        "SELECT valor FROM Parametros WHERE nombreParametro = ? AND estado = 'Activo'",
        ["TELEGRAM_COCINERA_CHAT_ID"]
      );

      let chatId =
        parametros?.[0]?.valor || process.env.TELEGRAM_COCINERA_CHAT_ID;

      if (chatId && pedidosCreados.length > 0) {
        const mensaje = construirMensajePedidosAutomaticos(pedidosCreados);
        await telegramService.initialize("sistema");
        await telegramService.sendMessage(chatId, mensaje, "sistema");
        console.log(
          "✅ Notificación de pedidos automáticos enviada a Telegram"
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Error al enviar notificación de pedidos por Telegram:",
        error.message
      );
      // No interrumpir el flujo principal
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

    // Obtener la fecha de hoy
    const hoy = new Date().toISOString().split("T")[0];

    // Buscar planificaciones activas cuya fecha final es hoy
    const [planificaciones] = await connection.query(
      `SELECT 
        BIN_TO_UUID(id_planificacion) as id_planificacion,
        fechaInicio,
        fechaFin,
        comensalesEstimados,
        nombre
       FROM PlanificacionMenus 
       WHERE estado = 'Activo' 
       AND DATE(fechaFin) = ?
       LIMIT 1`,
      [hoy]
    );

    if (!planificaciones || planificaciones.length === 0) {
      console.log(
        "[Finalización] No hay planificaciones activas con fecha final hoy"
      );
      return res.json({
        success: true,
        mensaje: "No hay planificaciones para finalizar",
        finalizadas: 0,
      });
    }

    const planificacion = planificaciones[0];
    console.log(
      `[Finalización] Finalizando planificación: ${planificacion.nombre}`
    );

    // Finalizar la planificación
    await connection.query(
      `UPDATE PlanificacionMenus 
       SET estado = 'Finalizado' 
       WHERE id_planificacion = UUID_TO_BIN(?)`,
      [planificacion.id_planificacion]
    );

    console.log(
      `[Finalización] ✓ Planificación finalizada: ${planificacion.nombre}`
    );

    res.json({
      success: true,
      mensaje: "Planificación finalizada correctamente",
      finalizadas: 1,
      planificacion: {
        id: planificacion.id_planificacion,
        nombre: planificacion.nombre,
        fechaFin: planificacion.fechaFin,
      },
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
       LEFT JOIN PlanificacionServicioReceta psr ON jp.id_jornada = psr.id_jornada
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
    // Para gramos: si es >= 1000, convertir a kilogramos
    if (
      unidadOriginal === "Gramo" ||
      unidadOriginal === "Gramos" ||
      unidadOriginal === "gramo" ||
      unidadOriginal === "gramos"
    ) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Kilogramos",
        };
      }
      return { cantidad, unidad: "Gramos" };
    }

    // Para mililitros: si es >= 1000, convertir a litros
    if (
      unidadOriginal === "Mililitro" ||
      unidadOriginal === "Mililitros" ||
      unidadOriginal === "mililitro" ||
      unidadOriginal === "mililitros"
    ) {
      if (cantidad >= 1000) {
        return {
          cantidad: cantidad / 1000,
          unidad: "Litros",
        };
      }
      return { cantidad, unidad: "Mililitros" };
    }

    return { cantidad, unidad: unidadOriginal };
  };

  // Función para convertir cantidad entre unidades
  const convertirCantidadEntre = (cantidad, unidadOrigen, unidadDestino) => {
    if (unidadOrigen === unidadDestino) return cantidad;

    const CONVERSIONES = {
      Gramo: { Kilogramo: 0.001, Kilogramos: 0.001, Gramo: 1, Gramos: 1 },
      Gramos: { Kilogramo: 0.001, Kilogramos: 0.001, Gramo: 1, Gramos: 1 },
      Kilogramo: { Gramo: 1000, Gramos: 1000, Kilogramo: 1, Kilogramos: 1 },
      Kilogramos: { Gramo: 1000, Gramos: 1000, Kilogramo: 1, Kilogramos: 1 },
      Mililitro: { Litro: 0.001, Litros: 0.001, Mililitro: 1, Mililitros: 1 },
      Mililitros: { Litro: 0.001, Litros: 0.001, Mililitro: 1, Mililitros: 1 },
      Litro: { Mililitro: 1000, Mililitros: 1000, Litro: 1, Litros: 1 },
      Litros: { Mililitro: 1000, Mililitros: 1000, Litro: 1, Litros: 1 },
      Unidad: { Unidad: 1, Unidades: 1 },
      Unidades: { Unidad: 1, Unidades: 1 },
    };

    const conversiones = CONVERSIONES[unidadOrigen];
    if (!conversiones || !conversiones[unidadDestino]) {
      return cantidad; // No se puede convertir
    }

    return cantidad * conversiones[unidadDestino];
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
       LEFT JOIN PlanificacionServicioReceta psr ON jp.id_jornada = psr.id_jornada
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
function construirMensajePedidosAutomaticos(pedidosCreados) {
  let mensaje = `📦 <b>PEDIDOS AUTOMÁTICOS GENERADOS</b>\n\n`;
  mensaje += `📅 <b>Fecha:</b> ${new Date().toLocaleDateString("es-ES")}\n`;
  mensaje += `⏰ <b>Hora:</b> ${new Date().toLocaleTimeString("es-ES")}\n\n`;

  mensaje += `<b>Resumen de Pedidos:</b>\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (pedidosCreados.length > 0) {
    pedidosCreados.forEach((pedido, index) => {
      mensaje += `${index + 1}. <b>${pedido.proveedor}</b>\n`;
      mensaje += `   📋 ${pedido.items} items\n\n`;
    });
  } else {
    mensaje += `❌ No se generaron pedidos\n\n`;
  }

  mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `📊 <b>Total de Pedidos:</b> ${pedidosCreados.length}\n\n`;

  mensaje += `ℹ️ <b>Información:</b>\n`;
  mensaje += `• Los pedidos se generaron automáticamente\n`;
  mensaje += `• Verifica el estado en el sistema\n`;
  mensaje += `• Coordina con los proveedores\n`;
  mensaje += `• Próxima generación: próximo viernes\n\n`;

  mensaje += `✅ Sistema de generación automática activado`;

  return mensaje;
}
