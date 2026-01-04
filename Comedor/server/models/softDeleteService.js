/**
 * Soft Delete Service
 *
 * Proporciona métodos para implementar eliminación lógica (soft delete)
 * Los registros se marcan como inactivos en lugar de ser eliminados físicamente
 */

import { connection } from "./db.js";

export class SoftDeleteService {
  /**
   * Marca un registro como eliminado (soft delete)
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {string} idColumn - Nombre de la columna ID
   * @param {*} idValue - Valor del ID a eliminar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<boolean>}
   */
  static async softDelete(tableName, idColumn, idValue, options = {}) {
    const {
      useInactivo = true, // Si true, usa 'Inactivo', si false usa null en estado
      addDeletedAt = true, // Si true, agrega timestamp de eliminación
    } = options;

    try {
      const columns = [];
      const values = [];

      // Marcar como inactivo
      if (useInactivo) {
        columns.push("estado = ?");
        values.push("Inactivo");
      }

      // Agregar fecha de eliminación si la tabla la soporta
      // Solo agregar si la tabla tiene la columna
      if (addDeletedAt) {
        columns.push("fechaEliminacion = NOW()");
      }

      // Agregar fecha de modificación solo si existe la columna
      columns.push("fechaModificacion = NOW()");

      // Construcción segura de la query
      const updateClause = columns.join(", ");
      const query = `UPDATE ${tableName} SET ${updateClause} WHERE ${idColumn} = ?`;
      values.push(idValue);

      const [result] = await connection.query(query, values);

      return result.affectedRows > 0;
    } catch (error) {
      // Si hay error por columna desconocida, intentar sin las columnas de fecha
      if (error.code === "ER_BAD_FIELD_ERROR") {
        console.warn(
          `Columna no encontrada en ${tableName}, intentando soft delete sin fechas...`
        );
        try {
          const query = `UPDATE ${tableName} SET estado = ? WHERE ${idColumn} = ?`;
          const [result] = await connection.query(query, ["Inactivo", idValue]);
          return result.affectedRows > 0;
        } catch (retryError) {
          console.error(
            `Error en softDelete (${tableName}) - reintento:`,
            retryError
          );
          return false;
        }
      }
      console.error(`Error en softDelete (${tableName}):`, error);
      return false;
    }
  }

  /**
   * Restaura un registro eliminado lógicamente
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {string} idColumn - Nombre de la columna ID
   * @param {*} idValue - Valor del ID a restaurar
   * @returns {Promise<boolean>}
   */
  static async undelete(tableName, idColumn, idValue) {
    try {
      const query = `UPDATE ${tableName} 
                     SET estado = ?, 
                         fechaEliminacion = NULL,
                         fechaModificacion = NOW() 
                     WHERE ${idColumn} = ? AND estado = 'Inactivo'`;

      const [result] = await connection.query(query, ["Activo", idValue]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error en undelete (${tableName}):`, error);
      return false;
    }
  }

  /**
   * Obtiene registros eliminados lógicamente
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {string} idColumn - Nombre de la columna ID (para validar)
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>}
   */
  static async getDeleted(tableName, idColumn, filters = {}) {
    try {
      let whereClause = 'WHERE estado = "Inactivo"';
      const values = [];

      // Agregar filtros adicionales si existen
      if (Object.keys(filters).length > 0) {
        for (const [key, value] of Object.entries(filters)) {
          whereClause += ` AND ${key} = ?`;
          values.push(value);
        }
      }

      const query = `SELECT * FROM ${tableName} ${whereClause} ORDER BY fechaEliminacion DESC`;
      const [rows] = await connection.query(query, values);

      return rows;
    } catch (error) {
      console.error(`Error en getDeleted (${tableName}):`, error);
      return [];
    }
  }

  /**
   * Obtiene solo registros activos (excluyendo eliminados)
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {string} selectClause - Columnas a seleccionar
   * @param {string} whereClause - Condiciones adicionales (sin WHERE)
   * @param {Array} values - Valores para la query preparada
   * @returns {Promise<Array>}
   */
  static async getActive(
    tableName,
    selectClause = "*",
    whereClause = "",
    values = []
  ) {
    try {
      let query = `SELECT ${selectClause} FROM ${tableName} WHERE estado = 'Activo'`;

      if (whereClause) {
        query += ` AND ${whereClause}`;
      }

      const [rows] = await connection.query(query, values);
      return rows;
    } catch (error) {
      console.error(`Error en getActive (${tableName}):`, error);
      return [];
    }
  }

  /**
   * Obtiene registros activos con paginación
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {number} page - Número de página (comienza en 1)
   * @param {number} pageSize - Registros por página
   * @param {string} selectClause - Columnas a seleccionar
   * @param {string} orderBy - Clausula ORDER BY
   * @returns {Promise<{data: Array, total: number, page: number, pages: number}>}
   */
  static async getActivePaginated(
    tableName,
    page = 1,
    pageSize = 10,
    selectClause = "*",
    orderBy = ""
  ) {
    try {
      const offset = (page - 1) * pageSize;

      // Obtener total de registros activos
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM ${tableName} WHERE estado = 'Activo'`
      );
      const total = countResult[0].total;
      const pages = Math.ceil(total / pageSize);

      // Obtener datos paginados
      let query = `SELECT ${selectClause} FROM ${tableName} WHERE estado = 'Activo'`;
      if (orderBy) {
        query += ` ${orderBy}`;
      }
      query += ` LIMIT ? OFFSET ?`;

      const [data] = await connection.query(query, [pageSize, offset]);

      return {
        data,
        total,
        page,
        pages,
        pageSize,
      };
    } catch (error) {
      console.error(`Error en getActivePaginated (${tableName}):`, error);
      return {
        data: [],
        total: 0,
        page,
        pages: 0,
        pageSize,
      };
    }
  }

