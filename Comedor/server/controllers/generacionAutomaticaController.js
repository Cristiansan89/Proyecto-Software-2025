import { connection } from "../models/db.js";
import { ParametroSistemaModel } from "../models/parametrosistema.js";

// Generar insumos semanales
export const generarInsumosSemanales = async (req, res) => {
  try {
    // Obtener la planificación activa
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
      "SELECT DISTINCT pi.id_proveedor, pi.id_insumo, pr.nombre FROM ProveedorInsumo pi INNER JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor"
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
        const [result] = await connection.query(
          "INSERT INTO Pedidos (id_proveedor, estado, fechaPedido) VALUES (?, 'Pendiente', NOW())",
          [pedido.id_proveedor]
        );

        const idPedido = result.insertId;

        // Agregar líneas de pedido
        for (const item of pedido.items) {
          await connection.query(
            "INSERT INTO LineaPedido (id_pedido, id_insumo, cantidad, unidad) VALUES (?, ?, ?, ?)",
            [idPedido, item.id_insumo, item.cantidad, item.unidad]
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
    // Obtener la planificación activa
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

        console.log(
          `📌 ${fechaStr} - ${jornada.nombreServicio}: ${jornada.nombreReceta} (${comensalesParaCalculo} comensales específicos del servicio)`
        );
        const [items] = await connection.query(
          "SELECT id_insumo, cantidadPorPorcion, unidadPorPorcion FROM ItemsRecetas WHERE id_receta = ?",
          [jornada.id_receta]
        );

        for (const item of items) {
          const key = `${item.id_insumo}`;

          if (!insumosMap[key]) {
            const [insumo] = await connection.query(
              "SELECT nombreInsumo, unidadMedida FROM Insumos WHERE id_insumo = ?",
              [item.id_insumo]
            );

            insumosMap[key] = {
              id_insumo: item.id_insumo,
              nombre: insumo[0]?.nombreInsumo || "Insumo desconocido",
              unidad: item.unidadPorPorcion || insumo[0]?.unidadMedida,
              cantidad: 0,
            };
          }

          // Calcular cantidad paso a paso con logs detallados
          const cantidadPorPorcion = parseFloat(item.cantidadPorPorcion);
          const cantidadDia = cantidadPorPorcion * comensalesParaCalculo;
          const cantidadAnterior = insumosMap[key].cantidad;

          console.log(`📊 Calculando insumo: ${insumosMap[key].nombre}`);
          console.log(
            `   📏 Cantidad por porción: ${cantidadPorPorcion} ${insumosMap[key].unidad}`
          );
          console.log(`   👥 Comensales del día: ${comensalesParaCalculo}`);
          console.log(
            `   🍽️ Cantidad total día: ${cantidadPorPorcion} × ${comensalesParaCalculo} = ${cantidadDia} ${insumosMap[key].unidad}`
          );

          // Multiplicar por cantidad real de comensales de este servicio
          insumosMap[key].cantidad += cantidadDia;

          console.log(
            `   📈 Cantidad acumulada semanal: ${cantidadAnterior} + ${cantidadDia} = ${insumosMap[key].cantidad} ${insumosMap[key].unidad}`
          );
          console.log(`   ─────────────────────────────────────`);
        }
      } catch (itemError) {
        console.warn(
          `Error procesando items de receta ${jornada.id_receta}:`,
          itemError.message
        );
      }
    }

    const insumos = Object.values(insumosMap);

    // Log de resumen final
    console.log(`\n🎯 RESUMEN FINAL - INSUMOS SEMANALES CALCULADOS:`);
    console.log(`═══════════════════════════════════════════════`);
    insumos.forEach((insumo) => {
      console.log(
        `📦 ${insumo.nombre}: ${insumo.cantidad.toFixed(2)} ${insumo.unidad}`
      );
    });
    console.log(`═══════════════════════════════════════════════\n`);

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
