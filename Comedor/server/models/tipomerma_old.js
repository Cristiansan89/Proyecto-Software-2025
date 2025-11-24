import { connection } from "./db.js";
import { v4 as uuidv4 } from "uuid";

class TipoMermaModel {
  // Obtener todos los tipos de merma
  async getAll() {
    try {
      const query = `
                SELECT id_tipo_merma, nombre, descripcion, estado, 
                       fecha_creacion, fecha_actualizacion
                FROM TipoMerma 
                ORDER BY nombre ASC
            `;
      const [rows] = await connection.execute(query);
      return rows;
    } catch (error) {
      console.error("Error al obtener tipos de merma:", error);
      throw error;
    }
  }

  // Obtener tipo de merma por ID
  async getById(id) {
    try {
      const query = `
                SELECT id_tipo_merma, nombre, descripcion, estado,
                       fecha_creacion, fecha_actualizacion
                FROM TipoMerma 
                WHERE id_tipo_merma = ?
            `;
      const [rows] = await connection.execute(query, [id]);
      return rows[0];
    } catch (error) {
      console.error("Error al obtener tipo de merma por ID:", error);
      throw error;
    }
  }

  // Crear nuevo tipo de merma
  async create(tipoMermaData) {
    try {
      const id = uuidv4();
      const { nombre, descripcion, estado = "Activo" } = tipoMermaData;

      const query = `
                INSERT INTO TipoMerma (
                    id_tipo_merma, nombre, descripcion, estado,
                    fecha_creacion, fecha_actualizacion
                ) VALUES (?, ?, ?, ?, NOW(), NOW())
            `;

      await connection.execute(query, [id, nombre, descripcion, estado]);
      return await this.getById(id);
    } catch (error) {
      console.error("Error al crear tipo de merma:", error);
      throw error;
    }
  }

  // Actualizar tipo de merma
  async update(id, tipoMermaData) {
    try {
      const { nombre, descripcion, estado } = tipoMermaData;

      const query = `
                UPDATE TipoMerma 
                SET nombre = ?, descripcion = ?, estado = ?, fecha_actualizacion = NOW()
                WHERE id_tipo_merma = ?
            `;

      const [result] = await connection.execute(query, [
        nombre,
        descripcion,
        estado,
        id,
      ]);

      if (result.affectedRows === 0) {
        throw new Error("Tipo de merma no encontrado");
      }

      return await this.getById(id);
    } catch (error) {
      console.error("Error al actualizar tipo de merma:", error);
      throw error;
    }
  }

  // Eliminar tipo de merma (soft delete)
  async delete(id) {
    try {
      // Verificar si el tipo está siendo usado en algún movimiento de inventario
      const checkQuery = `
                SELECT COUNT(*) as count 
                FROM MovimientoInventario 
                WHERE id_tipo_merma = ?
            `;
      const [checkResult] = await connection.execute(checkQuery, [id]);

      if (checkResult[0].count > 0) {
        throw new Error(
          "No se puede eliminar el tipo de merma porque está siendo usado en movimientos de inventario"
        );
      }

      const query = `
                UPDATE TipoMerma 
                SET estado = 'Inactivo', fecha_actualizacion = NOW()
                WHERE id_tipo_merma = ?
            `;

      const [result] = await connection.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error("Tipo de merma no encontrado");
      }

      return { message: "Tipo de merma eliminado exitosamente" };
    } catch (error) {
      console.error("Error al eliminar tipo de merma:", error);
      throw error;
    }
  }

  // Verificar si existe un tipo de merma con el mismo nombre
  async existsByNombre(nombre, excludeId = null) {
    try {
      let query = `
                SELECT COUNT(*) as count 
                FROM TipoMerma 
                WHERE LOWER(nombre) = LOWER(?) AND estado = 'Activo'
            `;
      const params = [nombre];

      if (excludeId) {
        query += " AND id_tipo_merma != ?";
        params.push(excludeId);
      }

      const [rows] = await connection.execute(query, params);
      return rows[0].count > 0;
    } catch (error) {
      console.error("Error al verificar existencia de tipo de merma:", error);
      throw error;
    }
  }

  // Obtener tipos de merma activos (para selects)
  async getActivos() {
    try {
      const query = `
                SELECT id_tipo_merma, nombre, descripcion
                FROM TipoMerma 
                WHERE estado = 'Activo'
                ORDER BY nombre ASC
            `;
      const [rows] = await connection.execute(query);
      return rows;
    } catch (error) {
      console.error("Error al obtener tipos de merma activos:", error);
      throw error;
    }
  }
}

export default TipoMermaModel;
