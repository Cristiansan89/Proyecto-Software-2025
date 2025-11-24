import { Router } from "express";
import { InsumoController } from "../controllers/insumos.js";

export const createInsumoRouter = ({ insumoModel }) => {
  const insumosRouter = Router();
  const insumoController = new InsumoController({ insumoModel });

  insumosRouter.get("/", insumoController.getAll);

  // Endpoints especializados (deben ir antes de las rutas con parámetros dinámicos)
  insumosRouter.get("/activos/list", insumoController.getActivos);
  // Insumos con stock bajo
  insumosRouter.get("/bajo-stock", insumoController.getStockBajo);
  insumosRouter.get("/search/by-nombre", insumoController.searchByNombre);
  insumosRouter.get("/categoria/:categoria", insumoController.getByCategoria);

  // Rutas por ID (colocadas después de las rutas especializadas)
  insumosRouter.get("/:id", insumoController.getById);
  insumosRouter.post("/", insumoController.create);
  insumosRouter.delete("/:id", insumoController.delete);
  insumosRouter.patch("/:id", insumoController.update);
  insumosRouter.patch("/:id/estado", insumoController.cambiarEstado);

  return insumosRouter;
};
