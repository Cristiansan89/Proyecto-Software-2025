import { connection } from "./db.js";

class AuditoriaLog {
  // Crear un nuevo registro de auditoría
  static async crear(datos) {
    try {
      const {
        id_usuario,
        nombreUsuario,
        email,
        accion,
        modulo,
        descripcion,
        detalles,
        ip,
        userAgent,
      } = datos;

      const query = `
        INSERT INTO Auditorias (
          id_usuario,
          fechaHora,
          modulo,
          tipoAccion,
          descripcion,
          estado
        ) VALUES (UUID_TO_BIN(?), NOW(), ?, ?, ?, 'Exito')
      `;

      const values = [
        id_usuario || null,
        modulo,
        accion || "Registrar",
        descripcion || "",
      ];

      const [result] = await connection.execute(query, values);
      return result;
    } catch (error) {
      console.error("Error al crear registro de auditoría:", error);
      throw error;
    }
  }

  // Obtener todos los logs con filtros
  static async obtener(filtros = {}) {
    try {
      let query = `
        SELECT 
          BIN_TO_UUID(id_registro) as id_auditoria,
          BIN_TO_UUID(id_usuario) as id_usuario,
          '' as nombre_usuario,
          '' as email_usuario,
          tipoAccion as accion,
          modulo,
          descripcion,
          '' as detalles,
          '' as ip_origen,
          '' as user_agent,
          fechaHora as fecha_creacion,
          estado
        FROM Auditorias
        WHERE estado = 'Exito'
      `;

      const params = [];

      // Filtro por fecha inicio
      if (filtros.fechaInicio) {
        query += ` AND DATE(fechaHora) >= ?`;
        params.push(filtros.fechaInicio);
      }

      // Filtro por fecha fin
      if (filtros.fechaFin) {
        query += ` AND DATE(fechaHora) <= ?`;
        params.push(filtros.fechaFin);
      }

      // Filtro por usuario - buscar en descripción ya que no tenemos nombre_usuario
      if (filtros.usuario) {
        query += ` AND descripcion LIKE ?`;
        const busqueda = `%${filtros.usuario}%`;
        params.push(busqueda);
      }

      // Filtro por acción
      if (filtros.accion) {
        query += ` AND tipoAccion = ?`;
        params.push(filtros.accion);
      }

      // Filtro por módulo
      if (filtros.modulo) {
        query += ` AND modulo = ?`;
        params.push(filtros.modulo);
      }

      // Orden por fecha descendente
      query += ` ORDER BY fechaHora DESC LIMIT 1000`;

      const [rows] = await connection.execute(query, params);

      // Retornar rows sin modificaciones
      return rows;
    } catch (error) {
      console.error("Error al obtener logs de auditoría:", error);
      throw error;
    }
  }

  // Obtener un registro específico
  static async obtenerPorId(id) {
    try {
      const query = `
        SELECT 
          id_auditoria,
          id_usuario,
          nombre_usuario,
          email_usuario,
          accion,
          modulo,
          descripcion,
          detalles,
          ip_origen,
          user_agent,
          fecha_creacion,
          estado
        FROM auditorias_logs
        WHERE id_auditoria = ? AND estado = 'Activo'
      `;

      const [rows] = await connection.execute(query, [id]);

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        detalles: row.detalles ? JSON.parse(row.detalles) : null,
      };
    } catch (error) {
      console.error("Error al obtener log de auditoría:", error);
      throw error;
    }
  }

  // Obtener estadísticas
  static async obtenerEstadisticas(filtros = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as totalRegistros,
          COUNT(DISTINCT id_usuario) as usuariosUnicos,
          COUNT(DISTINCT modulo) as modulosAfectados,
          COUNT(CASE WHEN tipoAccion = 'Eliminar' THEN 1 END) as accionesEliminar
        FROM Auditorias
        WHERE estado = 'Exito'
      `;

      const params = [];

      if (filtros.fechaInicio) {
        query += ` AND DATE(fechaHora) >= ?`;
        params.push(filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        query += ` AND DATE(fechaHora) <= ?`;
        params.push(filtros.fechaFin);
      }

      const [rows] = await connection.execute(query, params);
      return rows[0] || {};
    } catch (error) {
      console.error("Error al obtener estadísticas de auditoría:", error);
      throw error;
    }
  }

  // Obtener logs por módulo
  static async obtenerPorModulo(modulo) {
    try {
      const query = `
        SELECT 
          id_auditoria,
          id_usuario,
          nombre_usuario,
          email_usuario,
          accion,
          modulo,
          descripcion,
          detalles,
          ip_origen,
          fecha_creacion
        FROM auditorias_logs
        WHERE modulo = ? AND estado = 'Activo'
        ORDER BY fecha_creacion DESC
        LIMIT 100
      `;

      const [rows] = await connection.execute(query, [modulo]);

      return rows.map((row) => ({
        ...row,
        detalles: row.detalles ? JSON.parse(row.detalles) : null,
      }));
    } catch (error) {
      console.error("Error al obtener logs por módulo:", error);
      throw error;
    }
  }

  // Obtener logs por usuario
  static async obtenerPorUsuario(idUsuario) {
    try {
      const query = `
        SELECT 
          id_auditoria,
          id_usuario,
          nombre_usuario,
          email_usuario,
          accion,
          modulo,
          descripcion,
          detalles,
          ip_origen,
          fecha_creacion
        FROM auditorias_logs
        WHERE id_usuario = ? AND estado = 'Activo'
        ORDER BY fecha_creacion DESC
        LIMIT 100
      `;

      const [rows] = await connection.execute(query, [idUsuario]);

      return rows.map((row) => ({
        ...row,
        detalles: row.detalles ? JSON.parse(row.detalles) : null,
      }));
    } catch (error) {
      console.error("Error al obtener logs por usuario:", error);
      throw error;
    }
  }

  // Eliminar logs antiguos (más de X días)
  static async limpiarLogsAntiguos(dias = 90) {
    try {
      const query = `
        UPDATE auditorias_logs 
        SET estado = 'Inactivo'
        WHERE DATE(fecha_creacion) < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const [result] = await connection.execute(query, [dias]);
      return result;
    } catch (error) {
      console.error("Error al limpiar logs antiguos:", error);
      throw error;
    }
  }

  // Obtener actividades de hoy
  static async obtenerDelDia() {
    try {
      const query = `
        SELECT 
          id_auditoria,
          id_usuario,
          nombre_usuario,
          email_usuario,
          accion,
          modulo,
          descripcion,
          detalles,
          ip_origen,
          fecha_creacion
        FROM auditorias_logs
        WHERE DATE(fecha_creacion) = CURDATE() AND estado = 'Activo'
        ORDER BY fecha_creacion DESC
      `;

      const [rows] = await connection.execute(query);

      return rows.map((row) => ({
        ...row,
        detalles: row.detalles ? JSON.parse(row.detalles) : null,
      }));
    } catch (error) {
      console.error("Error al obtener logs del día:", error);
      throw error;
    }
  }
}

export default AuditoriaLog;
