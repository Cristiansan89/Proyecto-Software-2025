import { Router } from "express";
import { ConfiguracionServicioAutomaticoController } from "../controllers/configuracionServicioAutomaticoController.js";

const configuracionServicioAutomaticoRouter = Router();
const configuracionController = new ConfiguracionServicioAutomaticoController();

// Obtener todas las configuraciones
configuracionServicioAutomaticoRouter.get(
  "/",
  configuracionController.obtenerTodos
);

// Obtener servicios activos
configuracionServicioAutomaticoRouter.get(
  "/activos",
  configuracionController.obtenerServiciosActivos
);

// Obtener por ID
configuracionServicioAutomaticoRouter.get(
  "/:id",
  configuracionController.obtenerPorId
);

// Crear nueva configuración
configuracionServicioAutomaticoRouter.post("/", configuracionController.crear);

// Actualizar configuración
configuracionServicioAutomaticoRouter.patch(
  "/:id",
  configuracionController.actualizar
);

// Eliminar configuración
configuracionServicioAutomaticoRouter.delete(
  "/:id",
  configuracionController.eliminar
);

export default configuracionServicioAutomaticoRouter;
