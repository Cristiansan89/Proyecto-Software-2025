import { connection } from "./db.js";

export class AlumnoGradoModel {
  static async getAll() {
    const [alumnos] = await connection.query(
      `SELECT 
                ag.id_alumnoGrado as idAlumnoGrado,
                ag.id_persona as idPersona,
                ag.nombreGrado,
                ag.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado as estadoPersona,
                g.id_grado as idGrado,
                g.estado as estadoGrado
             FROM AlumnoGrado ag
             JOIN Personas p ON ag.id_persona = p.id_persona
             LEFT JOIN Grados g ON ag.nombreGrado = g.nombreGrado
             ORDER BY ag.nombreGrado, p.apellido, p.nombre;`
    );
    return alumnos;
  }

  static async getById({ id }) {
    const [alumnos] = await connection.query(
      `SELECT 
                ag.id_alumnoGrado as idAlumnoGrado,
                ag.id_persona as idPersona,
                ag.nombreGrado,
                ag.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado as estadoPersona,
                g.id_grado as idGrado,
                g.estado as estadoGrado
             FROM AlumnoGrado ag
             JOIN Personas p ON ag.id_persona = p.id_persona
             LEFT JOIN Grados g ON ag.nombreGrado = g.nombreGrado
             WHERE ag.id_alumnoGrado = ?;`,
      [id]
    );
    if (alumnos.length === 0) return null;
    return alumnos[0];
  }

  static async getByGrado({ nombreGrado }) {
    const [alumnos] = await connection.query(
      `SELECT 
                ag.id_alumnoGrado as idAlumnoGrado,
                ag.id_persona as idPersona,
                ag.nombreGrado,
                ag.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado as estadoPersona
             FROM AlumnoGrado ag
             JOIN Personas p ON ag.id_persona = p.id_persona
             WHERE ag.nombreGrado = ?
             ORDER BY p.apellido, p.nombre;`,
      [nombreGrado]
    );
    return alumnos;
  }

  static async create({ input }) {
    const {
      idPersona,
      nombreGrado,
      cicloLectivo = new Date().getFullYear(),
    } = input;

    try {
      // Convertir el año a una fecha completa para la base de datos
      const fechaCiclo = `${cicloLectivo}-01-01`;

      // Verificar que la persona tenga rol de Alumno
      const [persona] = await connection.query(
        `SELECT p.id_persona, r.nombreRol 
                 FROM Personas p 
                 JOIN Roles r ON p.nombreRol = r.nombreRol
                 WHERE p.id_persona = ? AND r.nombreRol = 'Alumno';`,
        [idPersona]
      );

      if (persona.length === 0) {
        throw new Error("La persona seleccionada no tiene el rol de Alumno");
      }

      // Verificar que el grado existe
      const [grado] = await connection.query(
        `SELECT nombreGrado FROM Grados WHERE nombreGrado = ? AND estado = 'Activo';`,
        [nombreGrado]
      );

      if (grado.length === 0) {
        throw new Error("El grado seleccionado no existe o está inactivo");
      }

      // Verificar que el alumno no esté ya asignado al mismo grado en el mismo ciclo lectivo
      const [existing] = await connection.query(
        `SELECT id_alumnoGrado FROM AlumnoGrado 
                 WHERE id_persona = ? AND nombreGrado = ? AND cicloLectivo = ?;`,
        [idPersona, nombreGrado, fechaCiclo]
      );

      if (existing.length > 0) {
        throw new Error(
          "El alumno ya está asignado a este grado en el ciclo lectivo actual"
        );
      }

      const [result] = await connection.query(
        `INSERT INTO AlumnoGrado (id_persona, nombreGrado, cicloLectivo)
                 VALUES (?, ?, ?);`,
        [idPersona, nombreGrado, fechaCiclo]
      );

      return this.getById({ id: result.insertId });
    } catch (error) {
      console.error("AlumnoGradoModel: Error al crear asignación:", error);
      throw new Error("Error al asignar alumno al grado: " + error.message);
    }
  }

  static async delete({ id }) {
    try {
      const [result] = await connection.query(
        `DELETE FROM AlumnoGrado WHERE id_alumnoGrado = ?;`,
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("AlumnoGradoModel: Error en DELETE:", error);
      throw error;
    }
  }

  static async update({ id, input }) {
    const { idPersona, nombreGrado, cicloLectivo } = input;

    try {
      const updates = [];
      const values = [];

      if (idPersona) {
        // Verificar que la persona tenga rol de Alumno
        const [persona] = await connection.query(
          `SELECT p.id_persona, r.nombreRol 
                     FROM Personas p 
                     JOIN Roles r ON p.nombreRol = r.nombreRol
                     WHERE p.id_persona = ? AND r.nombreRol = 'Alumno';`,
          [idPersona]
        );

        if (persona.length === 0) {
          throw new Error("La persona seleccionada no tiene el rol de Alumno");
        }

        updates.push("id_persona = ?");
        values.push(idPersona);
      }

      if (nombreGrado) {
        updates.push("nombreGrado = ?");
        values.push(nombreGrado);
      }

      if (cicloLectivo) {
        // Convertir el año a una fecha completa para la base de datos
        const fechaCiclo = `${cicloLectivo}-01-01`;
        updates.push("cicloLectivo = ?");
        values.push(fechaCiclo);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      await connection.query(
        `UPDATE AlumnoGrado
                 SET ${updates.join(", ")}
                 WHERE id_alumnoGrado = ?;`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      throw new Error("Error al actualizar la asignación: " + error.message);
    }
  }

  // Obtener alumnos disponibles (personas con rol Alumno que no están asignadas a ningún grado)
  static async getAlumnosDisponibles({
    cicloLectivo = new Date().getFullYear(),
  }) {
    // Convertir el año a una fecha completa para la comparación con DATE
    const fechaCiclo = `${cicloLectivo}-01-01`;

    const [alumnos] = await connection.query(
      `SELECT 
                p.id_persona as idPersona,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado
             FROM Personas p
             JOIN Roles r ON p.nombreRol = r.nombreRol
             WHERE r.nombreRol = 'Alumno' 
               AND p.estado = 'Activo'
               AND p.id_persona NOT IN (
                   SELECT id_persona 
                   FROM AlumnoGrado 
                   WHERE cicloLectivo = ?
               )
             ORDER BY p.apellido, p.nombre;`,
      [fechaCiclo]
    );
    return alumnos;
  }
}
