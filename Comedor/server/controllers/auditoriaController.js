import AuditoriaLog from "../models/auditoriaLog.js";

class AuditoriaController {
  // Obtener todos los logs con filtros
  static async obtenerLogs(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, accion, modulo } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
      if (usuario) filtros.usuario = usuario;
      if (accion) filtros.accion = accion;
      if (modulo) filtros.modulo = modulo;

      const logs = await AuditoriaLog.obtener(filtros);

      res.json({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error) {
      console.error("Error en obtenerLogs:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener logs de auditoría",
        error: error.message,
      });
    }
  }

  // Obtener un log específico
  static async obtenerLog(req, res) {
    try {
      const { id } = req.params;
      const log = await AuditoriaLog.obtenerPorId(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: "Log no encontrado",
        });
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error("Error en obtenerLog:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener log de auditoría",
        error: error.message,
      });
    }
  }

  // Obtener estadísticas
  static async obtenerEstadisticas(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;

      const estadisticas = await AuditoriaLog.obtenerEstadisticas(filtros);

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      console.error("Error en obtenerEstadisticas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de auditoría",
        error: error.message,
      });
    }
  }

  // Obtener logs por módulo
  static async obtenerPorModulo(req, res) {
    try {
      const { modulo } = req.params;
      const logs = await AuditoriaLog.obtenerPorModulo(modulo);

      res.json({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error) {
      console.error("Error en obtenerPorModulo:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener logs por módulo",
        error: error.message,
      });
    }
  }

  // Obtener logs por usuario
  static async obtenerPorUsuario(req, res) {
    try {
      const { idUsuario } = req.params;
      const logs = await AuditoriaLog.obtenerPorUsuario(idUsuario);

      res.json({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error) {
      console.error("Error en obtenerPorUsuario:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener logs por usuario",
        error: error.message,
      });
    }
  }

  // Obtener logs del día
  static async obtenerDelDia(req, res) {
    try {
      const logs = await AuditoriaLog.obtenerDelDia();

      res.json({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error) {
      console.error("Error en obtenerDelDia:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener logs del día",
        error: error.message,
      });
    }
  }

  // Limpiar logs antiguos (solo admin)
  static async limpiarLogsAntiguos(req, res) {
    try {
      const { dias = 90 } = req.body;

      if (req.user.rol !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para limpiar logs",
        });
      }

      const result = await AuditoriaLog.limpiarLogsAntiguos(dias);

      res.json({
        success: true,
        message: `Se archivaron ${result.affectedRows} registros de auditoría`,
        affectedRows: result.affectedRows,
      });
    } catch (error) {
      console.error("Error en limpiarLogsAntiguos:", error);
      res.status(500).json({
        success: false,
        message: "Error al limpiar logs antiguos",
        error: error.message,
      });
    }
  }

  // Registrar reporte PDF
  static async registrarReportePDF(req, res) {
    try {
      const { nombreReporte, tipoReporte, descripcion, detallesReporte } =
        req.body;
      const usuario = req.user || {};

      if (!nombreReporte) {
        return res.status(400).json({
          success: false,
          message: "El nombre del reporte es requerido",
        });
      }

      const resultado = await AuditoriaLog.registrarReportePDF({
        id_usuario: usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        nombreReporte,
        tipoReporte,
        descripcion,
        detallesReporte,
      });

      res.json({
        success: true,
        message: "Reporte PDF registrado en auditoría",
        data: resultado,
      });
    } catch (error) {
      console.error("Error al registrar reporte PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error al registrar reporte PDF en auditoría",
        error: error.message,
      });
    }
  }

  // Obtener reportes PDF generados
  static async obtenerReportesPDF(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, tipoReporte } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
      if (usuario) filtros.usuario = usuario;
      if (tipoReporte) filtros.tipoReporte = tipoReporte;

      const reportes = await AuditoriaLog.obtenerReportesPDF(filtros);

      res.json({
        success: true,
        data: reportes,
        total: reportes.length,
      });
    } catch (error) {
      console.error("Error al obtener reportes PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener reportes PDF",
        error: error.message,
      });
    }
  }

  // Obtener logins de usuarios
  static async obtenerLogins(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, tipo } = req.query;

      const filtros = {};
      if (fechaInicio) filtros.fechaInicio = fechaInicio;
      if (fechaFin) filtros.fechaFin = fechaFin;
      if (usuario) filtros.usuario = usuario;
      if (tipo) filtros.tipo = tipo;

      const logins = await AuditoriaLog.obtenerLogins(filtros);

      res.json({
        success: true,
        data: logins,
        total: logins.length,
      });
    } catch (error) {
      console.error("Error al obtener logins:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener logins de usuarios",
        error: error.message,
      });
    }
  }
}

export default AuditoriaController;
