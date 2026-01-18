import { connection } from "./db.js";
import telegramService from "../services/telegramService.js";

export class PedidoModel {
  static async getAll() {
    try {
      const [pedidos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    ep.nombreEstado as estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    pr.mail as emailProveedor,
                    pr.telefono as telefonoProveedor,
                    pr.direccion as direccionProveedor,
                    pr.CUIT as cuitProveedor,
                    COALESCE(CONCAT(pe.nombre, ' ', pe.apellido), 'Sistema Automatico') as nombreUsuario,
                    DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaEmision,
                    p.origen,
                    DATE_FORMAT(p.fechaAprobacion, '%Y-%m-%d') as fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
                 LEFT JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 LEFT JOIN Personas pe ON u.id_persona = pe.id_persona
                 ORDER BY p.fechaEmision DESC;`,
      );
      return pedidos;
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      throw new Error("Error al obtener pedidos");
    }
  }

  static async getById({ id }) {
    try {
      const [pedidos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    ep.nombreEstado as estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    pr.mail as emailProveedor,
                    pr.telefono as telefonoProveedor,
                    pr.direccion as direccionProveedor,
                    pr.CUIT as cuitProveedor,
                    COALESCE(CONCAT(pe.nombre, ' ', pe.apellido), 'Sistema Automatico') as nombreUsuario,
                    DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaEmision,
                    p.origen,
                    DATE_FORMAT(p.fechaAprobacion, '%Y-%m-%d') as fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
                 LEFT JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 LEFT JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_pedido = UUID_TO_BIN(?);`,
        [id],
      );
      if (pedidos.length === 0) return null;
      return pedidos[0];
    } catch (error) {
      console.error("Error al obtener pedido:", error);
      throw new Error("Error al obtener pedido");
    }
  }

