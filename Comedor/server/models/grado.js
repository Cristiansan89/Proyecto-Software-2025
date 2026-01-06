import { connection } from "./db.js";
import { SoftDeleteService } from "./softDeleteService.js";

export class GradoModel {
  static async getAll() {
    const [grados] = await connection.query(
      `SELECT 
                g.id_grado as idGrado,
                g.id_turno as idTurno,
                g.nombreGrado,
                g.estado,
                t.nombre as turno,
                t.horaInicio,
                t.horaFin
             FROM Grados g
             JOIN Turnos t ON g.id_turno = t.id_turno
             WHERE g.estado = 'Activo'
             ORDER BY g.nombreGrado, t.nombre;`
    );
    return grados;
  }

  static async getById({ id }) {
    const [grados] = await connection.query(
      `SELECT 
                g.id_grado as idGrado,
                g.id_turno as idTurno,
                g.nombreGrado,
                g.estado,
                t.nombre as turno,
                t.horaInicio,
                t.horaFin
             FROM Grados g
             JOIN Turnos t ON g.id_turno = t.id_turno
             WHERE g.id_grado = ? AND g.estado = 'Activo';`,
      [id]
    );
    if (grados.length === 0) return null;
    return grados[0];
  }

  static async create({ input }) {
    const { id_turno, idTurno, nombreGrado, estado = "Activo" } = input;

    // Usar id_turno si está presente, sino usar idTurno para compatibilidad
    const turnoId = id_turno || idTurno;

    try {
      console.log("GradoModel: Creando grado con datos:", {
        turnoId,
        nombreGrado,
        estado,
      });

      // Validar que no exista un grado con el mismo nombre
      const [existing] = await connection.query(
        `SELECT id_grado FROM Grados WHERE nombreGrado = ? AND estado = 'Activo';`,
        [nombreGrado]
      );

      if (existing.length > 0) {
        throw new Error("Ya existe un grado con ese nombre");
      }

      const [result] = await connection.query(
        `INSERT INTO Grados (id_turno, nombreGrado, estado)
                 VALUES (?, ?, ?);`,
        [turnoId, nombreGrado, estado]
      );

      console.log("GradoModel: Grado insertado con ID:", result.insertId);
      return this.getById({ id: result.insertId });
    } catch (error) {
      console.error("GradoModel: Error al crear grado:", error);
      if (
        error.code === "ER_DUP_ENTRY" ||
        error.message.includes("Ya existe")
      ) {
        throw new Error("Ya existe un grado con ese nombre");
      }
      throw new Error("Error al crear el grado: " + error.message);
    }
  }

  static async delete({ id }) {
    try {
      // Usar soft delete en lugar de DELETE físico
      return await SoftDeleteService.softDelete("Grados", "id_grado", id);
    } catch (error) {
      console.error("Error en softDelete:", error);
      return false;
    }
  }

  // Nuevo método: Restaurar grado eliminado
  static async undelete({ id }) {
    try {
      return await SoftDeleteService.undelete("Grados", "id_grado", id);
    } catch (error) {
      console.error("Error en undelete:", error);
      return false;
    }
  }

  // Nuevo método: Obtener grados eliminados
  static async getDeleted() {
    try {
      const [grados] = await connection.query(
        `SELECT 
          g.id_grado as idGrado,
          g.id_turno as idTurno,
          g.nombreGrado,
          g.estado,
          g.fechaEliminacion,
          t.nombre as turno
         FROM Grados g
         JOIN Turnos t ON g.id_turno = t.id_turno
         WHERE g.estado = 'Inactivo'
         ORDER BY g.fechaEliminacion DESC;`
      );
      return grados;
    } catch (error) {
      console.error("Error en getDeleted:", error);
      return [];
    }
  }

  // Nuevo método: Estadísticas de grados
  static async getStats() {
    try {
      return await SoftDeleteService.getStats("Grados");
    } catch (error) {
      console.error("Error en getStats:", error);
      return { activos: 0, inactivos: 0, total: 0, porcentajeInactivos: 0 };
    }
  }

  static async hasActiveRelations({ id }) {
    try {
      const [result] = await connection.query(
        `SELECT COUNT(*) as count
               FROM RegistrosAsistencias
               WHERE id_grado = ?`,
        [id]
      );
      return result[0].count > 0;
    } catch (error) {
      console.error("Error al verificar relaciones activas:", error);
      return false;
    }
  }

  static async update({ id, input }) {
    const { id_turno, idTurno, nombreGrado, estado } = input;

    // Usar id_turno si está presente, sino usar idTurno para compatibilidad
    const turnoId = id_turno || idTurno;

    try {
      // Validar que no exista otro grado con el mismo nombre
      if (nombreGrado) {
        const [existing] = await connection.query(
          `SELECT id_grado FROM Grados WHERE nombreGrado = ? AND id_grado != ? AND estado = 'Activo';`,
          [nombreGrado, id]
        );

        if (existing.length > 0) {
          throw new Error("Ya existe un grado con ese nombre");
        }
      }

      const updates = [];
      const values = [];

      if (turnoId) {
        updates.push("id_turno = ?");
        values.push(turnoId);
      }
      if (nombreGrado) {
        updates.push("nombreGrado = ?");
        values.push(nombreGrado);
      }
      if (estado) {
        updates.push("estado = ?");
        values.push(estado);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      await connection.query(
        `UPDATE Grados
                 SET ${updates.join(", ")}
                 WHERE id_grado = ?;`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      if (
        error.code === "ER_DUP_ENTRY" ||
        error.message.includes("Ya existe")
      ) {
        throw new Error("Ya existe un grado con ese nombre");
      }
      throw new Error("Error al actualizar el grado: " + error.message);
    }
  }

  static async getByTurno({ idTurno }) {
    const [grados] = await connection.query(
      `SELECT 
                g.id_grado as idGrado,
                g.nombreGrado,
                g.estado
             FROM Grados g
             WHERE g.id_turno = ? AND g.estado = 'Activo'
             ORDER BY g.nombreGrado;`,
      [idTurno]
    );
    return grados;
  }
}
