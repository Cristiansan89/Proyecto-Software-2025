import { connection } from "./db.js";

export class RecetaModel {
  static async getAll() {
    try {
      const [recetas] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.fechaAlta,
                    r.estado
                 FROM Recetas r
                 ORDER BY r.nombreReceta;`
      );
      return recetas;
    } catch (error) {
      console.error("Error al obtener recetas:", error);
      throw new Error("Error al obtener recetas");
    }
  }

  static async getById({ id }) {
    try {
      const [recetas] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.fechaAlta,
                    r.estado
                 FROM Recetas r
                 WHERE r.id_receta = UUID_TO_BIN(?);`,
        [id]
      );
      if (recetas.length === 0) return null;
      return recetas[0];
    } catch (error) {
      console.error("Error al obtener receta:", error);
      throw new Error("Error al obtener receta");
    }
  }

  static async create({ input }) {
    const {
      nombreReceta,
      instrucciones,
      unidadSalida = "Porcion",
      estado = "Activo",
    } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO Recetas (
                    nombreReceta,
                    instrucciones,
                    unidadSalida,
                    estado
                ) VALUES (?, ?, ?, ?);`,
        [nombreReceta, instrucciones, unidadSalida, estado]
      );

      const [newReceta] = await connection.query(
        `SELECT BIN_TO_UUID(id_receta) as id_receta 
                 FROM Recetas 
                 WHERE nombreReceta = ?
                 ORDER BY fechaAlta DESC LIMIT 1;`,
        [nombreReceta]
      );

      return this.getById({ id: newReceta[0].id_receta });
    } catch (error) {
      console.error("Error al crear la receta:", error);
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe una receta con este nombre");
      }
      throw new Error("Error al crear la receta");
    }
  }

  static async delete({ id }) {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // Eliminar primero los items de la receta
      await conn.query(
        `DELETE FROM ItemsRecetas WHERE id_receta = UUID_TO_BIN(?); `,
        [id]
      );

      // Eliminar asignaciones en planificaciones
      await conn.query(
        `DELETE FROM PlanificacionServicioReceta WHERE id_receta = UUID_TO_BIN(?); `,
        [id]
      );

      // Eliminar la receta
      await conn.query(
        `DELETE FROM Recetas WHERE id_receta = UUID_TO_BIN(?); `,
        [id]
      );

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Error al eliminar receta:", error);
      return false;
    } finally {
      conn.release();
    }
  }

  static async hasActiveRelations({ id }) {
    try {
      // Verificar si la receta está asociada a una PlanificacionMenu activa
      // Relación: Receta <- PlanificacionServicioReceta <- JornadaPlanificada -> PlanificacionMenus
      const [result] = await connection.query(
        `SELECT COUNT(DISTINCT pm.id_planificacion) as count
         FROM PlanificacionMenus pm
         INNER JOIN JornadaPlanificada jp ON pm.id_planificacion = jp.id_planificacion
         INNER JOIN PlanificacionServicioReceta psr ON jp.id_jornada = psr.id_jornada
         WHERE psr.id_receta = UUID_TO_BIN(?) AND pm.estado = 'Activo'`,
        [id]
      );

      return result.length > 0 && result[0].count > 0;
    } catch (error) {
      console.error("Error al verificar relaciones activas:", error);
      return false;
    }
  }

  static async update({
    id,
    nombreReceta,
    instrucciones,
    unidadSalida,
    estado,
  }) {
    try {
      await connection.query(
        `UPDATE Recetas
                 SET nombreReceta = ?, instrucciones = ?, unidadSalida = ?, estado = ?
                WHERE id_receta = UUID_TO_BIN(?); `,
        [nombreReceta, instrucciones, unidadSalida, estado, id]
      );
      return true;
    } catch (error) {
      console.error("Error al actualizar receta:", error);
      return false;
    }
  }

  static async updateEstado({ id, estado }) {
    try {
      await connection.query(
        `UPDATE Recetas
                 SET estado = ?
                WHERE id_receta = UUID_TO_BIN(?); `,
        [estado, id]
      );
      return true;
    } catch (error) {
      console.error("Error al actualizar estado de receta:", error);
      return false;
    }
  }

  // Métodos para gestión de ingredientes de recetas
  static async getRecetaWithInsumos({ id }) {
    try {
      const [recetaRows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.estado,
                    r.fechaAlta
                 FROM Recetas r
                 WHERE r.id_receta = UUID_TO_BIN(?);`,
        [id]
      );

      if (recetaRows.length === 0) return null;

      const receta = recetaRows[0];

      const [insumosRows] = await connection.query(
        `SELECT 
                    ir.id_itemReceta as id_item,
                    BIN_TO_UUID(ir.id_receta) as id_receta,
                    ir.id_insumo,
                    i.nombreInsumo,
                    i.unidadMedida,
                    ir.cantidadPorPorcion,
                    ir.unidadPorPorcion
                 FROM ItemsRecetas ir
                 INNER JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 WHERE ir.id_receta = UUID_TO_BIN(?);`,
        [id]
      );

      receta.insumos = insumosRows;
      return receta;
    } catch (error) {
      console.error("Error al obtener receta con insumos:", error);
      return null;
    }
  }

  static async getRecetasActivas() {
    try {
      const [rows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.nombreReceta,
                    r.unidadSalida,
                    r.estado,
                    r.fechaAlta,
                    GROUP_CONCAT(DISTINCT rs.id_servicio) as servicios
                 FROM Recetas r
                 LEFT JOIN RecetaServicio rs ON r.id_receta = rs.id_receta
                 WHERE r.estado = 'Activo'
                 GROUP BY r.id_receta, r.nombreReceta, r.unidadSalida, r.estado, r.fechaAlta
                 ORDER BY r.nombreReceta;`
      );

      // Procesar los servicios para convertir la cadena en array de números
      const processedRows = rows.map((row) => ({
        ...row,
        servicios: row.servicios
          ? row.servicios.split(",").map((id) => parseInt(id))
          : [],
      }));

      return processedRows;
    } catch (error) {
      console.error("Error al obtener recetas activas:", error);
      return [];
    }
  }

  // Método para buscar recetas por nombre
  static async searchByNombre({ nombre }) {
    try {
      const [rows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.estado,
                    r.fechaAlta
                 FROM Recetas r
                 WHERE r.nombreReceta LIKE ?
                 ORDER BY r.nombreReceta;`,
        [`%${nombre}%`]
      );
      return rows;
    } catch (error) {
      console.error("Error al buscar recetas por nombre:", error);
      return [];
    }
  }

  // Método para obtener recetas con el conteo de insumos
  static async getAllWithInsumoCount() {
    try {
      const [rows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.estado,
                    r.fechaAlta,
                    COUNT(ir.id_itemReceta) as totalInsumos
                 FROM Recetas r
                 LEFT JOIN ItemsRecetas ir ON r.id_receta = ir.id_receta
                 GROUP BY r.id_receta, r.nombreReceta, r.instrucciones, r.unidadSalida, r.estado, r.fechaAlta
                 ORDER BY r.nombreReceta;`
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener recetas con conteo de insumos:", error);
      return [];
    }
  }

  // Método para agregar insumo a una receta
  static async addInsumo({
    id_receta,
    id_insumo,
    cantidadPorPorcion,
    unidadPorPorcion,
  }) {
    try {
      const [result] = await connection.query(
        `INSERT INTO ItemsRecetas (id_receta, id_insumo, cantidadPorPorcion, unidadPorPorcion)
                 VALUES (UUID_TO_BIN(?), ?, ?, ?);`,
        [id_receta, id_insumo, cantidadPorPorcion, unidadPorPorcion]
      );

      return {
        id_item: result.insertId,
        success: true,
        message: "Insumo agregado exitosamente a la receta",
      };
    } catch (error) {
      console.error("Error al agregar insumo a receta:", error);
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Este insumo ya está agregado a la receta");
      }
      throw new Error("Error al agregar insumo a la receta");
    }
  }

  // Método para actualizar insumo en una receta
  static async updateInsumo({ id_item, cantidadPorPorcion, unidadPorPorcion }) {
    try {
      await connection.query(
        `UPDATE ItemsRecetas 
                 SET cantidadPorPorcion = ?, unidadPorPorcion = ?
                 WHERE id_itemReceta = ?;`,
        [cantidadPorPorcion, unidadPorPorcion, id_item]
      );

      return { success: true, message: "Insumo actualizado exitosamente" };
    } catch (error) {
      console.error("Error al actualizar insumo en receta:", error);
      throw new Error("Error al actualizar insumo en la receta");
    }
  }

  // Método para remover insumo de una receta
  static async removeInsumo({ id_item }) {
    try {
      const [result] = await connection.query(
        `DELETE FROM ItemsRecetas WHERE id_itemReceta = ?;`,
        [id_item]
      );

      if (result.affectedRows === 0) {
        return { success: false, message: "Insumo no encontrado" };
      }

      return {
        success: true,
        message: "Insumo removido exitosamente de la receta",
      };
    } catch (error) {
      console.error("Error al remover insumo de receta:", error);
      throw new Error("Error al remover insumo de la receta");
    }
  }
}