  static async create({ input }) {
    const {
      id_usuario,
      id_estadoPedido = 15, // Por defecto "Pendiente"
      id_proveedor,
      fechaEmision = new Date().toISOString().split("T")[0],
      origen = "Manual",
      fechaAprobacion = null,
      motivoCancelacion = null,
    } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO Pedidos (
                    id_usuario, 
                    id_estadoPedido,
                    id_proveedor, 
                    fechaEmision, 
                    origen,
                    fechaAprobacion,
                    motivoCancelacion
                ) VALUES (${
                  id_usuario ? "UUID_TO_BIN(?)" : "?"
                }, ?, UUID_TO_BIN(?), ?, ?, ?, ?);`,
        [
          id_usuario,
          id_estadoPedido,
          id_proveedor,
          fechaEmision,
          origen,
          fechaAprobacion,
          motivoCancelacion,
        ],
      );

      // Obtener el ID del pedido recién creado
      const [newPedido] = await connection.query(
        `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
                 FROM Pedidos 
                 WHERE id_proveedor = UUID_TO_BIN(?) AND fechaEmision = ?
                 ORDER BY fechaEmision DESC LIMIT 1;`,
        [id_proveedor, fechaEmision],
      );

      return this.getById({ id: newPedido[0].id_pedido });
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      throw new Error("Error al crear el pedido");
    }
  }

  static async delete({ id }) {
    try {
      // Primero eliminar los detalles del pedido
      await connection.query(
        `DELETE FROM DetallePedido WHERE id_pedido = UUID_TO_BIN(?);`,
        [id],
      );

      // Luego eliminar el pedido
      await connection.query(
        `DELETE FROM Pedidos WHERE id_pedido = UUID_TO_BIN(?);`,
        [id],
      );
      return true;
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      return false;
    }
  }

  static async update({ id, input }) {
    const { id_estadoPedido, fechaAprobacion, motivoCancelacion } = input;

    try {
      const updates = [];
      const values = [];

      if (id_estadoPedido !== undefined) {
        updates.push("id_estadoPedido = ?");
        values.push(id_estadoPedido);
      }
      if (fechaAprobacion !== undefined) {
        updates.push("fechaAprobacion = ?");
        values.push(fechaAprobacion);
      }
      if (motivoCancelacion !== undefined) {
        updates.push("motivoCancelacion = ?");
        values.push(motivoCancelacion);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      console.log("🔄 Ejecutando UPDATE con valores:", { updates, values, id });
      await connection.query(
        `UPDATE Pedidos
                 SET ${updates.join(", ")}
                 WHERE id_pedido = UUID_TO_BIN(?);`,
        values,
      );

      return this.getById({ id });
    } catch (error) {
      console.error("❌ Error al actualizar el pedido:", error);
      console.error("❌ Stack trace:", error.stack);
      throw new Error(`Error al actualizar el pedido: ${error.message}`);
    }
  }

  // Método para obtener pedidos por proveedor
  static async getByProveedor({ id_proveedor }) {
    try {
      const [pedidos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(COALESCE(pe.nombre, ''), ' ', COALESCE(pe.apellido, '')) as nombreUsuario,
                    DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaPedido,
                    DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaEmision,
                    p.origen,
                    DATE_FORMAT(p.fechaAprobacion, '%Y-%m-%d') as fechaAprobacion,
                    DATE_FORMAT(p.fechaEntregaEsperada, '%Y-%m-%d') as fechaEntregaEsperada,
                    p.motivoCancelacion,
                    (SELECT COUNT(*) FROM DetallePedido dp WHERE dp.id_pedido = p.id_pedido) as cantidadInsumos,
                    CASE 
                        WHEN p.id_estadoPedido = 1 THEN 'Pendiente'
                        WHEN p.id_estadoPedido = 2 THEN 'Aprobado'
                        WHEN p.id_estadoPedido = 3 THEN 'Entregado'
                        WHEN p.id_estadoPedido = 4 THEN 'Cancelado'
                        ELSE 'Desconocido'
                    END as estadoPedido
                 FROM Pedidos p
                 LEFT JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 LEFT JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 LEFT JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_proveedor = UUID_TO_BIN(?)
                 ORDER BY p.fechaEmision DESC;`,
        [id_proveedor],
      );
      return pedidos;
    } catch (error) {
      console.error("Error al obtener pedidos por proveedor:", error);
      throw new Error("Error al obtener pedidos por proveedor");
    }
  }

  // Método para obtener pedidos por estado
  static async getByEstado({ id_estadoPedido }) {
    try {
      const [pedidos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(pe.nombre, ' ', pe.apellido) as nombreUsuario,
                    DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaEmision,
                    p.origen,
                    DATE_FORMAT(p.fechaAprobacion, '%Y-%m-%d') as fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_estadoPedido = ?
                 ORDER BY p.fechaEmision DESC;`,
        [id_estadoPedido],
      );
      return pedidos;
    } catch (error) {
      console.error("Error al obtener pedidos por estado:", error);
      throw new Error("Error al obtener pedidos por estado");
    }
  }

  // Método para obtener pedido completo con sus detalles
  static async getPedidoCompleto({ id }) {
    try {
      const pedido = await this.getById({ id });
      if (!pedido) return null;

      const [detalles] = await connection.query(
        `SELECT 
                    dp.id_detallePedido,
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    dp.id_insumo,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    dp.cantidadSolicitada,
                    pr.razonSocial as nombreProveedor
                 FROM DetallePedido dp
                 JOIN Insumos i ON dp.id_insumo = i.id_insumo
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 WHERE dp.id_pedido = UUID_TO_BIN(?)
                 ORDER BY pr.razonSocial, i.nombre;`,
        [id],
      );

      return {
        ...pedido,
        detalles,
      };
    } catch (error) {
      console.error("Error al obtener pedido completo:", error);
      throw new Error("Error al obtener pedido completo");
    }
  }

  // Método para aprobar un pedido
  static async aprobar({ id, id_usuario_aprobador }) {
    try {
      await connection.query(
        `UPDATE Pedidos
                 SET id_estadoPedido = 16, 
                     fechaAprobacion = CURDATE(),
                     id_usuario = UUID_TO_BIN(?)
                 WHERE id_pedido = UUID_TO_BIN(?);`,
        [id_usuario_aprobador, id],
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al aprobar pedido:", error);
      throw new Error("Error al aprobar pedido");
    }
  }

  // Método para cancelar un pedido
  static async cancelar({ id, motivoCancelacion }) {
    try {
      await connection.query(
        `UPDATE Pedidos
                 SET id_estadoPedido = 20, motivoCancelacion = ?
                 WHERE id_pedido = UUID_TO_BIN(?);`,
        [motivoCancelacion, id],
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      throw new Error("Error al cancelar pedido");
    }
  }

  // Método para obtener resumen de pedidos por período
  static async getResumenPorPeriodo({ fechaInicio, fechaFin }) {
    try {
      const [resumen] = await connection.query(
        `SELECT 
                    p.origen,
                    p.id_estadoPedido,
                    COUNT(*) as totalPedidos,
                    COUNT(DISTINCT p.id_proveedor) as proveedoresInvolucrados
                 FROM Pedidos p
                 WHERE p.fechaEmision BETWEEN ? AND ?
                 GROUP BY p.origen, p.id_estadoPedido
                 ORDER BY p.origen, p.id_estadoPedido;`,
        [fechaInicio, fechaFin],
      );
      return resumen;
    } catch (error) {
      console.error("Error al obtener resumen por período:", error);
      throw new Error("Error al obtener resumen por período");
    }
  }

  // Método para crear pedido manual con múltiples insumos y proveedores
  static async crearPedidoManual({
    insumos,
    fechaEntregaEsperada,
    observaciones,
    id_usuario,
  }) {
    const connection_ref = connection;
    try {
      // Comenzar transacción
      await connection_ref.beginTransaction();

      // Agrupar insumos por proveedor
      const insumosPorProveedor = {};
      insumos.forEach((item) => {
        if (!insumosPorProveedor[item.id_proveedor]) {
          insumosPorProveedor[item.id_proveedor] = [];
        }
        insumosPorProveedor[item.id_proveedor].push(item);
      });

      const pedidosCreados = [];
      const fechaEmision = new Date().toISOString().split("T")[0];

      // Crear un pedido por cada proveedor
      for (const [idProveedor, insumosProveedor] of Object.entries(
        insumosPorProveedor,
      )) {
        // Crear el pedido principal
        const [resultPedido] = await connection_ref.query(
          `INSERT INTO Pedidos (
                        id_usuario, 
                        id_estadoPedido,
                        id_proveedor, 
                        fechaEmision, 
                        origen,
                        motivoCancelacion
                    ) VALUES (UUID_TO_BIN(?), 15, UUID_TO_BIN(?), ?, 'Manual', ?);`,
          [id_usuario, idProveedor, fechaEmision, observaciones],
        );

        // Obtener el ID del pedido recién creado
        const [pedidoCreado] = await connection_ref.query(
          `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
                     FROM Pedidos 
                     WHERE id_proveedor = UUID_TO_BIN(?) AND id_usuario = UUID_TO_BIN(?) AND fechaEmision = ?
                     ORDER BY fechaEmision DESC LIMIT 1;`,
          [idProveedor, id_usuario, fechaEmision],
        );

        const idPedido = pedidoCreado[0].id_pedido;

        // Agregar las líneas de pedido (detalles)
        for (const insumo of insumosProveedor) {
          await connection_ref.query(
            `INSERT INTO DetallePedido (
                            id_pedido, 
                            id_proveedor,
                            id_insumo, 
                            cantidadSolicitada
                        ) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?);`,
            [idPedido, idProveedor, insumo.id_insumo, insumo.cantidad],
          );
        }

        // Obtener el pedido completo creado
        const pedidoCompleto = await this.getById({ id: idPedido });
        pedidosCreados.push(pedidoCompleto);
      }

      // Confirmar transacción
      await connection_ref.commit();
      return pedidosCreados;
    } catch (error) {
      // Revertir transacción en caso de error
      await connection_ref.rollback();
      console.error("Error al crear pedido manual:", error);
      throw new Error("Error al crear el pedido manual: " + error.message);
    }
  }

  // Método para generar pedido automático
  static async generarPedidoAutomatico({ fechaInicio, fechaFin }) {
    const connection_ref = connection;
    try {
      console.log(
        `🤖 Iniciando generación automática de pedidos para el período ${fechaInicio} - ${fechaFin}`,
      );

      // 1. Obtener todas las planificaciones activas para el período
      const [planificaciones] = await connection_ref.query(
        `SELECT 
          BIN_TO_UUID(id_planificacion) as id_planificacion,
          fechaInicio,
          fechaFin,
          comensalesEstimados,
          estado
        FROM PlanificacionMenus 
        WHERE estado = 'Activo' 
          AND fechaFin >= ? 
          AND fechaInicio <= ?`,
        [fechaInicio, fechaFin],
      );

      if (planificaciones.length === 0) {
        throw new Error(
          "No se encontraron planificaciones activas para el período especificado",
        );
      }

      console.log(
        `📋 Encontradas ${planificaciones.length} planificación(es) activa(s)`,
      );

      // 2. Obtener todos los menús asignados en el período
      const [menusAsignados] = await connection_ref.query(
        `SELECT 
          ja.fecha,
          ja.id_servicio,
          ja.id_receta,
          BIN_TO_UUID(ja.id_planificacion) as id_planificacion,
          r.nombreReceta,
          s.nombre as nombreServicio,
          pm.comensalesEstimados
        FROM JornadaAlimentaria ja
        JOIN Recetas r ON ja.id_receta = r.id_receta
        JOIN Servicios s ON ja.id_servicio = s.id_servicio  
        JOIN PlanificacionMenus pm ON ja.id_planificacion = pm.id_planificacion
        WHERE ja.fecha BETWEEN ? AND ?
          AND pm.estado = 'Activo'
        ORDER BY ja.fecha, ja.id_servicio`,
        [fechaInicio, fechaFin],
      );

      console.log(
        `🍽️ Encontrados ${menusAsignados.length} menú(s) asignado(s) en el período`,
      );

      if (menusAsignados.length === 0) {
        throw new Error(
          "No hay menús asignados en el período. Complete la planificación antes de generar pedidos automáticos.",
        );
      }

      // 3. Obtener comensales calculados por cada día y servicio
      const comensalesPorDiaServicio = {};
      for (const menu of menusAsignados) {
        const key = `${menu.fecha}_${menu.id_servicio}`;

        // Calcular comensales reales para esa fecha y servicio
        try {
          const [comensalesData] = await connection_ref.query(
            `SELECT 
              COUNT(ag.id_alumno) as totalComensales
            FROM AlumnoGrado ag 
            JOIN Grados g ON ag.id_grado = g.id_grado 
            JOIN ServicioTurno st ON g.id_turno = st.id_turno 
            WHERE st.id_servicio = ? AND ag.estado = 'Activo'`,
            [menu.id_servicio],
          );

          comensalesPorDiaServicio[key] =
            comensalesData[0]?.totalComensales || menu.comensalesEstimados;
        } catch (error) {
          console.warn(
            `⚠️ Error calculando comensales para ${key}, usando estimados:`,
            error.message,
          );
          comensalesPorDiaServicio[key] = menu.comensalesEstimados;
        }
      }

      // 4. Calcular insumos necesarios por receta y fecha
      console.log("🧮 Calculando insumos necesarios por receta...");

      const insumosNecesarios = {};

      for (const menu of menusAsignados) {
        const key = `${menu.fecha}_${menu.id_servicio}`;
        const comensales = comensalesPorDiaServicio[key];

        // Obtener ingredientes de la receta
        const [ingredientes] = await connection_ref.query(
          `SELECT 
            ir.id_insumo,
            i.nombreInsumo,
            i.unidadMedida,
            ir.cantidadNecesaria
          FROM ItemReceta ir
          JOIN Insumos i ON ir.id_insumo = i.id_insumo
          WHERE ir.id_receta = ?`,
          [menu.id_receta],
        );

        // Calcular cantidad total necesaria para cada insumo
        for (const ingrediente of ingredientes) {
          const cantidadPorComensal = ingrediente.cantidadNecesaria;
          const cantidadTotalNecesaria = cantidadPorComensal * comensales;

          if (!insumosNecesarios[ingrediente.id_insumo]) {
            insumosNecesarios[ingrediente.id_insumo] = {
              nombreInsumo: ingrediente.nombreInsumo,
              unidadMedida: ingrediente.unidadMedida,
              cantidadTotal: 0,
              detalleUso: [],
            };
          }

          insumosNecesarios[ingrediente.id_insumo].cantidadTotal +=
            cantidadTotalNecesaria;
          insumosNecesarios[ingrediente.id_insumo].detalleUso.push({
            fecha: menu.fecha,
            servicio: menu.nombreServicio,
            receta: menu.nombreReceta,
            comensales,
            cantidadNecesaria: cantidadTotalNecesaria,
          });
        }
      }

      console.log(
        `📦 Total de ${
          Object.keys(insumosNecesarios).length
        } insumo(s) únicos necesarios`,
      );

      // 5. Verificar stock actual y calcular déficit
      console.log("📊 Verificando stock actual...");

      const insumosDemandados = [];

      for (const [idInsumo, datos] of Object.entries(insumosNecesarios)) {
        const [stockActual] = await connection_ref.query(
          `SELECT 
            inv.cantidadActual,
            inv.nivelMinimoAlerta,
            i.stockMinimo
          FROM Inventarios inv 
          JOIN Insumos i ON inv.id_insumo = i.id_insumo
          WHERE inv.id_insumo = ?`,
          [idInsumo],
        );

        const stock = stockActual[0];
        if (!stock) {
          console.warn(
            `⚠️ No se encontró inventario para insumo ${datos.nombreInsumo}`,
          );
          continue;
        }

        const disponible = stock.cantidadActual;
        const necesario = datos.cantidadTotal;
        const nivelSeguridad = Math.max(
          stock.nivelMinimoAlerta,
          stock.stockMinimo,
        );

        // Calcular cantidad a pedir (déficit + margen de seguridad)
        const deficit = Math.max(0, necesario - disponible);
        const cantidadAPedir = deficit + nivelSeguridad;

        if (cantidadAPedir > 0) {
          insumosDemandados.push({
            id_insumo: parseInt(idInsumo),
            nombreInsumo: datos.nombreInsumo,
            unidadMedida: datos.unidadMedida,
            stockActual: disponible,
            cantidadNecesaria: necesario,
            deficit: deficit,
            nivelSeguridad: nivelSeguridad,
            cantidadAPedir: Math.ceil(cantidadAPedir), // Redondear hacia arriba
            detalleUso: datos.detalleUso,
          });
        }
      }

      console.log(
        `🔍 Identificados ${insumosDemandados.length} insumo(s) que necesitan reabastecimiento`,
      );

      if (insumosDemandados.length === 0) {
        return {
          pedidosCreados: [],
          mensaje:
            "No es necesario realizar pedidos. El inventario actual es suficiente para la planificación.",
          detalleAnalisis: {
            periodoPlanificacion: `${fechaInicio} - ${fechaFin}`,
            totalMenus: menusAsignados.length,
            insumosAnalizados: Object.keys(insumosNecesarios).length,
            stockSuficiente: true,
          },
        };
      }

      // 6. Buscar mejores proveedores para cada insumo
      console.log("🔎 Buscando mejores proveedores...");

      const insumosPorProveedor = {};

      for (const insumo of insumosDemandados) {
        const [proveedores] = await connection_ref.query(
          `SELECT 
            BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
            pr.razonSocial,
            pr.mail,
            pi.calificacion,
            pr.estado
          FROM ProveedorInsumo pi
          JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
          WHERE pi.id_insumo = ? 
            AND pr.estado = 'Activo' 
            AND pi.estado = 'Activo'
          ORDER BY 
            FIELD(pi.calificacion, 'Excelente', 'Bueno', 'Regular', 'Malo'),
            pr.razonSocial`,
          [insumo.id_insumo],
        );

        if (proveedores.length === 0) {
          console.warn(
            `⚠️ No se encontraron proveedores activos para ${insumo.nombreInsumo}`,
          );
          continue;
        }

        // Seleccionar el mejor proveedor (primero en la lista ordenada)
        const mejorProveedor = proveedores[0];

        if (!insumosPorProveedor[mejorProveedor.id_proveedor]) {
          insumosPorProveedor[mejorProveedor.id_proveedor] = {
            proveedor: mejorProveedor,
            insumos: [],
          };
        }

        insumosPorProveedor[mejorProveedor.id_proveedor].insumos.push({
          ...insumo,
          proveedorSeleccionado: mejorProveedor,
        });
      }

      console.log(
        `🏪 Distribución entre ${
          Object.keys(insumosPorProveedor).length
        } proveedor(es)`,
      );

      // 7. Crear pedidos agrupados por proveedor
      console.log("📝 Creando pedidos automáticos...");

      await connection_ref.beginTransaction();

      const pedidosCreados = [];
      const fechaEmision = new Date().toISOString().split("T")[0];
      const fechaEntregaEsperada = new Date(
        new Date(fechaInicio).getTime() - 2 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0]; // 2 días antes del inicio

      try {
        for (const [idProveedor, data] of Object.entries(insumosPorProveedor)) {
          const { proveedor, insumos } = data;

          // Crear pedido principal
          const [resultPedido] = await connection_ref.query(
            `INSERT INTO Pedidos (
              id_usuario, 
              id_estadoPedido,
              id_proveedor, 
              fechaEmision, 
              origen,
              motivoCancelacion
            ) VALUES (NULL, 15, UUID_TO_BIN(?), ?, 'Generado', ?);`,
            [
              idProveedor,
              fechaEmision,
              `Pedido automático generado para período ${fechaInicio} - ${fechaFin}. Total: ${insumos.length} insumo(s).`,
            ],
          );

          // Obtener ID del pedido creado
          const [pedidoCreado] = await connection_ref.query(
            `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
             FROM Pedidos 
             WHERE id_proveedor = UUID_TO_BIN(?) AND fechaEmision = ? AND origen = 'Generado'
             ORDER BY fechaEmision DESC LIMIT 1;`,
            [idProveedor, fechaEmision],
          );

          const idPedido = pedidoCreado[0].id_pedido;

          // Agregar líneas de pedido
          for (const insumo of insumos) {
            await connection_ref.query(
              `INSERT INTO DetallePedido (
                id_pedido, 
                id_proveedor,
                id_insumo, 
                cantidadSolicitada
              ) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?);`,
              [idPedido, idProveedor, insumo.id_insumo, insumo.cantidadAPedir],
            );
          }

          // Obtener pedido completo
          const pedidoCompleto = await this.getById({ id: idPedido });
          pedidosCreados.push({
            ...pedidoCompleto,
            detalleInsumos: insumos,
            resumenProveedor: {
              razonSocial: proveedor.razonSocial,
              email: proveedor.mail,
              calificacionPromedio:
                insumos.reduce((acc, i) => {
                  const valor =
                    i.proveedorSeleccionado.calificacion === "Excelente"
                      ? 4
                      : i.proveedorSeleccionado.calificacion === "Bueno"
                        ? 3
                        : i.proveedorSeleccionado.calificacion === "Regular"
                          ? 2
                          : 1;
                  return acc + valor;
                }, 0) / insumos.length,
            },
          });

          console.log(
            `✅ Pedido creado para ${proveedor.razonSocial}: ${insumos.length} insumo(s)`,
          );
        }

        await connection_ref.commit();

        console.log(
          `🎉 Generación automática completada: ${pedidosCreados.length} pedido(s) creado(s)`,
        );

        return {
          pedidosCreados,
          mensaje: `Se generaron ${pedidosCreados.length} pedido(s) automático(s) basados en la planificación.`,
          detalleAnalisis: {
            periodoPlanificacion: `${fechaInicio} - ${fechaFin}`,
            totalMenus: menusAsignados.length,
            insumosAnalizados: Object.keys(insumosNecesarios).length,
            insumosPedidos: insumosDemandados.length,
            proveedoresInvolucrados: Object.keys(insumosPorProveedor).length,
            fechaEntregaSugerida: fechaEntregaEsperada,
          },
        };
      } catch (error) {
        await connection_ref.rollback();
        throw error;
      }
    } catch (error) {
      console.error("❌ Error al generar pedido automático:", error);
      throw new Error("Error al generar pedido automático: " + error.message);
    }
  }

  // Método para cambiar estado de pedido
  static async cambiarEstado({ id, estado }) {
    try {
      // Primero, obtener el id_estadoPedido basado en el nombre del estado
      let idEstado;

      if (typeof estado === "number") {
        // Si ya es un número, usarlo directamente
        idEstado = estado;
      } else {
        // Si es un string, buscar el id_estadoPedido correspondiente
        const [estadoResult] = await connection.query(
          `SELECT id_estadoPedido FROM EstadoPedido WHERE nombreEstado = ?`,
          [estado],
        );

        if (!estadoResult || estadoResult.length === 0) {
          throw new Error(`Estado de pedido no encontrado: ${estado}`);
        }

        idEstado = estadoResult[0].id_estadoPedido;
      }

      await connection.query(
        `UPDATE Pedidos
                 SET id_estadoPedido = ?
                 WHERE id_pedido = UUID_TO_BIN(?);`,
        [idEstado, id],
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      throw new Error("Error al cambiar estado del pedido");
    }
  }

  // Generar token para confirmación de proveedor
  static async generateTokenForProveedor({ idPedido, idProveedor }) {
    try {
      // Verificar que el pedido existe y está aprobado
      const pedido = await this.getById({ id: idPedido });
      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      if (pedido.estadoPedido !== "Aprobado") {
        throw new Error(
          "Solo se pueden enviar confirmaciones para pedidos aprobados",
        );
      }

      // Verificar que el proveedor tiene insumos en este pedido
      const [insumosPedido] = await connection.query(
        `SELECT COUNT(*) as count 
         FROM DetallePedido dp 
         WHERE dp.id_pedido = UUID_TO_BIN(?) 
         AND dp.id_proveedor = UUID_TO_BIN(?)`,
        [idPedido, idProveedor],
      );

      if (insumosPedido[0].count === 0) {
        throw new Error(
          "Este proveedor no tiene insumos asignados en este pedido",
        );
      }

      const tokenData = {
        idPedido,
        idProveedor,
        timestamp: Date.now(),
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
      };

      // En un entorno real, esto se encriptaría con JWT
      const token = Buffer.from(JSON.stringify(tokenData)).toString("base64");
      return token;
    } catch (error) {
      console.error("Error al generar token para proveedor:", error);
      throw error;
    }
  }

  // Validar token de proveedor
  static async validateTokenProveedor(token) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, "base64").toString());

      // Verificar si el token no ha expirado
      if (Date.now() > tokenData.expires) {
        throw new Error("Token expirado");
      }

      return tokenData;
    } catch (error) {
      throw new Error("Token inválido");
    }
  }

  // Obtener datos del pedido por token (para proveedor)
  static async getByTokenProveedor({ token }) {
    try {
      const tokenData = await this.validateTokenProveedor(token);
      const { idPedido, idProveedor } = tokenData;

      // Obtener datos del pedido con su estado
      const pedido = await this.getById({ id: idPedido });
      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }

      // Obtener estado del pedido
      const [pedidoEstado] = await connection.query(
        `SELECT ep.nombreEstado as estadoPedido 
         FROM Pedidos p
         JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
         WHERE p.id_pedido = UUID_TO_BIN(?)`,
        [idPedido],
      );

      // Obtener datos del proveedor
      const [proveedorData] = await connection.query(
        `SELECT 
          BIN_TO_UUID(p.id_proveedor) as id_proveedor,
          p.razonSocial,
          p.mail,
          p.telefono
         FROM Proveedores p 
         WHERE p.id_proveedor = UUID_TO_BIN(?)`,
        [idProveedor],
      );

      if (proveedorData.length === 0) {
        throw new Error("Proveedor no encontrado");
      }

      // Obtener insumos del pedido para este proveedor
      const [insumos] = await connection.query(
        `SELECT 
          dp.id_detallePedido,
          dp.id_insumo,
          i.nombreInsumo,
          i.unidadMedida,
          dp.cantidadSolicitada,
          dp.estadoConfirmacion
         FROM DetallePedido dp
         JOIN Insumos i ON dp.id_insumo = i.id_insumo
         WHERE dp.id_pedido = UUID_TO_BIN(?) 
         AND dp.id_proveedor = UUID_TO_BIN(?)
         ORDER BY i.nombreInsumo`,
        [idPedido, idProveedor],
      );

      // VALIDACIÓN CRÍTICA DE SEGURIDAD:
      // Si este proveedor no tiene insumos en este pedido,
      // negar acceso (otro proveedor intenta acceder con link ajeno)
      if (insumos.length === 0) {
        console.warn(
          `🚫 Intento de acceso no autorizado: Proveedor ${idProveedor} intentó acceder a pedido ${idPedido} sin asignación`,
        );
        throw new Error(
          "No tiene pedidos asignados. Contacte al administrador si cree que es un error.",
        );
      }

      return {
        tokenData,
        pedido,
        proveedor: proveedorData[0],
        insumos,
        estadoPedido: pedidoEstado[0]?.estadoPedido || "Desconocido",
      };
    } catch (error) {
      console.error("Error al obtener datos por token:", error);
      throw error;
    }
  }

  // Confirmar insumos por proveedor
  static async confirmarInsumosProveedor({ token, confirmaciones }) {
    const connection_ref = await connection.getConnection();

    try {
      await connection_ref.beginTransaction();

      const tokenData = await this.validateTokenProveedor(token);
      const { idPedido, idProveedor } = tokenData;

      // Verificar que el pedido no fue procesado ya
      const [pedidoEstado] = await connection_ref.query(
        `SELECT ep.nombreEstado as estadoPedido 
         FROM Pedidos p
         JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
         WHERE p.id_pedido = UUID_TO_BIN(?)`,
        [idPedido],
      );

      if (pedidoEstado.length === 0) {
        throw new Error("Pedido no encontrado");
      }

      if (pedidoEstado[0].estadoPedido === "Confirmado") {
        throw new Error("Este pedido ya fue procesado anteriormente");
      }

      let confirmadas = 0;
      let rechazadas = 0;
      const insumosNoDisponibles = [];

      // Procesar cada confirmación
      for (const conf of confirmaciones) {
        const { idDetallePedido, estado } = conf;

        // Actualizar el detalle del pedido (solo estado de disponibilidad)
        await connection_ref.query(
          `UPDATE DetallePedido 
           SET estadoConfirmacion = ?,
               fechaConfirmacion = NOW()
           WHERE id_detallePedido = ?`,
          [estado, idDetallePedido],
        );

        // Contar confirmaciones
        if (estado === "Disponible") {
          confirmadas++;
        } else if (estado === "No Disponible") {
          rechazadas++;
          // Agregar a lista de no disponibles para redistribuir
          const [insumoInfo] = await connection_ref.query(
            `SELECT dp.id_insumo, dp.cantidadSolicitada, i.nombreInsumo
             FROM DetallePedido dp
             JOIN Insumos i ON dp.id_insumo = i.id_insumo
             WHERE dp.id_detallePedido = ?`,
            [idDetallePedido],
          );

          if (insumoInfo.length > 0) {
            insumosNoDisponibles.push({
              id_insumo: insumoInfo[0].id_insumo,
              nombreInsumo: insumoInfo[0].nombreInsumo,
              cantidad: insumoInfo[0].cantidadSolicitada,
            });
          }
        }
      }

      // Marcar el pedido como confirmado por este proveedor
      // Obtener el ID del estado 'Confirmado'
      const [estadoConfirmado] = await connection_ref.query(
        `SELECT id_estadoPedido FROM EstadoPedido WHERE nombreEstado = 'Confirmado' LIMIT 1`,
      );

      if (!estadoConfirmado || estadoConfirmado.length === 0) {
        throw new Error("Estado 'Confirmado' no encontrado en EstadoPedido");
      }

      const idEstadoConfirmado = estadoConfirmado[0].id_estadoPedido;

      await connection_ref.query(
        `UPDATE Pedidos 
         SET id_estadoPedido = ?, 
             fechaConfirmacion = NOW() 
         WHERE id_pedido = UUID_TO_BIN(?)`,
        [idEstadoConfirmado, idPedido],
      );

      await connection_ref.commit();

      // Si hay insumos no disponibles, crear nuevo pedido automáticamente
      let nuevoPedidoId = null;
      if (insumosNoDisponibles.length > 0) {
        try {
          nuevoPedidoId = await this.redistribuirInsumosNoDisponibles({
            insumosNoDisponibles,
            pedidoOriginal: idPedido,
            proveedorOriginal: idProveedor,
          });
        } catch (error) {
          console.warn("⚠️ Error al redistribuir insumos:", error.message);
        }
      }

      return {
        confirmadas,
        rechazadas,
        nuevoPedidoCreado: nuevoPedidoId !== null,
        nuevoPedidoId,
        insumosRedistribuidos: insumosNoDisponibles.length,
      };
    } catch (error) {
      await connection_ref.rollback();
      throw error;
    } finally {
      connection_ref.release();
    }
  }

  // Redistribuir insumos no disponibles a otro proveedor
  static async redistribuirInsumosNoDisponibles({
    insumosNoDisponibles,
    pedidoOriginal,
    proveedorOriginal,
  }) {
    try {
      console.log("🔄 Iniciando redistribución de insumos no disponibles...");

      // Buscar proveedores alternativos para cada insumo (excluyendo el proveedor original)
      const insumosPorProveedor = {};

      for (const insumo of insumosNoDisponibles) {
        const [proveedores] = await connection.query(
          `SELECT 
            BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
            pr.razonSocial,
            pr.mail
           FROM ProveedorInsumo pi
           JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
           WHERE pi.id_insumo = ? 
           AND pi.estado = 'Activo'
           AND pi.id_proveedor != UUID_TO_BIN(?)
           ORDER BY pi.precio ASC
           LIMIT 1`,
          [insumo.id_insumo, proveedorOriginal],
        );

        if (proveedores.length > 0) {
          const proveedor = proveedores[0];

          if (!insumosPorProveedor[proveedor.id_proveedor]) {
            insumosPorProveedor[proveedor.id_proveedor] = {
              proveedor: proveedor,
              insumos: [],
            };
          }

          insumosPorProveedor[proveedor.id_proveedor].insumos.push(insumo);
        } else {
          console.warn(
            `⚠️ No se encontró proveedor alternativo para ${insumo.nombreInsumo}`,
          );
        }
      }

      // Crear nuevo pedido para el primer proveedor encontrado (simplificado)
      const proveedoresConInsumos = Object.keys(insumosPorProveedor);

      if (proveedoresConInsumos.length === 0) {
        throw new Error("No se encontraron proveedores alternativos");
      }

      const primerProveedorId = proveedoresConInsumos[0];
      const datosProveedor = insumosPorProveedor[primerProveedorId];

      // Obtener datos del usuario del pedido original
      const [pedidoOriginalData] = await connection.query(
        `SELECT BIN_TO_UUID(id_usuario) as id_usuario
         FROM Pedidos WHERE id_pedido = UUID_TO_BIN(?)`,
        [pedidoOriginal],
      );

      if (pedidoOriginalData.length === 0) {
        throw new Error("No se pudo obtener el usuario del pedido original");
      }

      // Crear nuevo pedido
      const fechaHoy = new Date().toISOString().split("T")[0];
      const fechaEntrega = new Date();
      fechaEntrega.setDate(fechaEntrega.getDate() + 3); // 3 días para entrega

      const nuevoPedido = await this.crearPedidoManual({
        insumos: datosProveedor.insumos.map((insumo) => ({
          id_proveedor: primerProveedorId,
          id_insumo: insumo.id_insumo,
          cantidad: insumo.cantidad,
        })),
        fechaEntregaEsperada: fechaEntrega.toISOString().split("T")[0],
        observaciones: `Pedido automático generado por redistribución del pedido ${pedidoOriginal}`,
        id_usuario: pedidoOriginalData[0].id_usuario,
      });

      console.log(
        `✅ Nuevo pedido creado: ${nuevoPedido.pedidosCreados[0]?.id_pedido}`,
      );

      return nuevoPedido.pedidosCreados[0]?.id_pedido;
    } catch (error) {
      console.error("❌ Error al redistribuir insumos:", error);
      throw error;
    }
  }

  // Enviar email de confirmación al proveedor
  static async enviarEmailConfirmacion({
    idPedido,
    idProveedor,
    enlaceConfirmacion,
    datosAdicionales,
  }) {
    try {
      console.log("📧 Iniciando envío de email de confirmación...");

      // Obtener datos del proveedor
      const [proveedorData] = await connection.query(
        `SELECT 
          BIN_TO_UUID(p.id_proveedor) as id_proveedor,
          p.razonSocial,
          p.mail,
          p.telefono
         FROM Proveedores p 
         WHERE p.id_proveedor = UUID_TO_BIN(?)`,
        [idProveedor],
      );

      if (proveedorData.length === 0) {
        throw new Error("Proveedor no encontrado");
      }

      const proveedor = proveedorData[0];

      if (!proveedor.mail) {
        throw new Error(
          `El proveedor ${proveedor.razonSocial} no tiene email registrado`,
        );
      }

      // Obtener datos del pedido
      const [pedidoData] = await connection.query(
        `SELECT 
          BIN_TO_UUID(p.id_pedido) as id_pedido,
          DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaEmision,
          DATE_FORMAT(p.fechaAprobacion, '%Y-%m-%d') as fechaAprobacion,
          COUNT(dp.id_detallePedido) as totalInsumos
         FROM Pedidos p
         LEFT JOIN DetallePedido dp ON p.id_pedido = dp.id_pedido AND dp.id_proveedor = UUID_TO_BIN(?)
         WHERE p.id_pedido = UUID_TO_BIN(?)
         GROUP BY p.id_pedido`,
        [idProveedor, idPedido],
      );

      if (pedidoData.length === 0) {
        throw new Error("Datos del pedido no encontrados");
      }

      const pedido = pedidoData[0];

      // Preparar contenido del email
      const asunto = `🍽️ Confirmación de Pedido - ${proveedor.razonSocial}`;

      const fechaEmision = new Date(
        pedido.fechaEmision + "T12:00:00",
      ).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const contenidoHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Confirmación de Pedido</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .info-box { background: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Confirmación de Pedido</h1>
              <p>Sistema de Gestión de Comedor Escolar</p>
            </div>
            <div class="content">
              <h2>Estimado proveedor: ${proveedor.razonSocial}</h2>
              
              <p>Se ha generado un nuevo pedido que requiere su confirmación de disponibilidad.</p>
              
              <div class="info-box">
                <h3>📋 Detalles del Pedido</h3>
                <p><strong>Número de Pedido:</strong> ${pedido.id_pedido.slice(
                  0,
                  8,
                )}...</p>
                <p><strong>Fecha de Emisión:</strong> ${fechaEmision}</p>
                <p><strong>Total de Insumos:</strong> ${
                  pedido.totalInsumos
                } item(s)</p>
                <p><strong>Solicitado por:</strong> ${
                  datosAdicionales.nombreCocinera || "Sistema"
                }</p>
              </div>

              <div class="alert">
                <h3>⏰ Acción Requerida</h3>
                <p>Por favor, revise el pedido y confirme la disponibilidad de cada insumo haciendo clic en el siguiente enlace:</p>
              </div>

              <div style="text-align: center;">
                <a href="${enlaceConfirmacion}" class="btn">
                  ✅ Confirmar Disponibilidad de Insumos
                </a>
              </div>

              <div class="info-box">
                <h3>📝 Instrucciones</h3>
                <ul>
                  <li>El enlace le llevará a una interfaz donde podrá revisar cada insumo</li>
                  <li>Marque cada insumo como: <strong>Disponible</strong>, <strong>No Disponible</strong> o <strong>Parcial</strong></li>
                  <li>Para insumos parciales, indique la cantidad disponible</li>
                  <li>Puede agregar observaciones para cada insumo</li>
                  <li>Una vez confirmado, el sistema procesará automáticamente su respuesta</li>
                </ul>
              </div>

              <p><strong>Nota importante:</strong> Este enlace es válido por 7 días y es específico para este pedido.</p>
              
              <p>Si tiene alguna consulta, no dude en contactarnos.</p>
              
              <p>Gracias por su colaboración.</p>
              
              <p><strong>Equipo de Gestión de Comedor</strong></p>
            </div>
            <div class="footer">
              <p>Este es un email automático. Por favor, no responda directamente a este mensaje.</p>
              <p>© ${new Date().getFullYear()} Sistema de Gestión de Comedor Escolar</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // En un entorno real, aquí se integraría con un servicio de email como:
      // - Nodemailer
      // - SendGrid
      // - Amazon SES
      // - Mailgun, etc.

      // Por ahora, simulamos el envío y registramos la información
      console.log("📧 Simulando envío de email:");
      console.log(`Para: ${proveedor.mail}`);
      console.log(`Asunto: ${asunto}`);
      console.log(`Enlace: ${enlaceConfirmacion}`);

      // TODO: Implementar servicio real de email
      // Ejemplo con Nodemailer:
      /*
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail', // o el servicio que uses
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: proveedor.mail,
        subject: asunto,
        html: contenidoHtml
      });
      */

      // Registrar intento de envío en la base de datos para auditoría
      await connection.query(
        `INSERT INTO EmailsEnviados (
          id_pedido,
          id_proveedor, 
          email_destinatario,
          asunto,
          enlace_confirmacion,
          fecha_envio,
          estado
        ) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, NOW(), 'Simulado')`,
        [idPedido, idProveedor, proveedor.mail, asunto, enlaceConfirmacion],
      );

      return {
        emailEnviado: true,
        destinatario: proveedor.mail,
        proveedor: proveedor.razonSocial,
        simulado: true, // Cambiar a false cuando se implemente envío real
        mensaje:
          "Email simulado correctamente (implementar servicio real de email)",
      };
    } catch (error) {
      console.error("❌ Error al enviar email de confirmación:", error);
      throw error;
    }
  }

  // Enviar notificación por Telegram al proveedor
  static async enviarNotificacionTelegramProveedor({
    idPedido,
    idProveedor,
    enlaceConfirmacion,
  }) {
    try {
      console.log("📱 Iniciando envío de notificación por Telegram...");

      // Obtener datos del proveedor incluyendo chatId de Telegram desde ProveedorConfiguracionTelegram
      const [proveedorData] = await connection.query(
        `SELECT 
          BIN_TO_UUID(p.id_proveedor) as id_proveedor,
          p.razonSocial,
          pct.telegramChatId,
          pct.telegramUsuario,
          pct.notificacionesTelegram
         FROM Proveedores p 
         LEFT JOIN ProveedorConfiguracionTelegram pct ON p.id_proveedor = pct.id_proveedor
         WHERE p.id_proveedor = UUID_TO_BIN(?)`,
        [idProveedor],
      );

      if (proveedorData.length === 0) {
        throw new Error("Proveedor no encontrado");
      }

      const proveedor = proveedorData[0];

      // Validar que el proveedor tiene notificaciones habilitadas
      if (proveedor.notificacionesTelegram !== "Activo") {
        console.warn(
          `⚠️ Proveedor ${proveedor.razonSocial} tiene notificaciones de Telegram deshabilitadas`,
        );
        return {
          telegramEnviado: false,
          motivo:
            "Notificaciones de Telegram deshabilitadas para este proveedor",
          proveedor: proveedor.razonSocial,
        };
      }

      // Validar que existe chatId
      if (!proveedor.telegramChatId) {
        console.warn(
          `⚠️ Proveedor ${proveedor.razonSocial} no tiene chatId de Telegram registrado`,
        );
        return {
          telegramEnviado: false,
          motivo: "Proveedor no tiene chatId de Telegram registrado",
          proveedor: proveedor.razonSocial,
          instrucciones:
            "El administrador debe ejecutar /chatid en el bot y guardar el ID aquí",
        };
      }

      // Obtener datos del pedido
      const [pedidoData] = await connection.query(
        `SELECT 
          BIN_TO_UUID(p.id_pedido) as id_pedido,
          DATE_FORMAT(p.fechaEmision, '%Y-%m-%d') as fechaEmision,
          COUNT(dp.id_detallePedido) as totalInsumos
         FROM Pedidos p
         LEFT JOIN DetallePedido dp ON p.id_pedido = dp.id_pedido AND dp.id_proveedor = UUID_TO_BIN(?)
         WHERE p.id_pedido = UUID_TO_BIN(?)
         GROUP BY p.id_pedido`,
        [idProveedor, idPedido],
      );

      if (pedidoData.length === 0) {
        throw new Error("Datos del pedido no encontrados");
      }

      const pedido = pedidoData[0];

      // Construir mensaje de Telegram
      const mensaje = `🍽️ *Nuevo Pedido para Confirmar*

