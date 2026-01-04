import { connection } from "./db.js";
import { SoftDeleteService } from "./softDeleteService.js";

export class PersonaModel {
  static async getAll({ nombreRol } = {}) {
    if (nombreRol) {
      const [personas] = await connection.query(
        `SELECT 
                    p.id_persona as idPersona,
                    p.nombreRol,
                    p.nombre, 
                    p.apellido,
                    p.dni,
                    p.fechaNacimiento,
                    p.genero,
                    p.fechaAlta,
                    p.fechaModificacion,
                    p.estado
                FROM Personas p
                WHERE p.nombreRol = ? AND p.estado = 'Activo'
                ORDER BY p.apellido, p.nombre;`,
        [nombreRol]
      );
      return personas;
    }

    const [personas] = await connection.query(
      `SELECT 
                id_persona as idPersona,
                nombreRol,
                nombre, 
                apellido,
                dni,
                fechaNacimiento,
                genero,
                fechaAlta,
                fechaModificacion,
                estado
            FROM Personas
            WHERE estado = 'Activo'
            ORDER BY apellido, nombre;`
    );
    return personas;
  }

  static async getById({ id }) {
    const [personas] = await connection.query(
      `SELECT 
                id_persona as idPersona,
                nombreRol,
                nombre, 
                apellido,
                dni,
                fechaNacimiento,
                genero,
                fechaAlta,
                fechaModificacion,
                estado
            FROM Personas
            WHERE id_persona = ?;`,
      [id]
    );
    if (personas.length === 0) return null;
    return personas[0];
  }

  static async create({ input }) {
    const {
      nombreRol,
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      genero = "Otros",
      estado = "Activo",
    } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO Personas (
                    nombreRol, 
                    nombre, 
                    apellido, 
                    dni,
                    fechaNacimiento,
                    genero,
                    estado
                ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [nombreRol, nombre, apellido, dni, fechaNacimiento, genero, estado]
      );

      return this.getById({ id: result.insertId });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El DNI ya existe");
      }
      throw new Error("Error al crear la persona");
    }
  }

  static async delete({ id }) {
    try {
      // Usar soft delete en lugar de DELETE físico
      return await SoftDeleteService.softDelete("Personas", "id_persona", id);
    } catch (error) {
      console.error("Error en softDelete:", error);
      return false;
    }
  }

  // Nuevo método: Restaurar persona eliminada
  static async undelete({ id }) {
    try {
      return await SoftDeleteService.undelete("Personas", "id_persona", id);
    } catch (error) {
      console.error("Error en undelete:", error);
      return false;
    }
  }

  // Nuevo método: Obtener personas eliminadas
  static async getDeleted() {
    try {
      return await SoftDeleteService.getDeleted("Personas", "id_persona", {});
    } catch (error) {
      console.error("Error en getDeleted:", error);
      return [];
    }
  }

  // Nuevo método: Estadísticas de eliminación
  static async getStats() {
    try {
      return await SoftDeleteService.getStats("Personas");
    } catch (error) {
      console.error("Error en getStats:", error);
      return { activos: 0, inactivos: 0, total: 0, porcentajeInactivos: 0 };
    }
  }

  static async hasActiveUsers({ id }) {
    const [result] = await connection.query(
      `SELECT COUNT(*) as count
             FROM Usuarios
             WHERE id_persona = ? AND estado = 'Activo';`,
      [id]
    );
    return result[0].count > 0;
  }

  static async update({ id, input }) {
    const {
      nombreRol,
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      genero,
      estado,
    } = input;

    try {
      const updates = [];
      const values = [];

      if (nombreRol) {
        updates.push("nombreRol = ?");
        values.push(nombreRol);
      }
      if (nombre) {
        updates.push("nombre = ?");
        values.push(nombre);
      }
      if (apellido) {
        updates.push("apellido = ?");
        values.push(apellido);
      }
      if (dni) {
        updates.push("dni = ?");
        values.push(dni);
      }
      if (fechaNacimiento) {
        updates.push("fechaNacimiento = ?");
        values.push(fechaNacimiento);
      }
      if (genero) {
        updates.push("genero = ?");
        values.push(genero);
      }
      if (estado) {
        updates.push("estado = ?");
        values.push(estado);
      }

      if (updates.length === 0) return this.getById({ id });

      updates.push("fechaModificacion = NOW()");
      values.push(id);

      await connection.query(
        `UPDATE Personas
                 SET ${updates.join(", ")}
                 WHERE id_persona = ?;`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El DNI ya existe");
      }
      throw new Error("Error al actualizar la persona");
    }
  }
}
