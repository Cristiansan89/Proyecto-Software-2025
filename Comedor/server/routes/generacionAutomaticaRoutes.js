import { Router } from "express";
import {
  generarInsumosSemanales,
  generarPedidosAutomaticos,
  obtenerEstadoGeneracion,
  finalizarPlanificacionesAutomaticas,
  obtenerInsumosSemanales,
  generarPedidosPorInsumosFaltantes,
} from "../controllers/generacionAutomaticaController.js";
import { authRequired } from "../middlewares/auth.js";
import { schedulerService } from "../services/schedulerService.js";

const router = Router();

// Generar insumos semanales (manual)
router.post(
  "/generar-insumos-semanales",
  authRequired,
  generarInsumosSemanales
);

// Generar pedidos automáticos (manual)
router.post(
  "/generar-pedidos-automaticos",
  authRequired,
  generarPedidosAutomaticos
);

// Obtener estado de próximas generaciones
router.get("/estado-generacion", authRequired, obtenerEstadoGeneracion);

// Recargar configuración del scheduler
router.post("/recargar-scheduler", authRequired, async (req, res) => {
  try {
    await schedulerService.recargar();
    res.json({
      success: true,
      mensaje: "Scheduler recargado correctamente",
      estado: schedulerService.obtenerEstado(),
    });
  } catch (error) {
    console.error("Error recargando scheduler:", error);
    res.status(500).json({
      success: false,
      mensaje: "Error al recargar scheduler",
      error: error.message,
    });
  }
});

// Obtener estado actual del scheduler
router.get("/estado-scheduler", authRequired, (req, res) => {
  res.json({
    success: true,
    estado: schedulerService.obtenerEstado(),
  });
});

// Finalizar planificaciones automáticamente
router.post(
  "/finalizar-planificaciones-automaticas",
  authRequired,
  finalizarPlanificacionesAutomaticas
);

// Obtener insumos semanales calculados
router.get("/obtener-insumos-semanales", authRequired, obtenerInsumosSemanales);

// Generar pedidos por insumos faltantes (manual)
router.post(
  "/generar-pedidos-insumos-faltantes",
  authRequired,
  generarPedidosPorInsumosFaltantes
);

export default router;
