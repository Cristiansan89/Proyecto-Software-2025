import { connection } from "./db.js";

export class ConfiguracionServicioAutomaticoModel {
  static async getAll() {
    const [configuraciones] = await connection.query(`
      SELECT 
        c.id_configuracion,
        c.id_servicio,
        c.horaInicio,
        c.horaFin,
        c.procesarAutomaticamente,
        c.descripcion,
        s.nombre as nombreServicio,
        DATE_FORMAT(c.fechaCreacion, '%Y-%m-%d %H:%i:%s') as fechaCreacion,
        DATE_FORMAT(c.fechaActualizacion, '%Y-%m-%d %H:%i:%s') as fechaActualizacion
      FROM ConfiguracionServiciosAutomaticos c
      JOIN Servicios s ON c.id_servicio = s.id_servicio
      ORDER BY c.horaInicio ASC
    `);
    return configuraciones;
  }

  static async getById({ id }) {
    const [configuraciones] = await connection.query(
      `
      SELECT 
        c.id_configuracion,
        c.id_servicio,
        c.horaInicio,
        c.horaFin,
        c.procesarAutomaticamente,
        c.descripcion,
        s.nombre as nombreServicio,
        DATE_FORMAT(c.fechaCreacion, '%Y-%m-%d %H:%i:%s') as fechaCreacion,
        DATE_FORMAT(c.fechaActualizacion, '%Y-%m-%d %H:%i:%s') as fechaActualizacion
      FROM ConfiguracionServiciosAutomaticos c
      JOIN Servicios s ON c.id_servicio = s.id_servicio
      WHERE c.id_configuracion = ?
    `,
      [id]
    );

    return configuraciones.length > 0 ? configuraciones[0] : null;
  }

  static async create({
    id_servicio,
    horaInicio,
    horaFin,
    procesarAutomaticamente = true,
    descripcion,
  }) {
    try {
      // Verificar si ya existe configuración para este servicio
      const [existing] = await connection.query(
        `SELECT id_configuracion FROM ConfiguracionServiciosAutomaticos WHERE id_servicio = ?`,
        [id_servicio]
      );

      if (existing.length > 0) {
        throw new Error(`Ya existe configuración para este servicio`);
      }

      const [result] = await connection.query(
        `
        INSERT INTO ConfiguracionServiciosAutomaticos 
        (id_servicio, horaInicio, horaFin, procesarAutomaticamente, descripcion)
        VALUES (?, ?, ?, ?, ?)
      `,
        [id_servicio, horaInicio, horaFin, procesarAutomaticamente, descripcion]
      );

      return this.getById({ id: result.insertId });
    } catch (error) {
      throw new Error(`Error al crear configuración: ${error.message}`);
    }
  }

  static async update({
    id,
    id_servicio,
    horaInicio,
    horaFin,
    procesarAutomaticamente,
    descripcion,
  }) {
    try {
      const updates = [];
      const params = [];

      if (id_servicio !== undefined) {
        updates.push(`id_servicio = ?`);
        params.push(id_servicio);
      }
      if (horaInicio !== undefined) {
        updates.push(`horaInicio = ?`);
        params.push(horaInicio);
      }
      if (horaFin !== undefined) {
        updates.push(`horaFin = ?`);
        params.push(horaFin);
      }
      if (procesarAutomaticamente !== undefined) {
        updates.push(`procesarAutomaticamente = ?`);
        params.push(procesarAutomaticamente);
      }
      if (descripcion !== undefined) {
        updates.push(`descripcion = ?`);
        params.push(descripcion);
      }

      if (updates.length === 0) {
        throw new Error(`No hay campos para actualizar`);
      }

      params.push(id);

      await connection.query(
        `
        UPDATE ConfiguracionServiciosAutomaticos 
        SET ${updates.join(", ")}
        WHERE id_configuracion = ?
      `,
        params
      );

      return this.getById({ id });
    } catch (error) {
      throw new Error(`Error al actualizar configuración: ${error.message}`);
    }
  }

  static async delete({ id }) {
    try {
      const [result] = await connection.query(
        `DELETE FROM ConfiguracionServiciosAutomaticos WHERE id_configuracion = ?`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar configuración: ${error.message}`);
    }
  }

  static async getServiciosActivos() {
    const [servicios] = await connection.query(`
      SELECT 
        c.id_configuracion,
        c.id_servicio,
        c.horaInicio,
        c.horaFin,
        c.procesarAutomaticamente,
        s.nombre as nombreServicio
      FROM ConfiguracionServiciosAutomaticos c
      JOIN Servicios s ON c.id_servicio = s.id_servicio
      WHERE c.procesarAutomaticamente = TRUE
      ORDER BY c.horaInicio ASC
    `);
    return servicios;
  }
}
