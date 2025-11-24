import { connection } from "./db.js";
import { v4 as uuidv4 } from "uuid";

class EstadoPedidoModel {
  // Obtener todos los estados de pedido
  async getAll() {
    try {
      const query = `
                SELECT id_estado_pedido, nombre, descripcion, estado, 
                       fecha_creacion, fecha_actualizacion
                FROM EstadoPedido 
                ORDER BY nombre ASC
            `;
      const [rows] = await connection.execute(query);
      return rows;
    } catch (error) {
      console.error("Error al obtener estados de pedido:", error);
      throw error;
    }
  }

  // Obtener estado de pedido por ID
  async getById(id) {
    try {
      const query = `
                SELECT id_estado_pedido, nombre, descripcion, estado,
                       fecha_creacion, fecha_actualizacion
                FROM EstadoPedido 
                WHERE id_estado_pedido = ?
            `;
      const [rows] = await connection.execute(query, [id]);
      return rows[0];
    } catch (error) {
      console.error("Error al obtener estado de pedido por ID:", error);
      throw error;
    }
  }

  // Crear nuevo estado de pedido
  async create(estadoPedidoData) {
    try {
      const id = uuidv4();
      const { nombre, descripcion, estado = "Activo" } = estadoPedidoData;

      const query = `
                INSERT INTO EstadoPedido (
                    id_estado_pedido, nombre, descripcion, estado,
                    fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, NOW(), NOW())
            `;

      await connection.execute(query, [id, nombre, descripcion, estado]);
      return await this.getById(id);
    } catch (error) {
      console.error("Error al crear estado de pedido:", error);
      throw error;
    }
  }

  // Actualizar estado de pedido
  async update(id, estadoPedidoData) {
    try {
      const { nombre, descripcion, estado } = estadoPedidoData;

      const query = `
                UPDATE EstadoPedido 
                SET nombre = ?, descripcion = ?, estado = ?, fecha_actualizacion = NOW()
                WHERE id_estado_pedido = ?
            `;

      const [result] = await connection.execute(query, [
        nombre,
        descripcion,
        estado,
        id,
      ]);

      if (result.affectedRows === 0) {
        throw new Error("Estado de pedido no encontrado");
      }

      return await this.getById(id);
    } catch (error) {
      console.error("Error al actualizar estado de pedido:", error);
      throw error;
    }
  }

  // Eliminar estado de pedido (soft delete)
  async delete(id) {
    try {
      // Verificar si el estado está siendo usado en algún pedido
      const checkQuery = `
                SELECT COUNT(*) as count 
                FROM Pedido 
                WHERE id_estado_pedido = ?
            `;
      const [checkResult] = await connection.execute(checkQuery, [id]);

      if (checkResult[0].count > 0) {
        throw new Error(
          "No se puede eliminar el estado de pedido porque está siendo usado en pedidos existentes"
        );
      }

      const query = `
                UPDATE EstadoPedido 
                SET estado = 'Inactivo', fecha_actualizacion = NOW()
                WHERE id_estado_pedido = ?
            `;

      const [result] = await connection.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error("Estado de pedido no encontrado");
      }

      return { message: "Estado de pedido eliminado exitosamente" };
    } catch (error) {
      console.error("Error al eliminar estado de pedido:", error);
      throw error;
    }
  }

  // Verificar si existe un estado de pedido con el mismo nombre
  async existsByNombre(nombre, excludeId = null) {
    try {
      let query = `
                SELECT COUNT(*) as count 
                FROM EstadoPedido 
                WHERE LOWER(nombre) = LOWER(?) AND estado = 'Activo'
            `;
      const params = [nombre];

      if (excludeId) {
        query += " AND id_estado_pedido != ?";
        params.push(excludeId);
      }

      const [rows] = await connection.execute(query, params);
      return rows[0].count > 0;
    } catch (error) {
      console.error(
        "Error al verificar existencia de estado de pedido:",
        error
      );
      throw error;
    }
  }
}

export default EstadoPedidoModel;
