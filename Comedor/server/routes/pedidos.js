import { Router } from "express";
import { PedidoController } from "../controllers/pedidos.js";

export const createPedidoRouter = ({ pedidoModel }) => {
  const pedidosRouter = Router();
  const pedidoController = new PedidoController({ pedidoModel });

  // Rutas básicas CRUD
  pedidosRouter.get("/", pedidoController.getAll);
  pedidosRouter.get("/:id", pedidoController.getById);
  pedidosRouter.post("/", pedidoController.create);
  pedidosRouter.delete("/:id", pedidoController.delete);
  pedidosRouter.patch("/:id", pedidoController.update);

  // Rutas especializadas (deben ir antes de las rutas con parámetros dinámicos)
  pedidosRouter.post("/manual", pedidoController.crearPedidoManual);
  pedidosRouter.post("/automatico", pedidoController.generarPedidoAutomatico);
  pedidosRouter.get("/resumen", pedidoController.getResumenPorPeriodo);

  // Rutas por estado y proveedor
  pedidosRouter.get("/estado/:estado", pedidoController.getByEstado);
  pedidosRouter.get(
    "/proveedor/:id_proveedor",
    pedidoController.getByProveedor
  );

  // Rutas para gestión de estados
  pedidosRouter.patch("/:id/estado", pedidoController.cambiarEstado);
  pedidosRouter.patch("/:id/aprobar", pedidoController.aprobar);
  pedidosRouter.patch("/:id/cancelar", pedidoController.cancelar);

  // Ruta para obtener pedido completo
  pedidosRouter.get("/:id/completo", pedidoController.getPedidoCompleto);

  return pedidosRouter;
};
