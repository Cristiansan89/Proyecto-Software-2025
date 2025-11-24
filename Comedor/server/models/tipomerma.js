import { connection } from "./db.js";

class TipoMermaModel {
  // Obtener todos los tipos de merma
  async getAll() {
    try {
      const query = `
                SELECT id_tipoMerma, nombre, descripcion, estado
                FROM TiposMermas 
                ORDER BY nombre ASC
            `;
      const [rows] = await connection.execute(query);
      return rows.map((row) => ({
        id_tipo_merma: row.id_tipoMerma,
        nombre: row.nombre,
        descripcion: row.descripcion,
        estado: row.estado,
      }));
    } catch (error) {
      console.error("Error al obtener tipos de merma:", error);
      throw error;
    }
  }

  // Obtener tipo de merma por ID
  async getById(id) {
    try {
      const query = `
                SELECT id_tipoMerma, nombre, descripcion, estado
                FROM TiposMermas 
                WHERE id_tipoMerma = ?
            `;
      const [rows] = await connection.execute(query, [id]);
      if (rows[0]) {
        const row = rows[0];
        return {
          id_tipo_merma: row.id_tipoMerma,
          nombre: row.nombre,
          descripcion: row.descripcion,
          estado: row.estado,
        };
      }
      return null;
    } catch (error) {
      console.error("Error al obtener tipo de merma por ID:", error);
      throw error;
    }
  }

  // Crear nuevo tipo de merma
  async create(tipoMermaData) {
    try {
      const { nombre, descripcion, estado = "Activo" } = tipoMermaData;

      const query = `
                INSERT INTO TiposMermas (nombre, descripcion, estado) 
                VALUES (?, ?, ?)
            `;

      const [result] = await connection.execute(query, [
        nombre,
        descripcion || "",
        estado,
      ]);
      return await this.getById(result.insertId);
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
                UPDATE TiposMermas 
                SET nombre = ?, descripcion = ?, estado = ?
                WHERE id_tipoMerma = ?
            `;

      const [result] = await connection.execute(query, [
        nombre,
        descripcion || "",
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

  // Eliminar tipo de merma (cambiar estado a Inactivo)
  async delete(id) {
    try {
      // Verificar si el tipo está siendo usado en algún movimiento de inventario
      const checkQuery = `
                SELECT COUNT(*) as count 
                FROM MovimientosInventarios 
                WHERE id_tipoMerma = ?
            `;
      const [checkResult] = await connection.execute(checkQuery, [id]);

      if (checkResult[0].count > 0) {
        // En lugar de eliminar, cambiar a inactivo
        const query = `
                    UPDATE TiposMermas 
                    SET estado = 'Inactivo'
                    WHERE id_tipoMerma = ?
                `;

        const [result] = await connection.execute(query, [id]);

        if (result.affectedRows === 0) {
          throw new Error("Tipo de merma no encontrado");
        }

        return { message: "Tipo de merma marcado como inactivo exitosamente" };
      } else {
        // Si no está siendo usado, se puede eliminar
        const query = `
                    DELETE FROM TiposMermas 
                    WHERE id_tipoMerma = ?
                `;

        const [result] = await connection.execute(query, [id]);

        if (result.affectedRows === 0) {
          throw new Error("Tipo de merma no encontrado");
        }

        return { message: "Tipo de merma eliminado exitosamente" };
      }
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
                FROM TiposMermas 
                WHERE LOWER(nombre) = LOWER(?) AND estado = 'Activo'
            `;
      const params = [nombre];

      if (excludeId) {
        query += " AND id_tipoMerma != ?";
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
                SELECT id_tipoMerma, nombre, descripcion
                FROM TiposMermas 
                WHERE estado = 'Activo'
                ORDER BY nombre ASC
            `;
      const [rows] = await connection.execute(query);
      return rows.map((row) => ({
        id_tipo_merma: row.id_tipoMerma,
        nombre: row.nombre,
        descripcion: row.descripcion,
      }));
    } catch (error) {
      console.error("Error al obtener tipos de merma activos:", error);
      throw error;
    }
  }
}

export default TipoMermaModel;
