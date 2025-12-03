import { connection } from "./db.js";

export class AsistenciaModel {
  static async getAll(filtros = {}) {
    try {
      let query = `SELECT 
                a.id_asistencia,
                a.id_servicio,
                a.id_alumnoGrado,
                a.fecha,
                a.estado,
                s.nombre as nombreServicio,
                s.descripcion as descripcionServicio,
                p.nombre,
                p.apellido,
                p.dni,
                ag.nombreGrado,
                ag.cicloLectivo
             FROM Asistencias a
             JOIN Servicios s ON a.id_servicio = s.id_servicio
             JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
             JOIN Personas p ON ag.id_persona = p.id_persona
             WHERE 1=1`;

      const params = [];

      // Si hay filtro de fecha, agregarlo
      if (filtros.fecha) {
        query += ` AND a.fecha = ?`;
        params.push(filtros.fecha);
      }

      query += ` ORDER BY a.fecha DESC, a.id_asistencia DESC;`;

      const [asistencias] = await connection.query(query, params);
      return asistencias;
    } catch (error) {
      console.error("Error en AsistenciaModel.getAll:", error);
      return [];
    }
  }

  static async getById({ id }) {
    const [asistencias] = await connection.query(
      `SELECT 
                a.id_asistencia,
                a.id_servicio,
                a.id_alumnoGrado,
                a.fecha,
                a.estado,
                s.nombre as nombreServicio,
                s.descripcion as descripcionServicio,
                p.nombre,
                p.apellido,
                p.dni,
                ag.nombreGrado,
                ag.cicloLectivo
             FROM Asistencias a
             JOIN Servicios s ON a.id_servicio = s.id_servicio
             JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
             JOIN Personas p ON ag.id_persona = p.id_persona
             WHERE a.id_asistencia = ?;`,
      [id]
    );
    if (asistencias.length === 0) return null;
    return asistencias[0];
  }

  static async getByDocenteGradoFecha({
    idPersonaDocente,
    nombreGrado,
    fecha,
    idServicio,
  }) {
    const [asistencias] = await connection.query(
      `SELECT 
                a.id_asistencia,
                a.id_servicio,
                a.id_alumnoGrado,
                a.fecha,
                a.estado,
                s.nombre as nombreServicio,
                s.descripcion as descripcionServicio,
                p.nombre,
                p.apellido,
                p.dni,
                ag.nombreGrado,
                ag.cicloLectivo,
                ag.id_alumnoGrado as alumnoGradoId
             FROM Asistencias a
             JOIN Servicios s ON a.id_servicio = s.id_servicio
             JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
             JOIN Personas p ON ag.id_persona = p.id_persona
             WHERE ag.nombreGrado = ? 
             AND a.fecha = ? 
             AND a.id_servicio = ?
             AND EXISTS (
                SELECT 1 FROM DocenteGrado dg 
                WHERE dg.id_persona = ? 
                AND dg.nombreGrado = ag.nombreGrado
             )
             ORDER BY p.apellido, p.nombre;`,
      [nombreGrado, fecha, idServicio, idPersonaDocente]
    );
    return asistencias;
  }

  static async getAlumnosByDocenteGrado({
    idPersonaDocente,
    nombreGrado,
    fecha,
    idServicio,
  }) {
    const [alumnos] = await connection.query(
      `SELECT 
                ag.id_alumnoGrado,
                p.id_persona,
                p.nombre,
                p.apellido,
                p.dni,
                ag.nombreGrado,
                ag.cicloLectivo,
                a.id_asistencia,
                a.tipoAsistencia,
                a.estado
             FROM AlumnoGrado ag
             JOIN Personas p ON ag.id_persona = p.id_persona
             LEFT JOIN Asistencias a ON (
                a.id_alumnoGrado = ag.id_alumnoGrado 
                AND a.fecha = ? 
                AND a.id_servicio = ?
             )
             WHERE ag.nombreGrado = ? 
             AND EXISTS (
                SELECT 1 FROM DocenteGrado dg 
                WHERE dg.id_persona = ? 
                AND dg.nombreGrado = ag.nombreGrado
             )
             AND p.estado = 'Activo'
             ORDER BY p.apellido, p.nombre;`,
      [fecha, idServicio, nombreGrado, idPersonaDocente]
    );

    console.log(
      `🔍 Debug getAlumnosByDocenteGrado - Fecha: ${fecha}, Servicio: ${idServicio}, Grado: ${nombreGrado}`
    );
    console.log(
      `🔍 Debug getAlumnosByDocenteGrado - Alumnos encontrados: ${alumnos.length}`
    );
    console.log(
      `🔍 Debug getAlumnosByDocenteGrado - Primeros 3 alumnos:`,
      alumnos.slice(0, 3).map((a) => ({
        id: a.id_alumnoGrado,
        nombre: `${a.apellido}, ${a.nombre}`,
        tipoAsistencia: a.tipoAsistencia,
        id_asistencia: a.id_asistencia,
      }))
    );

    return alumnos;
  }

