import { Router } from "express";
import { ParametroSistemaController } from "../controllers/parametrossistemas.js";

export const createParametroSistemaRouter = ({ parametroSistemaModel }) => {
  const parametrosSistemasRouter = Router();
  const parametroSistemaController = new ParametroSistemaController({
    parametroSistemaModel,
  });

  parametrosSistemasRouter.get("/", parametroSistemaController.getAll);
  parametrosSistemasRouter.get("/:id", parametroSistemaController.getById);
  parametrosSistemasRouter.post("/", parametroSistemaController.create);
  parametrosSistemasRouter.delete("/:id", parametroSistemaController.delete);
  parametrosSistemasRouter.patch("/:id", parametroSistemaController.update);

  // Endpoints especializados
  parametrosSistemasRouter.get(
    "/clave/:clave",
    parametroSistemaController.getByClave
  );
  parametrosSistemasRouter.patch(
    "/clave/:clave",
    parametroSistemaController.updateByClave
  );

  // Endpoints para Telegram
  parametrosSistemasRouter.post(
    "/telegram/chat-id-cocinera",
    parametroSistemaController.guardarChatIdCocinera
  );
  parametrosSistemasRouter.get(
    "/telegram/chat-id-cocinera",
    parametroSistemaController.obtenerChatIdCocinera
  );

  return parametrosSistemasRouter;
};
