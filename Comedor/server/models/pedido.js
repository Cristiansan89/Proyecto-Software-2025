import { connection } from "./db.js";

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
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
                 LEFT JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 LEFT JOIN Personas pe ON u.id_persona = pe.id_persona
                 ORDER BY p.fechaEmision DESC;`
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
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
                 LEFT JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 LEFT JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_pedido = UUID_TO_BIN(?);`,
        [id]
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
        ]
      );

      // Obtener el ID del pedido recién creado
      const [newPedido] = await connection.query(
        `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
                 FROM Pedidos 
                 WHERE id_proveedor = UUID_TO_BIN(?) AND fechaEmision = ?
                 ORDER BY fechaEmision DESC LIMIT 1;`,
        [id_proveedor, fechaEmision]
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
        [id]
      );

      // Luego eliminar el pedido
      await connection.query(
        `DELETE FROM Pedidos WHERE id_pedido = UUID_TO_BIN(?);`,
        [id]
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
      await connection.query(
        `UPDATE Pedidos
                 SET ${updates.join(", ")}
                 WHERE id_pedido = UUID_TO_BIN(?);`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
      throw new Error("Error al actualizar el pedido");
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
                    CONCAT(pe.nombre, ' ', pe.apellido) as nombreUsuario,
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_proveedor = UUID_TO_BIN(?)
                 ORDER BY p.fechaEmision DESC;`,
        [id_proveedor]
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
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_estadoPedido = ?
                 ORDER BY p.fechaEmision DESC;`,
        [id_estadoPedido]
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
        [id]
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
        [id_usuario_aprobador, id]
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
        [motivoCancelacion, id]
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
        [fechaInicio, fechaFin]
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
        insumosPorProveedor
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
          [id_usuario, idProveedor, fechaEmision, observaciones]
        );

        // Obtener el ID del pedido recién creado
        const [pedidoCreado] = await connection_ref.query(
          `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
                     FROM Pedidos 
                     WHERE id_proveedor = UUID_TO_BIN(?) AND id_usuario = UUID_TO_BIN(?) AND fechaEmision = ?
                     ORDER BY fechaEmision DESC LIMIT 1;`,
          [idProveedor, id_usuario, fechaEmision]
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
            [idPedido, idProveedor, insumo.id_insumo, insumo.cantidad]
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
        `🤖 Iniciando generación automática de pedidos para el período ${fechaInicio} - ${fechaFin}`
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
        [fechaInicio, fechaFin]
      );

      if (planificaciones.length === 0) {
        throw new Error(
          "No se encontraron planificaciones activas para el período especificado"
        );
      }

      console.log(
        `📋 Encontradas ${planificaciones.length} planificación(es) activa(s)`
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
        [fechaInicio, fechaFin]
      );

      console.log(
        `🍽️ Encontrados ${menusAsignados.length} menú(s) asignado(s) en el período`
      );

      if (menusAsignados.length === 0) {
        throw new Error(
          "No hay menús asignados en el período. Complete la planificación antes de generar pedidos automáticos."
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
            [menu.id_servicio]
          );

          comensalesPorDiaServicio[key] =
            comensalesData[0]?.totalComensales || menu.comensalesEstimados;
        } catch (error) {
          console.warn(
            `⚠️ Error calculando comensales para ${key}, usando estimados:`,
            error.message
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
          [menu.id_receta]
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
        } insumo(s) únicos necesarios`
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
          [idInsumo]
        );

        const stock = stockActual[0];
        if (!stock) {
          console.warn(
            `⚠️ No se encontró inventario para insumo ${datos.nombreInsumo}`
          );
          continue;
        }

        const disponible = stock.cantidadActual;
        const necesario = datos.cantidadTotal;
        const nivelSeguridad = Math.max(
          stock.nivelMinimoAlerta,
          stock.stockMinimo
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
        `🔍 Identificados ${insumosDemandados.length} insumo(s) que necesitan reabastecimiento`
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
          [insumo.id_insumo]
        );

        if (proveedores.length === 0) {
          console.warn(
            `⚠️ No se encontraron proveedores activos para ${insumo.nombreInsumo}`
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
        } proveedor(es)`
      );

      // 7. Crear pedidos agrupados por proveedor
      console.log("📝 Creando pedidos automáticos...");

      await connection_ref.beginTransaction();

      const pedidosCreados = [];
      const fechaEmision = new Date().toISOString().split("T")[0];
      const fechaEntregaEsperada = new Date(
        new Date(fechaInicio).getTime() - 2 * 24 * 60 * 60 * 1000
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
            ]
          );

          // Obtener ID del pedido creado
          const [pedidoCreado] = await connection_ref.query(
            `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
             FROM Pedidos 
             WHERE id_proveedor = UUID_TO_BIN(?) AND fechaEmision = ? AND origen = 'Generado'
             ORDER BY fechaEmision DESC LIMIT 1;`,
            [idProveedor, fechaEmision]
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
              [idPedido, idProveedor, insumo.id_insumo, insumo.cantidadAPedir]
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
            `✅ Pedido creado para ${proveedor.razonSocial}: ${insumos.length} insumo(s)`
          );
        }

        await connection_ref.commit();

        console.log(
          `🎉 Generación automática completada: ${pedidosCreados.length} pedido(s) creado(s)`
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
          [estado]
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
        [idEstado, id]
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      throw new Error("Error al cambiar estado del pedido");
    }
  }
}