  /**
   * Verifica si un registro está eliminado
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {string} idColumn - Nombre de la columna ID
   * @param {*} idValue - Valor del ID
   * @returns {Promise<boolean>}
   */
  static async isDeleted(tableName, idColumn, idValue) {
    try {
      const query = `SELECT estado FROM ${tableName} WHERE ${idColumn} = ?`;
      const [result] = await connection.query(query, [idValue]);

      if (result.length === 0) return null; // No existe
      return result[0].estado === "Inactivo";
    } catch (error) {
      console.error(`Error en isDeleted (${tableName}):`, error);
      return null;
    }
  }

  /**
   * Obtiene información de eliminación de un registro
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {string} idColumn - Nombre de la columna ID
   * @param {*} idValue - Valor del ID
   * @returns {Promise<Object|null>}
   */
  static async getDeleteInfo(tableName, idColumn, idValue) {
    try {
      const query = `SELECT 
                        ${idColumn} as id,
                        estado,
                        fechaEliminacion,
                        fechaModificacion
                     FROM ${tableName} 
                     WHERE ${idColumn} = ?`;

      const [result] = await connection.query(query, [idValue]);

      if (result.length === 0) return null;
      return result[0];
    } catch (error) {
      console.error(`Error en getDeleteInfo (${tableName}):`, error);
      return null;
    }
  }

  /**
   * Cuenta registros activos
   *
   * @param {string} tableName - Nombre de la tabla
   * @returns {Promise<number>}
   */
  static async countActive(tableName) {
    try {
      const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE estado = 'Activo'`;
      const [result] = await connection.query(query);

      return result[0].count;
    } catch (error) {
      console.error(`Error en countActive (${tableName}):`, error);
      return 0;
    }
  }

  /**
   * Cuenta registros inactivos (eliminados)
   *
   * @param {string} tableName - Nombre de la tabla
   * @returns {Promise<number>}
   */
  static async countInactive(tableName) {
    try {
      const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE estado = 'Inactivo'`;
      const [result] = await connection.query(query);

      return result[0].count;
    } catch (error) {
      console.error(`Error en countInactive (${tableName}):`, error);
      return 0;
    }
  }

  /**
   * Obtiene estadísticas de soft delete
   *
   * @param {string} tableName - Nombre de la tabla
   * @returns {Promise<{activos: number, inactivos: number, total: number, porcentajeInactivos: number}>}
   */
  static async getStats(tableName) {
    try {
      const query = `SELECT 
                        estado, 
                        COUNT(*) as count 
                     FROM ${tableName} 
                     GROUP BY estado`;

      const [result] = await connection.query(query);

      let activos = 0;
      let inactivos = 0;

      result.forEach((row) => {
        if (row.estado === "Activo") activos = row.count;
        if (row.estado === "Inactivo") inactivos = row.count;
      });

      const total = activos + inactivos;
      const porcentajeInactivos =
        total > 0 ? ((inactivos / total) * 100).toFixed(2) : 0;

      return {
        activos,
        inactivos,
        total,
        porcentajeInactivos: parseFloat(porcentajeInactivos),
      };
    } catch (error) {
      console.error(`Error en getStats (${tableName}):`, error);
      return { activos: 0, inactivos: 0, total: 0, porcentajeInactivos: 0 };
    }
  }

  /**
   * Elimina permanentemente registros marcados como inactivos desde hace X días
   * ⚠️ FUNCIÓN DESTRUCTIVA - Usar con cuidado
   *
   * @param {string} tableName - Nombre de la tabla
   * @param {number} diasAntiguedad - Días desde eliminación lógica para deletrear físicamente
   * @returns {Promise<number>} - Cantidad de registros eliminados permanentemente
   */
  static async hardDeleteOldInactive(tableName, diasAntiguedad = 180) {
    try {
      const query = `DELETE FROM ${tableName} 
                     WHERE estado = 'Inactivo' 
                     AND fechaEliminacion IS NOT NULL
                     AND DATE_SUB(NOW(), INTERVAL ? DAY) >= DATE(fechaEliminacion)`;

      const [result] = await connection.query(query, [diasAntiguedad]);

      console.log(
        `⚠️ ${result.affectedRows} registros eliminados permanentemente de ${tableName}`
      );
      return result.affectedRows;
    } catch (error) {
      console.error(`Error en hardDeleteOldInactive (${tableName}):`, error);
      return 0;
    }
  }
}

export default SoftDeleteService;
