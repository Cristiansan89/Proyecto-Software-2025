import express from "express";
import PlanificacionServicioRecetaServicioController from "../controllers/planificacionServicioRecetaServicioController.js";
import { verifyToken } from "../middlewares/auth.js";

export const createPlanificacionServicioRecetaServicioRouter = () => {
  const router = express.Router();

  // Aplicar autenticación a todas las rutas (comentado temporalmente)
  // router.use(verifyToken);

  /**
   * POST /api/planificacion-receta-servicio/asignar
   * Asignar múltiples servicios a una receta planificada
   */
  router.post(
    "/asignar",
    PlanificacionServicioRecetaServicioController.asignarServicios
  );

  /**
   * GET /api/planificacion-receta-servicio/:id_recetaAsignada
   * Obtener todos los servicios de una receta asignada
   */
  router.get(
    "/:id_recetaAsignada",
    PlanificacionServicioRecetaServicioController.getServiciosByReceta
  );

  /**
   * GET /api/planificacion-receta-servicio/servicio/:id_servicio/jornada/:id_jornada
   * Obtener recetas asignadas para un servicio específico en una jornada
   */
  router.get(
    "/servicio/:id_servicio/jornada/:id_jornada",
    PlanificacionServicioRecetaServicioController.getRecetasByServicioAndJornada
  );

  /**
   * DELETE /api/planificacion-receta-servicio/:id_recetaAsignada/servicio/:id_servicio
   * Eliminar la asociación entre una receta asignada y un servicio
   */
  router.delete(
    "/:id_recetaAsignada/servicio/:id_servicio",
    PlanificacionServicioRecetaServicioController.removeServicio
  );

  /**
   * GET /api/planificacion-receta-servicio/existe/:id_recetaAsignada/servicio/:id_servicio
   * Verificar si existe una asociación
   */
  router.get(
    "/existe/:id_recetaAsignada/servicio/:id_servicio",
    PlanificacionServicioRecetaServicioController.checkAssociation
  );

  /**
   * GET /api/planificacion-receta-servicio/estadisticas
   * Obtener estadísticas de servicios
   */
  router.get(
    "/estadisticas",
    PlanificacionServicioRecetaServicioController.getStatistics
  );

  return router;
};