📦 *Detalles:*
• Pedido: \`${pedido.id_pedido.slice(0, 8)}...\`
• Fecha: ${new Date(pedido.fechaEmision).toLocaleDateString("es-ES")}
• Insumos: ${pedido.totalInsumos} item(s)

⏰ *Acción Requerida:*
Confirme la disponibilidad de los insumos en los próximos 7 días.

📝 *Instrucciones:*
1. Haga clic en el botón abajo
2. Revise cada insumo
3. Marque como Disponible o No Disponible
4. Envíe su confirmación

¡Gracias por su colaboración!`;

      // Crear botones inline para acceso directo
      const buttons = [
        [
          {
            text: "✅ Confirmar Insumos",
            url: enlaceConfirmacion,
          },
        ],
      ];

      // Enviar mensaje con botones usando el bot de proveedores
      const result = await telegramService.sendMessageWithButtons(
        proveedor.telegramChatId,
        mensaje,
        buttons,
        "proveedor",
      );

      if (result.success) {
        console.log(
          `✅ Notificación Telegram enviada al proveedor ${proveedor.razonSocial}`,
        );

        // Registrar envío exitoso
        return {
          telegramEnviado: true,
          proveedor: proveedor.razonSocial,
          usuario: proveedor.telegramUsuario,
          chatId: proveedor.telegramChatId,
          messageId: result.messageId,
          mensaje: "Notificación enviada por Telegram correctamente",
        };
      } else {
        console.error(`❌ Error al enviar mensaje a Telegram:`, result.error);
        throw new Error(`Error de Telegram: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error al enviar notificación por Telegram:", error);
      throw error;
    }
  }
}