  static async create({ input }) {
    const { idServicio, idAlumnoGrado, fecha, estado = "No" } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO Asistencias (
                    id_servicio, 
                    id_alumnoGrado, 
                    fecha, 
                    estado
                ) VALUES (?, ?, ?, ?);`,
        [idServicio, idAlumnoGrado, fecha, estado]
      );

      return this.getById({ id: result.insertId });
    } catch (error) {
      throw new Error("Error al crear la asistencia");
    }
  }

  static async update({ id, input }) {
    const { estado } = input;

    try {
      await connection.query(
        `UPDATE Asistencias 
                 SET estado = ?
                 WHERE id_asistencia = ?;`,
        [estado, id]
      );

      return this.getById({ id });
    } catch (error) {
      throw new Error("Error al actualizar la asistencia");
    }
  }

  static async upsertAsistencia({
    idServicio,
    idAlumnoGrado,
    fecha,
    tipoAsistencia,
    estado,
  }) {
    try {
      // Verificar si ya existe la asistencia
      const [existing] = await connection.query(
        `SELECT id_asistencia FROM Asistencias 
                 WHERE id_servicio = ? AND id_alumnoGrado = ? AND fecha = ?;`,
        [idServicio, idAlumnoGrado, fecha]
      );

      if (existing.length > 0) {
        // Actualizar existente
        await connection.query(
          `UPDATE Asistencias 
                     SET tipoAsistencia = ?, estado = ?
                     WHERE id_asistencia = ?;`,
          [tipoAsistencia || "No", estado, existing[0].id_asistencia]
        );
        return this.getById({ id: existing[0].id_asistencia });
      } else {
        // Crear nueva - Siempre empezar con 'No' por defecto
        const [result] = await connection.query(
          `INSERT INTO Asistencias (
                        id_servicio, 
                        id_alumnoGrado, 
                        fecha, 
                        tipoAsistencia,
                        estado
                    ) VALUES (?, ?, ?, ?, ?);`,
          [idServicio, idAlumnoGrado, fecha, "No", estado]
        );
        return this.getById({ id: result.insertId });
      }
    } catch (error) {
      console.error(
        "Error específico en upsertAsistencia:",
        error.message,
        error.code
      );
      throw new Error("Error al registrar la asistencia");
    }
  }

  static async delete({ id }) {
    try {
      await connection.query(
        `DELETE FROM Asistencias 
                 WHERE id_asistencia = ?;`,
        [id]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async generateTokenForDocente({
    idPersonaDocente,
    nombreGrado,
    fecha,
    idServicio,
  }) {
    // Generar token único para el docente
    const tokenData = {
      idPersonaDocente,
      nombreGrado,
      fecha,
      idServicio,
      timestamp: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };

    // En un entorno real, esto se encriptaría
    const token = Buffer.from(JSON.stringify(tokenData)).toString("base64");
    return token;
  }

  static async validateToken(token) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, "base64").toString());

      // Verificar si el token no ha expirado
      if (Date.now() > tokenData.expires) {
        throw new Error("Token expirado");
      }

      return tokenData;
    } catch (error) {
      throw new Error("Token inválido");
    }
  }
}
