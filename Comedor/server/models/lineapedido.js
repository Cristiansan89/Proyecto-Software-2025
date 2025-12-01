import { connection } from "./db.js";

export class LineaPedidoModel {
  static async getAll() {
    try {
      const [lineas] = await connection.query(
        `SELECT 
                    dp.id_detallePedido,
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    dp.id_insumo,
                    CONCAT('INS-', LPAD(dp.id_insumo, 4, '0')) as codigoInsumo,
                    i.nombreInsumo as nombreInsumo,
                    i.unidadMedida,
                    dp.cantidadSolicitada as cantidad,
                    pr.razonSocial as nombreProveedor
                 FROM DetallePedido dp
                 JOIN Insumos i ON dp.id_insumo = i.id_insumo
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 ORDER BY dp.id_pedido;`
      );
      return lineas;
    } catch (error) {
      console.error("Error al obtener detalles de pedidos:", error);
      throw new Error("Error al obtener detalles de pedidos");
    }
  }

  static async getById({ id }) {
    try {
      const [lineas] = await connection.query(
        `SELECT 
                    dp.id_detallePedido,
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    dp.id_insumo,
                    CONCAT('INS-', LPAD(dp.id_insumo, 4, '0')) as codigoInsumo,
                    i.nombreInsumo as nombreInsumo,
                    i.unidadMedida,
                    dp.cantidadSolicitada as cantidad,
                    pr.razonSocial as nombreProveedor
                 FROM DetallePedido dp
                 JOIN Insumos i ON dp.id_insumo = i.id_insumo
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 WHERE dp.id_detallePedido = ?;`,
        [id]
      );
      if (lineas.length === 0) return null;
      return lineas[0];
    } catch (error) {
      console.error("Error al obtener detalle de pedido:", error);
      throw new Error("Error al obtener detalle de pedido");
    }
  }

  static async create({ input }) {
    const { id_pedido, id_proveedor, id_insumo, cantidadSolicitada } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO DetallePedido (
                    id_pedido, 
                    id_proveedor,
                    id_insumo, 
                    cantidadSolicitada
                ) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?);`,
        [id_pedido, id_proveedor, id_insumo, cantidadSolicitada]
      );

      const newId = result.insertId;

      return this.getById({ id: newId });
    } catch (error) {
      console.error("Error al crear el detalle de pedido:", error);
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error(
          "Este insumo ya existe en el pedido para este proveedor"
        );
      }
      throw new Error("Error al crear el detalle de pedido");
    }
  }

  static async delete({ id }) {
    try {
      await connection.query(
        `DELETE FROM DetallePedido WHERE id_detallePedido = ?;`,
        [id]
      );
      return true;
    } catch (error) {
      console.error("Error al eliminar detalle de pedido:", error);
      return false;
    }
  }

  static async update({ id, input }) {
    const { cantidadSolicitada } = input;

    try {
      const updates = [];
      const values = [];

      if (cantidadSolicitada !== undefined) {
        updates.push("cantidadSolicitada = ?");
        values.push(cantidadSolicitada);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      await connection.query(
        `UPDATE DetallePedido
                 SET ${updates.join(", ")}
                 WHERE id_detallePedido = ?;`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al actualizar el detalle de pedido:", error);
      throw new Error("Error al actualizar el detalle de pedido");
    }
  }

  static async getByPedido({ id_pedido }) {
    try {
      console.log(`🔍 Buscando detalles para pedido: ${id_pedido}`);

      const [lineas] = await connection.query(
        `SELECT 
                    dp.id_detallePedido,
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    dp.id_insumo,
                    CONCAT('INS-', LPAD(dp.id_insumo, 4, '0')) as codigoInsumo,
                    i.nombreInsumo as nombreInsumo,
                    i.unidadMedida,
                    dp.cantidadSolicitada as cantidad,
                    pr.razonSocial as nombreProveedor
                 FROM DetallePedido dp
                 JOIN Insumos i ON dp.id_insumo = i.id_insumo
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 WHERE dp.id_pedido = UUID_TO_BIN(?)
                 ORDER BY pr.razonSocial, i.nombreInsumo;`,
        [id_pedido]
      );

      console.log(
        `📊 Encontradas ${lineas.length} líneas para el pedido ${id_pedido}`
      );

      return lineas;
    } catch (error) {
      console.error("Error al obtener detalles por pedido:", error);
      throw new Error("Error al obtener detalles por pedido");
    }
  }

  // Método para obtener detalles por proveedor
  static async getByProveedor({ id_proveedor }) {
    try {
      const [lineas] = await connection.query(
        `SELECT 
                    dp.id_detallePedido,
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    dp.id_insumo,
                    i.nombreInsumo as nombreInsumo,
                    i.unidadMedida,
                    dp.cantidadSolicitada,
                    pr.razonSocial as nombreProveedor
                 FROM DetallePedido dp
                 JOIN Insumos i ON dp.id_insumo = i.id_insumo
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 WHERE dp.id_proveedor = UUID_TO_BIN(?)
                 ORDER BY dp.id_pedido, i.nombreInsumo;`,
        [id_proveedor]
      );
      return lineas;
    } catch (error) {
      console.error("Error al obtener detalles por proveedor:", error);
      throw new Error("Error al obtener detalles por proveedor");
    }
  }

  // Método para calcular el total de un pedido por proveedor
  static async getTotalPedidoProveedor({ id_pedido, id_proveedor }) {
    try {
      const [total] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    COUNT(dp.id_detallePedido) as totalItems,
                    SUM(dp.cantidadSolicitada * COALESCE(pi.precio, 0)) as montoTotal
                 FROM DetallePedido dp
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 LEFT JOIN ProveedorInsumo pi ON dp.id_proveedor = pi.id_proveedor AND dp.id_insumo = pi.id_insumo
                 WHERE dp.id_pedido = UUID_TO_BIN(?) AND dp.id_proveedor = UUID_TO_BIN(?)
                 GROUP BY dp.id_pedido, dp.id_proveedor, pr.razonSocial;`,
        [id_pedido, id_proveedor]
      );

      if (total.length === 0) return null;
      return total[0];
    } catch (error) {
      console.error("Error al calcular total del pedido por proveedor:", error);
      throw new Error("Error al calcular total del pedido por proveedor");
    }
  }

  // Método para obtener resumen de un pedido agrupado por proveedor
  static async getResumenPedido({ id_pedido }) {
    try {
      const [resumen] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    COUNT(dp.id_detallePedido) as totalItems,
                    SUM(dp.cantidadSolicitada * COALESCE(pi.precio, 0)) as montoTotal
                 FROM DetallePedido dp
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 LEFT JOIN ProveedorInsumo pi ON dp.id_proveedor = pi.id_proveedor AND dp.id_insumo = pi.id_insumo
                 WHERE dp.id_pedido = UUID_TO_BIN(?)
                 GROUP BY dp.id_proveedor, pr.razonSocial
                 ORDER BY pr.razonSocial;`,
        [id_pedido]
      );
      return resumen;
    } catch (error) {
      console.error("Error al obtener resumen del pedido:", error);
      throw new Error("Error al obtener resumen del pedido");
    }
  }
}
