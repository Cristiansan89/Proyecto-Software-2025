import { connection } from "./db.js";
import { v4 as uuidv4 } from "uuid";

export class PlanificacionServicioRecetaServicio {
  /**
   * Crear una asociación entre una planificación de receta y un servicio
   */
  static async create(id_recetaAsignada, id_servicio) {
    try {
      const id_planificacionServicioRecetaServicio = Buffer.from(
        uuidv4().replace(/-/g, ""),
        "hex"
      );

      const [result] = await connection.query(
        `INSERT INTO PlanificacionServicioRecetaServicio 
        (id_planificacionServicioRecetaServicio, id_recetaAsignada, id_servicio, estado)
        VALUES (?, ?, ?, 'Activo')`,
        [id_planificacionServicioRecetaServicio, id_recetaAsignada, id_servicio]
      );

      return result.insertId;
    } catch (error) {
      throw new Error(
        `Error al crear asociación servicio-receta: ${error.message}`
      );
    }
  }

  /**
   * Obtener todos los servicios de una receta asignada
   */
  static async getServiciosByRecetaAsignada(id_recetaAsignada) {
    try {
      const [results] = await connection.query(
        `SELECT 
          psrs.id_planificacionServicioRecetaServicio,
          psrs.id_servicio,
          s.nombre as nombreServicio,
          s.descripcion,
          psrs.estado,
          psrs.fechaAsociacion
        FROM PlanificacionServicioRecetaServicio psrs
        INNER JOIN Servicios s ON psrs.id_servicio = s.id_servicio
        WHERE psrs.id_recetaAsignada = ?
        AND psrs.estado = 'Activo'
        ORDER BY s.nombre`,
        [id_recetaAsignada]
      );

      return results;
    } catch (error) {
      throw new Error(
        `Error al obtener servicios de receta asignada: ${error.message}`
      );
    }
  }

  /**
   * Obtener las recetas asignadas para un servicio específico en una jornada
   */
  static async getRecetasByServicioAndJornada(id_servicio, id_jornada) {
    try {
      const [results] = await connection.query(
        `SELECT DISTINCT
          psr.id_recetaAsignada,
          BIN_TO_UUID(psr.id_jornada) as id_jornada,
          BIN_TO_UUID(psr.id_receta) as id_receta,
          r.nombreReceta,
          r.instrucciones,
          r.unidadSalida,
          r.estado,
          psrs.id_servicio,
          s.nombre as nombreServicio
        FROM PlanificacionServicioReceta psr
        INNER JOIN PlanificacionServicioRecetaServicio psrs ON BIN_TO_UUID(psr.id_recetaAsignada) = BIN_TO_UUID(psrs.id_recetaAsignada)
        INNER JOIN Recetas r ON psr.id_receta = r.id_receta
        INNER JOIN Servicios s ON psrs.id_servicio = s.id_servicio
        WHERE psrs.id_servicio = ?
        AND psr.id_jornada = ?
        AND psrs.estado = 'Activo'
        AND r.estado = 'Activo'
        ORDER BY r.nombreReceta`,
        [id_servicio, id_jornada]
      );

      return results;
    } catch (error) {
      throw new Error(
        `Error al obtener recetas por servicio y jornada: ${error.message}`
      );
    }
  }

  /**
   * Asignar múltiples servicios a una receta asignada
   */
  static async assignMultipleServicios(id_recetaAsignada, id_servicios = []) {
    try {
      // Primero, inactivar servicios existentes
      const [updateResult] = await connection.query(
        `UPDATE PlanificacionServicioRecetaServicio 
        SET estado = 'Inactivo'
        WHERE id_recetaAsignada = ?`,
        [id_recetaAsignada]
      );

      // Luego, insertar nuevos servicios
      if (id_servicios && id_servicios.length > 0) {
        for (const id_servicio of id_servicios) {
          await this.create(id_recetaAsignada, id_servicio);
        }
      }

      return { success: true, serviciosAsignados: id_servicios.length };
    } catch (error) {
      throw new Error(`Error al asignar múltiples servicios: ${error.message}`);
    }
  }

  /**
   * Eliminar asociación entre receta y servicio
   */
  static async removeServicio(id_recetaAsignada, id_servicio) {
    try {
      const [result] = await connection.query(
        `UPDATE PlanificacionServicioRecetaServicio 
        SET estado = 'Inactivo'
        WHERE id_recetaAsignada = ? AND id_servicio = ?`,
        [id_recetaAsignada, id_servicio]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar servicio: ${error.message}`);
    }
  }

  /**
   * Verificar si una receta ya está asociada a un servicio
   */
  static async existsAssociation(id_recetaAsignada, id_servicio) {
    try {
      const [result] = await connection.query(
        `SELECT COUNT(*) as count 
        FROM PlanificacionServicioRecetaServicio 
        WHERE id_recetaAsignada = ? AND id_servicio = ? AND estado = 'Activo'`,
        [id_recetaAsignada, id_servicio]
      );

      return result[0].count > 0;
    } catch (error) {
      throw new Error(`Error al verificar asociación: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de servicios por receta
   */
  static async getStatistics() {
    try {
      const [results] = await connection.query(
        `SELECT 
          s.id_servicio,
          s.nombre as nombreServicio,
          COUNT(psrs.id_planificacionServicioRecetaServicio) as totalRecetas
        FROM Servicios s
        LEFT JOIN PlanificacionServicioRecetaServicio psrs ON s.id_servicio = psrs.id_servicio 
          AND psrs.estado = 'Activo'
        GROUP BY s.id_servicio, s.nombre
        ORDER BY s.nombre`
      );

      return results;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

export default PlanificacionServicioRecetaServicio;
