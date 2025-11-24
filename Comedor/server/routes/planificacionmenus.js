import { Router } from "express";
import { PlanificacionMenuController } from "../controllers/planificacionmenus.js";
import { authRequired } from "../middlewares/auth.js";

export const createPlanificacionMenuRouter = ({ planificacionMenuModel }) => {
  const planificacionMenusRouter = Router();
  const planificacionMenuController = new PlanificacionMenuController({
    planificacionMenuModel,
  });

  // Endpoints especializados - ANTES de las rutas con parámetros
  planificacionMenusRouter.get(
    "/fecha/:fecha",
    planificacionMenuController.getByFecha
  );
  planificacionMenusRouter.get(
    "/servicio/:id_servicio",
    planificacionMenuController.getByServicio
  );
  planificacionMenusRouter.get(
    "/rango-fechas/reporte",
    planificacionMenuController.getByRangoFechas
  );
  planificacionMenusRouter.get(
    "/menu-del-dia/:fecha/:id_servicio",
    planificacionMenuController.getMenuDelDia
  );
  planificacionMenusRouter.get(
    "/semana",
    planificacionMenuController.getMenusSemana
  );
  planificacionMenusRouter.post(
    "/jornadas",
    authRequired,
    planificacionMenuController.crearJornada
  );
  planificacionMenusRouter.post(
    "/asignar-receta",
    authRequired,
    planificacionMenuController.asignarReceta
  );
  planificacionMenusRouter.delete(
    "/eliminar-receta",
    authRequired,
    planificacionMenuController.eliminarReceta
  );
  planificacionMenusRouter.get(
    "/jornadas/:id_jornada/recetas",
    planificacionMenuController.getRecetasPorJornada
  );
  planificacionMenusRouter.get(
    "/usuario/:id_usuario",
    planificacionMenuController.getByUsuario
  );
  planificacionMenusRouter.get(
    "/estado/:estado",
    planificacionMenuController.getByEstado
  );

  // Rutas principales CRUD
  planificacionMenusRouter.get("/", planificacionMenuController.getAll);
  planificacionMenusRouter.get("/:id", planificacionMenuController.getById);
  planificacionMenusRouter.post(
    "/",
    authRequired,
    planificacionMenuController.create
  );
  planificacionMenusRouter.delete(
    "/:id",
    authRequired,
    planificacionMenuController.delete
  );
  planificacionMenusRouter.patch(
    "/:id",
    authRequired,
    planificacionMenuController.update
  );
  planificacionMenusRouter.patch(
    "/:id/finalizar",
    authRequired,
    planificacionMenuController.finalizar
  );
  planificacionMenusRouter.get(
    "/:id/completa",
    planificacionMenuController.getPlanificacionCompleta
  );

  // Rutas para cálculo automático de comensales
  planificacionMenusRouter.get(
    "/comensales/turno-servicio",
    planificacionMenuController.calcularComensalesPorTurnoYServicio
  );
  planificacionMenusRouter.get(
    "/comensales/fecha",
    planificacionMenuController.calcularComensalesPorServicioYFecha
  );
  planificacionMenusRouter.get(
    "/comensales/resumen",
    planificacionMenuController.obtenerResumenComensales
  );

  return planificacionMenusRouter;
};
