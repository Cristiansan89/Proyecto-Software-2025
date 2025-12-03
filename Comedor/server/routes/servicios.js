import { Router } from "express";
import { ServicioController } from "../controllers/servicios.js";

export const createServicioRouter = ({ servicioModel }) => {
  const serviciosRouter = Router();
  const servicioController = new ServicioController({ servicioModel });

  serviciosRouter.get("/", servicioController.getAll);
  serviciosRouter.post("/", servicioController.create);

  // Endpoints especializados (antes de las rutas con parámetros)
  serviciosRouter.get("/activos/list", servicioController.getActivos);
  serviciosRouter.post(
    "/marcar-completado",
    servicioController.marcarCompletado
  );
  serviciosRouter.get(
    "/estado-completado",
    servicioController.obtenerEstadoCompletado
  );
  serviciosRouter.get(
    "/comensales/por-servicio",
    servicioController.obtenerComensalesPorServicio
  );

  // Rutas con parámetros (al final)
  serviciosRouter.get("/:id", servicioController.getById);
  serviciosRouter.delete("/:id", servicioController.delete);
  serviciosRouter.patch("/:id", servicioController.update);
  serviciosRouter.patch("/:id/estado", servicioController.changeStatus);

  return serviciosRouter;
};
