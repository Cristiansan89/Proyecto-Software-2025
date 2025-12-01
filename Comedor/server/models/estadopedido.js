import { connection } from "./db.js";

class EstadoPedidoModel {
  // Obtener todos los estados de pedido
  async getAll() {
    try {
      const query = `
                SELECT id_estadoPedido, nombreEstado as nombre, descripcion
                FROM EstadoPedido 
                ORDER BY nombreEstado ASC
            `;
      const [rows] = await connection.execute(query);
      return rows.map((row) => ({
        id_estadoPedido: row.id_estadoPedido,
        nombreEstado: row.nombre,
        descripcion: row.descripcion,
        estado: "Activo", // Las tablas existentes no tienen campo estado
      }));
    } catch (error) {
      console.error("Error al obtener estados de pedido:", error);
      throw error;
    }
  }

  // Obtener estado de pedido por ID
  async getById(id) {
    try {
      const query = `
                SELECT id_estadoPedido, nombreEstado as nombre, descripcion
                FROM EstadoPedido 
                WHERE id_estadoPedido = ?
            `;
      const [rows] = await connection.execute(query, [id]);
      if (rows[0]) {
        const row = rows[0];
        return {
          id_estadoPedido: row.id_estadoPedido,
          nombreEstado: row.nombre,
          descripcion: row.descripcion,
          estado: "Activo",
        };
      }
      return null;
    } catch (error) {
      console.error("Error al obtener estado de pedido por ID:", error);
      throw error;
    }
  }

  // Crear nuevo estado de pedido
  async create(estadoPedidoData) {
    try {
      const { nombre, descripcion } = estadoPedidoData;

      const query = `
                INSERT INTO EstadoPedido (nombreEstado, descripcion) 
                VALUES (?, ?)
            `;

      const [result] = await connection.execute(query, [
        nombre,
        descripcion || null,
      ]);
      return await this.getById(result.insertId);
    } catch (error) {
      console.error("Error al crear estado de pedido:", error);
      throw error;
    }
  }

  // Actualizar estado de pedido
  async update(id, estadoPedidoData) {
    try {
      const { nombre, descripcion } = estadoPedidoData;

      const query = `
                UPDATE EstadoPedido 
                SET nombreEstado = ?, descripcion = ?
                WHERE id_estadoPedido = ?
            `;

      const [result] = await connection.execute(query, [
        nombre,
        descripcion || null,
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

  // Eliminar estado de pedido
  async delete(id) {
    try {
      // Verificar si el estado está siendo usado en algún pedido
      const checkQuery = `
                SELECT COUNT(*) as count 
                FROM Pedidos 
                WHERE id_estadoPedido = ?
            `;
      const [checkResult] = await connection.execute(checkQuery, [id]);

      if (checkResult[0].count > 0) {
        throw new Error(
          "No se puede eliminar el estado de pedido porque está siendo usado en pedidos existentes"
        );
      }

      const query = `
                DELETE FROM EstadoPedido 
                WHERE id_estadoPedido = ?
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
                WHERE LOWER(nombreEstado) = LOWER(?)
            `;
      const params = [nombre];

      if (excludeId) {
        query += " AND id_estadoPedido != ?";
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
