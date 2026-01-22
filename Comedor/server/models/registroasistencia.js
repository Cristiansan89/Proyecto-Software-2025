import { connection } from "./db.js";

export class RegistroAsistenciaModel {
  static async getAll(filtros = {}) {
    try {
      let query = `
                SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    a.id_grado,
                    a.id_servicio,
                    g.nombreGrado,
                    s.nombre as nombreServicio,
                    a.fecha,
                    a.cantidadPresentes,
                    a.fechaCreacion,
                    a.fechaActualizacion
                FROM RegistrosAsistencias a
                INNER JOIN Grados g ON a.id_grado = g.id_grado
                INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
            `;

      const conditions = [];
      const params = [];

      if (filtros.fecha) {
        conditions.push("a.fecha = ?");
        params.push(filtros.fecha);
      }

      if (filtros.idServicio) {
        conditions.push("a.id_servicio = ?");
        params.push(filtros.idServicio);
      }

      if (filtros.idGrado) {
        conditions.push("a.id_grado = ?");
        params.push(filtros.idGrado);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY a.fecha DESC, g.nombreGrado, s.nombre";

      const [asistencias] = await connection.query(query, params);
      return asistencias;
    } catch (error) {
      console.error("Error al obtener registros de asistencia:", error);
      return [];
    }
  }

  static async getById({ id }) {
    try {
      const [asistencias] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    BIN_TO_UUID(a.id_grado) as id_grado,
                    BIN_TO_UUID(a.id_servicio) as id_servicio,
                    g.nombreGrado,
                    s.nombre as nombreServicio,
                    a.fecha,
                    a.cantidadPresentes,
                    a.fechaCreacion,
                    a.fechaActualizacion
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.id_asistencia = UUID_TO_BIN(?);`,
        [id],
      );
      if (asistencias.length === 0) return null;
      return asistencias[0];
    } catch (error) {
      console.error("Error al obtener registro de asistencia:", error);
      throw new Error("Error al obtener registro de asistencia");
    }
  }

  static async create({ input }) {
    const { id_grado, id_servicio, fecha, cantidadPresentes } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO RegistrosAsistencias (
                    id_grado, 
                    id_servicio,
                    fecha, 
                    cantidadPresentes
                ) VALUES (?, ?, ?, ?);`,
        [id_grado, id_servicio, fecha, cantidadPresentes],
      );

      const [newAsistencia] = await connection.query(
        `SELECT BIN_TO_UUID(id_asistencia) as id_asistencia 
                 FROM RegistrosAsistencias 
                 WHERE id_grado = ? AND id_servicio = ? AND fecha = ?
                 ORDER BY fechaCreacion DESC LIMIT 1;`,
        [id_grado, id_servicio, fecha],
      );

      return this.getById({ id: newAsistencia[0].id_asistencia });
    } catch (error) {
      console.error("Error al crear el registro de asistencia:", error);
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error(
          "Ya existe un registro para este grado, fecha y servicio",
        );
      }
      throw new Error("Error al crear el registro de asistencia");
    }
  }

  static async delete({ id }) {
    try {
      await connection.query(
        `DELETE FROM RegistrosAsistencias
                 WHERE id_asistencia = UUID_TO_BIN(?);`,
        [id],
      );
      return true;
    } catch (error) {
      console.error("Error al eliminar registro de asistencia:", error);
      return false;
    }
  }

  static async update({ id, input }) {
    const { cantidadPresentes, fecha } = input;

    try {
      await connection.query(
        `UPDATE RegistrosAsistencias
                 SET cantidadPresentes = ?, fecha = ?
                 WHERE id_asistencia = UUID_TO_BIN(?);`,
        [cantidadPresentes, fecha, id],
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al actualizar el registro de asistencia:", error);
      throw new Error("Error al actualizar el registro de asistencia");
    }
  }

  // Métodos específicos para gestión de asistencias
  static async getAsistenciasByFecha({ fecha }) {
    try {
      const [rows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    a.id_grado,
                    a.id_servicio,
                    g.nombreGrado,
                    s.nombre as nombreServicio,
                    a.cantidadPresentes,
                    a.fecha
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.fecha = ?
                 ORDER BY g.nombreGrado, s.nombre;`,
        [fecha],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener asistencias por fecha:", error);
      return [];
    }
  }

  static async getAsistenciasByGradoAndPeriodo({
    id_grado,
    fechaInicio,
    fechaFin,
  }) {
    try {
      const [rows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    BIN_TO_UUID(a.id_grado) as id_grado,
                    BIN_TO_UUID(a.id_servicio) as id_servicio,
                    g.nombreGrado,
                    s.nombreServicio,
                    a.cantidadPresentes,
                    a.fecha
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.id_grado = UUID_TO_BIN(?)
                   AND a.fecha BETWEEN ? AND ?
                 ORDER BY a.fecha DESC, s.nombreServicio;`,
        [id_grado, fechaInicio, fechaFin],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener asistencias por grado y período:", error);
      return [];
    }
  }

  static async getEstadisticasAsistencia({ fechaInicio, fechaFin }) {
    try {
      const [rows] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(g.id_grado) as id_grado,
                    g.nombreGrado,
                    s.nombre as nombreServicio,
                    COUNT(a.id_asistencia) as totalRegistros,
                    AVG(a.cantidadPresentes) as promedioAsistencia,
                    MAX(a.cantidadPresentes) as maxAsistencia,
                    MIN(a.cantidadPresentes) as minAsistencia,
                    SUM(a.cantidadPresentes) as totalAsistencia
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.fecha BETWEEN ? AND ?
                 GROUP BY g.id_grado, a.id_servicio
                 ORDER BY g.nombreGrado, s.nombre;`,
        [fechaInicio, fechaFin],
      );
      return rows;
    } catch (error) {
      console.error("Error al obtener estadísticas de asistencia:", error);
      return [];
    }
  }

  // Método para obtener estadísticas generales
  static async getEstadisticas(parametros = {}) {
    try {
      let query = `
                SELECT 
                    COUNT(*) as totalRegistros,
                    SUM(a.cantidadPresentes) as totalPresentes,
                    AVG(a.cantidadPresentes) as promedioPresentes,
                    DATE(a.fecha) as fecha
                FROM RegistrosAsistencias a
            `;

      const conditions = [];
      const params = [];

      if (parametros.fecha) {
        conditions.push("DATE(a.fecha) = ?");
        params.push(parametros.fecha);
      } else if (parametros.fecha_inicio && parametros.fecha_fin) {
        conditions.push("DATE(a.fecha) BETWEEN ? AND ?");
        params.push(parametros.fecha_inicio, parametros.fecha_fin);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      if (parametros.fecha) {
        query += " GROUP BY DATE(a.fecha)";
      }

      const [rows] = await connection.query(query, params);

      if (rows.length === 0) {
        return {
          totalAsistencias: 0,
          totalPresentes: 0,
          porcentajeAsistencia: 0,
        };
      }

      const resultado = rows[0];
      return {
        totalAsistencias: resultado.totalRegistros || 0,
        totalPresentes: resultado.totalPresentes || 0,
        porcentajeAsistencia: resultado.promedioPresentes
          ? Math.round((resultado.promedioPresentes / 30) * 100)
          : 0,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return {
        totalAsistencias: 0,
        totalPresentes: 0,
        porcentajeAsistencia: 0,
      };
    }
  }

  // Método para verificar si todas las asistencias están completas
  static async verificarAsistenciasCompletas(parametros = {}) {
    try {
      const { fecha, idServicio } = parametros;

      // Obtener todos los grados que deberían tener asistencia registrada
      let queryGrados = `
                SELECT DISTINCT g.id_grado, g.nombreGrado
                FROM Grados g
                INNER JOIN ServicioTurno st ON g.id_turno = st.id_turno
                INNER JOIN Servicios s ON st.id_servicio = s.id_servicio
                WHERE g.estado = 'Activo'
            `;

      const paramsGrados = [];
      if (idServicio) {
        queryGrados += " AND s.id_servicio = ?";
        paramsGrados.push(idServicio);
      }

      const [gradosEsperados] = await connection.query(
        queryGrados,
        paramsGrados,
      );

      // Obtener asistencias ya registradas
      let queryAsistencias = `
                SELECT DISTINCT a.id_grado, a.id_servicio
                FROM RegistrosAsistencias a
                WHERE DATE(a.fecha) = ?
            `;

      const paramsAsistencias = [fecha];
      if (idServicio) {
        queryAsistencias += " AND a.id_servicio = ?";
        paramsAsistencias.push(idServicio);
      }

      const [asistenciasRegistradas] = await connection.query(
        queryAsistencias,
        paramsAsistencias,
      );

      // Determinar qué grados faltan por registrar
      const gradosFaltantes = gradosEsperados.filter((grado) => {
        return !asistenciasRegistradas.some(
          (asistencia) =>
            asistencia.id_grado === grado.id_grado &&
            (!idServicio || asistencia.id_servicio === parseInt(idServicio)),
        );
      });

      return {
        completas: gradosFaltantes.length === 0,
        totalEsperados: gradosEsperados.length,
        totalRegistrados: asistenciasRegistradas.length,
        faltantes: gradosFaltantes.map((g) => ({
          idGrado: g.id_grado,
          nombreGrado: g.nombreGrado,
        })),
      };
    } catch (error) {
      console.error("Error al verificar asistencias completas:", error);
      return {
        completas: false,
        totalEsperados: 0,
        totalRegistrados: 0,
        faltantes: [],
      };
    }
  }
}
