import { Router } from "express";
import { ConsumoController } from "../controllers/consumos.js";

export const createConsumoRouter = ({ consumoModel }) => {
  const consumosRouter = Router();
  const consumoController = new ConsumoController({ consumoModel });

  // Rutas principales
  consumosRouter.get("/", consumoController.getAll);
  consumosRouter.get("/estadisticas", consumoController.getEstadisticas); // Antes de /:id para evitar conflicto
  consumosRouter.get("/:id", consumoController.getById);
  consumosRouter.get("/:id/detalles", consumoController.getConsumoWithDetalles);
  consumosRouter.post("/", consumoController.create);
  consumosRouter.patch("/:id", consumoController.update);
  consumosRouter.delete("/:id", consumoController.delete);

  // Endpoints especializados legacy (mantener compatibilidad)
  consumosRouter.get("/fecha/:fecha", consumoController.getByFecha);
  consumosRouter.get("/persona/:id_persona", consumoController.getByPersona);
  consumosRouter.get(
    "/servicio/:id_servicio/fecha/:fecha",
    consumoController.getByServicioFecha
  );

  return consumosRouter;
};
