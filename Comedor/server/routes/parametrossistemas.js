import { Router } from "express";
import { ParametroSistemaController } from "../controllers/parametrossistemas.js";
import { verificarPermiso } from "../middlewares/verificarPermiso.js";

export const createParametroSistemaRouter = ({ parametroSistemaModel }) => {
  const parametrosSistemasRouter = Router();
  const parametroSistemaController = new ParametroSistemaController({
    parametroSistemaModel,
  });

  // Endpoints especializados
  parametrosSistemasRouter.get(
    "/clave/:clave",
    parametroSistemaController.getByClave
  );

  // Lectura
  parametrosSistemasRouter.get("/", parametroSistemaController.getAll);
  parametrosSistemasRouter.get("/:id", parametroSistemaController.getById);

  // Creación - Protegido
  parametrosSistemasRouter.post("/", verificarPermiso("Parámetros", "Registrar"), parametroSistemaController.create);
  
  // Modificación - Protegido
  parametrosSistemasRouter.patch("/:id", verificarPermiso("Parámetros", "Modificar"), parametroSistemaController.update);
  parametrosSistemasRouter.patch(
    "/clave/:clave",
    verificarPermiso("Parámetros", "Modificar"),
    parametroSistemaController.updateByClave
  );
  
  // Eliminación - Protegido
  parametrosSistemasRouter.delete("/:id", verificarPermiso("Parámetros", "Eliminar"), parametroSistemaController.delete);

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
