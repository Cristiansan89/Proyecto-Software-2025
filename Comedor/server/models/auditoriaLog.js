import { connection } from "./db.js";

// Función helper para validar si es un UUID válido
const isValidUUID = (value) => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(String(value));
};

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
        valor_anterior,
        valor_nuevo,
        id_registro_afectado,
        nivel_criticidad,
        resultado_accion,
      } = datos;

      // Validar si id_registro_afectado es un UUID válido
      const isUUID = isValidUUID(id_registro_afectado);

      const query = `
        INSERT INTO Auditorias (
          id_usuario,
          modulo,
          tipoAccion,
          descripcion,
          valor_anterior,
          valor_nuevo,
          id_registro_afectado,
          nivel_criticidad,
          resultado_accion,
          estado
        ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ${isUUID ? "UUID_TO_BIN(?)" : "?"}, ?, ?, ?)
      `;

      const tipoAccionMapeado =
        accion === "CREAR"
          ? "Registrar"
          : accion === "ACTUALIZAR"
            ? "Modificar"
            : accion === "ELIMINAR"
              ? "Eliminar"
              : accion === "CONSULTAR"
                ? "Consultar"
                : accion === "DESCARGAR"
                  ? "Exportar"
                  : "Registrar";

      // Mapear nivel de criticidad según la acción
      let nivelCriticidad = nivel_criticidad || "Bajo";
      if (accion === "ELIMINAR") nivelCriticidad = "Alto";
      else if (accion === "ACTUALIZAR") nivelCriticidad = "Medio";

      const values = [
        id_usuario || "00000000-0000-0000-0000-000000000000",
        modulo,
        tipoAccionMapeado,
        descripcion || "",
        valor_anterior ? JSON.stringify(valor_anterior) : null,
        valor_nuevo ? JSON.stringify(valor_nuevo) : null,
        isUUID ? (id_registro_afectado || null) : null,
        nivelCriticidad,
        resultado_accion || "Éxito",
        "Exito",
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
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          u.mail as email_usuario,
          COALESCE(r.nombreRol, 'Sin Rol') as nombre_rol,
          a.tipoAccion as accion,
          a.modulo,
          a.descripcion,
          a.valor_anterior,
          a.valor_nuevo,
          CASE 
            WHEN a.id_registro_afectado IS NULL THEN NULL
            WHEN LENGTH(a.id_registro_afectado) = 16 THEN BIN_TO_UUID(a.id_registro_afectado)
            ELSE CAST(a.id_registro_afectado AS CHAR)
          END as id_registro_afectado,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora,
          a.estado
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        LEFT JOIN UsuariosRoles ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        LEFT JOIN Roles r ON ur.id_rol = r.id_rol
        WHERE a.estado = 'Exito'
      `;

      const params = [];

      // Filtro por fecha inicio
      if (filtros.fechaInicio) {
        query += ` AND DATE(a.fechaHora) >= ?`;
        params.push(filtros.fechaInicio);
      }

      // Filtro por fecha fin
      if (filtros.fechaFin) {
        query += ` AND DATE(a.fechaHora) <= ?`;
        params.push(filtros.fechaFin);
      }

      // Filtro por usuario (por nombre)
      if (filtros.usuario) {
        query += ` AND u.nombreUsuario = ?`;
        params.push(filtros.usuario);
      }

      // Filtro por rol
      if (filtros.rol) {
        query += ` AND r.nombreRol = ?`;
        params.push(filtros.rol);
      }

      // Filtro por acción
      if (filtros.accion) {
        query += ` AND a.tipoAccion = ?`;
        params.push(filtros.accion);
      }

      // Filtro por módulo
      if (filtros.modulo) {
        query += ` AND a.modulo = ?`;
        params.push(filtros.modulo);
      }

      // Filtro por criticidad
      if (filtros.criticidad) {
        query += ` AND a.nivel_criticidad = ?`;
        params.push(filtros.criticidad);
      }

      // Filtro por resultado
      if (filtros.resultado) {
        query += ` AND a.resultado_accion = ?`;
        params.push(filtros.resultado);
      }

      // Orden por fecha descendente
      query += ` ORDER BY a.fechaHora DESC LIMIT 1000`;

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
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          u.mail as email_usuario,
          a.tipoAccion as accion,
          a.modulo,
          a.descripcion,
          a.valor_anterior,
          a.valor_nuevo,
          CASE 
            WHEN a.id_registro_afectado IS NULL THEN NULL
            WHEN LENGTH(a.id_registro_afectado) = 16 THEN BIN_TO_UUID(a.id_registro_afectado)
            ELSE CAST(a.id_registro_afectado AS CHAR)
          END as id_registro_afectado,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora,
          a.estado
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        WHERE a.id_registro = UUID_TO_BIN(?) AND a.estado = 'Exito'
      `;

      const [rows] = await connection.execute(query, [id]);

      if (rows.length === 0) return null;

      return rows[0];
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
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          u.mail as email_usuario,
          a.tipoAccion as accion,
          a.modulo,
          a.descripcion,
          CASE 
            WHEN a.id_registro_afectado IS NULL THEN NULL
            WHEN LENGTH(a.id_registro_afectado) = 16 THEN BIN_TO_UUID(a.id_registro_afectado)
            ELSE CAST(a.id_registro_afectado AS CHAR)
          END as id_registro_afectado,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        WHERE a.modulo = ? AND a.estado = 'Exito'
        ORDER BY a.fechaHora DESC
        LIMIT 100
      `;

      const [rows] = await connection.execute(query, [modulo]);

      return rows;
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
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          u.mail as email_usuario,
          a.tipoAccion as accion,
          a.modulo,
          a.descripcion,
          CASE 
            WHEN a.id_registro_afectado IS NULL THEN NULL
            WHEN LENGTH(a.id_registro_afectado) = 16 THEN BIN_TO_UUID(a.id_registro_afectado)
            ELSE CAST(a.id_registro_afectado AS CHAR)
          END as id_registro_afectado,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        WHERE a.id_usuario = UUID_TO_BIN(?) AND a.estado = 'Exito'
        ORDER BY a.fechaHora DESC
        LIMIT 100
      `;

      const [rows] = await connection.execute(query, [idUsuario]);

      return rows;
    } catch (error) {
      console.error("Error al obtener logs por usuario:", error);
      throw error;
    }
  }

  // Eliminar logs antiguos (más de X días)
  static async limpiarLogsAntiguos(dias = 90) {
    try {
      const query = `
        UPDATE Auditorias
        SET estado = 'Error'
        WHERE DATE(fechaHora) < DATE_SUB(NOW(), INTERVAL ? DAY)
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
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          u.mail as email_usuario,
          a.tipoAccion as accion,
          a.modulo,
          a.descripcion,
          CASE 
            WHEN a.id_registro_afectado IS NULL THEN NULL
            WHEN LENGTH(a.id_registro_afectado) = 16 THEN BIN_TO_UUID(a.id_registro_afectado)
            ELSE CAST(a.id_registro_afectado AS CHAR)
          END as id_registro_afectado,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        WHERE DATE(a.fechaHora) = CURDATE() AND a.estado = 'Exito'
        ORDER BY a.fechaHora DESC
      `;

      const [rows] = await connection.execute(query);

      return rows;
    } catch (error) {
      console.error("Error al obtener logs del día:", error);
      throw error;
    }
  }

  // Registrar login de usuario
  static async registrarLogin(datos) {
    try {
      const { id_usuario, nombreUsuario, ip, userAgent } = datos;

      const query = `
        INSERT INTO Auditorias (
          id_usuario,
          modulo,
          tipoAccion,
          descripcion,
          nivel_criticidad,
          resultado_accion,
          estado
        ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        id_usuario,
        "Autenticación",
        "Login",
        `Inicio de sesión de usuario: ${nombreUsuario}`,
        "Bajo",
        "Éxito",
        "Exito",
      ];

      const [result] = await connection.execute(query, values);
      console.log(`✅ Login registrado para usuario: ${nombreUsuario}`);
      return result;
    } catch (error) {
      console.error("Error al registrar login en auditoría:", error);
      throw error;
    }
  }

  // Registrar logout de usuario
  static async registrarLogout(datos) {
    try {
      const { id_usuario, nombreUsuario, ip, userAgent } = datos;

      const query = `
        INSERT INTO Auditorias (
          id_usuario,
          modulo,
          tipoAccion,
          descripcion,
          nivel_criticidad,
          resultado_accion,
          estado
        ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        id_usuario,
        "Autenticación",
        "Logout",
        `Cierre de sesión de usuario: ${nombreUsuario}`,
        "Bajo",
        "Éxito",
        "Exito",
      ];

      const [result] = await connection.execute(query, values);
      console.log(`✅ Logout registrado para usuario: ${nombreUsuario}`);
      return result;
    } catch (error) {
      console.error("Error al registrar logout en auditoría:", error);
      throw error;
    }
  }

  // Registrar generación de reporte PDF
  static async registrarReportePDF(datos) {
    try {
      const {
        id_usuario,
        nombreUsuario,
        nombreReporte,
        tipoReporte,
        descripcion,
        detallesReporte,
      } = datos;

      const query = `
        INSERT INTO Auditorias (
          id_usuario,
          modulo,
          tipoAccion,
          descripcion,
          nivel_criticidad,
          resultado_accion,
          estado,
          nombreReporte,
          tipoReporte,
          detallesReporte
        ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        id_usuario,
        "Reportes",
        "Exportar",
        descripcion || `Generación de reporte PDF: ${nombreReporte}`,
        "Bajo",
        "Éxito",
        "Exito",
        nombreReporte,
        tipoReporte,
        detallesReporte || "",
      ];

      const [result] = await connection.execute(query, values);
      console.log(
        `📄 Reporte PDF registrado: ${nombreReporte} por usuario: ${nombreUsuario}`,
      );
      return result;
    } catch (error) {
      console.error("Error al registrar reporte PDF en auditoría:", error);
      throw error;
    }
  }

  // Obtener reportes PDF generados
  static async obtenerReportesPDF(filtros = {}) {
    try {
      let query = `
        SELECT 
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          a.nombreReporte,
          a.tipoReporte,
          a.descripcion,
          a.detallesReporte,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora,
          a.estado
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        WHERE a.tipoAccion = 'Exportar' AND a.modulo = 'Reportes'
      `;

      const params = [];

      // Filtro por fecha inicio
      if (filtros.fechaInicio) {
        query += ` AND DATE(a.fechaHora) >= ?`;
        params.push(filtros.fechaInicio);
      }

      // Filtro por fecha fin
      if (filtros.fechaFin) {
        query += ` AND DATE(a.fechaHora) <= ?`;
        params.push(filtros.fechaFin);
      }

      // Filtro por usuario
      if (filtros.usuario) {
        query += ` AND u.nombreUsuario LIKE ?`;
        params.push(`%${filtros.usuario}%`);
      }

      // Filtro por tipo de reporte
      if (filtros.tipoReporte) {
        query += ` AND a.tipoReporte = ?`;
        params.push(filtros.tipoReporte);
      }

      query += ` ORDER BY a.fechaHora DESC LIMIT 1000`;

      const [rows] = await connection.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Error al obtener reportes PDF:", error);
      throw error;
    }
  }

  // Obtener logins de usuarios
  static async obtenerLogins(filtros = {}) {
    try {
      let query = `
        SELECT 
          BIN_TO_UUID(a.id_registro) as id_auditoria,
          BIN_TO_UUID(a.id_usuario) as id_usuario,
          u.nombreUsuario as nombre_usuario,
          a.tipoAccion,
          a.descripcion,
          a.nivel_criticidad,
          a.resultado_accion,
          a.fechaHora,
          a.estado
        FROM Auditorias a
        LEFT JOIN Usuarios u ON a.id_usuario = u.id_usuario
        WHERE a.modulo = 'Autenticación' AND a.tipoAccion IN ('Login', 'Logout')
      `;

      const params = [];

      // Filtro por fecha inicio
      if (filtros.fechaInicio) {
        query += ` AND DATE(a.fechaHora) >= ?`;
        params.push(filtros.fechaInicio);
      }

      // Filtro por fecha fin
      if (filtros.fechaFin) {
        query += ` AND DATE(a.fechaHora) <= ?`;
        params.push(filtros.fechaFin);
      }

      // Filtro por usuario
      if (filtros.usuario) {
        query += ` AND u.nombreUsuario LIKE ?`;
        params.push(`%${filtros.usuario}%`);
      }

      // Filtro por tipo (Login o Logout)
      if (filtros.tipo) {
        query += ` AND a.tipoAccion = ?`;
        params.push(filtros.tipo);
      }

      query += ` ORDER BY a.fechaHora DESC LIMIT 1000`;

      const [rows] = await connection.execute(query, params);
      return rows;
    } catch (error) {
      console.error("Error al obtener logins de usuarios:", error);
      throw error;
    }
  }

  // Obtener roles disponibles
  static async obtenerRolesDisponibles() {
    try {
      const query = `
        SELECT DISTINCT r.nombreRol
        FROM Roles r
        WHERE r.estado = 'Activo'
        ORDER BY r.nombreRol
      `;

      const [rows] = await connection.execute(query);
      return rows.map(row => row.nombreRol);
    } catch (error) {
      console.error("Error al obtener roles disponibles:", error);
      throw error;
    }
  }
}

export default AuditoriaLog;
