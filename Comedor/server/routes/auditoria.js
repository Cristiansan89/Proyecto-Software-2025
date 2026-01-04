import express from "express";
import AuditoriaController from "../controllers/auditoriaController.js";
import { authRequired } from "../middlewares/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authRequired);

/**
 * GET /api/auditoria/logs
 * Obtener logs con filtros (paginación opcional)
 * Query params: fechaInicio, fechaFin, usuario, accion, modulo
 */
router.get("/logs", AuditoriaController.obtenerLogs);

/**
 * GET /api/auditoria/logs/:id
 * Obtener un log específico
 */
router.get("/logs/:id", AuditoriaController.obtenerLog);

/**
 * GET /api/auditoria/estadisticas
 * Obtener estadísticas de auditoría
 * Query params: fechaInicio, fechaFin
 */
router.get("/estadisticas", AuditoriaController.obtenerEstadisticas);

/**
 * GET /api/auditoria/modulo/:modulo
 * Obtener logs por módulo
 */
router.get("/modulo/:modulo", AuditoriaController.obtenerPorModulo);

/**
 * GET /api/auditoria/usuario/:idUsuario
 * Obtener logs por usuario
 */
router.get("/usuario/:idUsuario", AuditoriaController.obtenerPorUsuario);

/**
 * GET /api/auditoria/hoy
 * Obtener logs del día actual
 */
router.get("/hoy", AuditoriaController.obtenerDelDia);

/**
 * POST /api/auditoria/limpiar-antiguos
 * Limpiar logs antiguos (solo Admin)
 * Body: { dias: number }
 */
router.post(
  "/limpiar-antiguos",
  (req, res, next) => {
    // Verificar que sea admin antes de procesar
    if (req.user.rol !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Solo administradores pueden limpiar logs",
      });
    }
    next();
  },
  AuditoriaController.limpiarLogsAntiguos
);

/**
 * POST /api/auditoria/reportes
 * Registrar la generación de un reporte PDF
 * Body: { nombreReporte, tipoReporte, descripcion, detallesReporte }
 */
router.post("/reportes", AuditoriaController.registrarReportePDF);

/**
 * GET /api/auditoria/reportes
 * Obtener reportes PDF generados
 * Query params: fechaInicio, fechaFin, usuario, tipoReporte
 */
router.get("/reportes", AuditoriaController.obtenerReportesPDF);

/**
 * GET /api/auditoria/logins
 * Obtener logins de usuarios
 * Query params: fechaInicio, fechaFin, usuario, tipo (Login|Logout)
 */
router.get("/logins", AuditoriaController.obtenerLogins);

export default router;
