import { Router } from "express";
import { PedidoController } from "../controllers/pedidos.js";

export const createPedidoRouter = ({ pedidoModel }) => {
  const pedidosRouter = Router();
  const pedidoController = new PedidoController({ pedidoModel });

  // Rutas básicas CRUD
  pedidosRouter.get("/", pedidoController.getAll);
  pedidosRouter.post("/", pedidoController.create);

  // Rutas especializadas (deben ir ANTES de las rutas con parámetros dinámicos)
  pedidosRouter.post("/manual", pedidoController.crearPedidoManual);
  pedidosRouter.post("/automatico", pedidoController.generarPedidoAutomatico);
  pedidosRouter.get("/resumen", pedidoController.getResumenPorPeriodo);

  // Rutas para visualizar pedidos confirmados (ANTES de /:id)
  pedidosRouter.get("/confirmados", pedidoController.getPedidosConfirmados);
  pedidosRouter.get(
    "/confirmados/:idPedido",
    pedidoController.getDetallesPedidoConfirmacion,
  );

  // Rutas para confirmación de proveedores
  pedidosRouter.post(
    "/generar-token-proveedor",
    pedidoController.generateTokenForProveedor,
  );
  pedidosRouter.get(
    "/confirmacion/:token",
    pedidoController.getByTokenProveedor,
  );
  pedidosRouter.post(
    "/confirmacion/:token",
    pedidoController.confirmarInsumosProveedor,
  );
  pedidosRouter.post(
    "/enviar-email-confirmacion",
    pedidoController.enviarEmailConfirmacion,
  );
  pedidosRouter.post(
    "/enviar-telegram-proveedor",
    pedidoController.enviarNotificacionTelegramProveedor,
  );

  // Rutas por estado y proveedor
  pedidosRouter.get("/estado/:estado", pedidoController.getByEstado);
  pedidosRouter.get(
    "/proveedor/:id_proveedor",
    pedidoController.getByProveedor,
  );

  // Rutas para gestión de estados
  pedidosRouter.patch("/:id/estado", pedidoController.cambiarEstado);
  pedidosRouter.patch("/:id/aprobar", pedidoController.aprobar);
  pedidosRouter.patch("/:id/cancelar", pedidoController.cancelar);

  // Ruta para obtener pedido completo
  pedidosRouter.get("/:id/completo", pedidoController.getPedidoCompleto);

  // Rutas CRUD de ID (AL FINAL - son las más genéricas)
  pedidosRouter.get("/:id", pedidoController.getById);
  pedidosRouter.delete("/:id", pedidoController.delete);
  pedidosRouter.patch("/:id", pedidoController.update);
  pedidosRouter.post("/:id/aprobar", pedidoController.aprobarPedido);

  return pedidosRouter;
};
