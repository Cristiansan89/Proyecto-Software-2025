import { Router } from "express";
import { AlertasInventarioController } from "../controllers/alertasInventarioController.js";
import { authRequired } from "../middlewares/auth.js";

const router = Router();

// Inicializar servicio de alertas
router.post(
  "/inicializar",
  authRequired,
  AlertasInventarioController.inicializar
);

// Obtener alertas activas
router.get(
  "/activas",
  authRequired,
  AlertasInventarioController.obtenerAlertasActivas
);

// Obtener estadísticas
router.get(
  "/estadisticas",
  authRequired,
  AlertasInventarioController.obtenerEstadisticas
);

// Obtener alertas de un insumo específico
router.get(
  "/:id_insumo",
  authRequired,
  AlertasInventarioController.obtenerAlertas
);

// Resolver alerta
router.patch(
  "/:id_insumo/resolver",
  authRequired,
  AlertasInventarioController.resolverAlerta
);

// Cambiar tiempo de verificación
router.post(
  "/config/tiempo-verificacion",
  authRequired,
  AlertasInventarioController.cambiarTiempoVerificacion
);

// Obtener estado del servicio
router.get(
  "/config/estado",
  authRequired,
  AlertasInventarioController.obtenerEstado
);

// Verificación manual
router.post(
  "/verificar/manual",
  authRequired,
  AlertasInventarioController.iniciarVerificacionManual
);

// Detener servicio
router.post(
  "/control/detener",
  authRequired,
  AlertasInventarioController.detener
);

// Recalcular estados de inventario
router.post(
  "/diagnostico/recalcular-estados",
  authRequired,
  AlertasInventarioController.recalcularEstados
);

// Limpiar alertas obsoletas
router.post(
  "/diagnostico/limpiar-obsoletas",
  authRequired,
  AlertasInventarioController.limpiarObsoletas
);

// Obtener alertas no vistas (para la cocinera) - ANTES de las rutas parametrizadas
router.get(
  "/no-vistas/listar",
  AlertasInventarioController.obtenerAlertasNoVistas
);

// Marcar alerta como vista
router.put(
  "/:id_alerta/visto",
  AlertasInventarioController.marcarAlertaComoVista
);

// Confirmar alerta por Telegram (sin autenticación requerida)
router.post(
  "/telegram/confirmar",
  AlertasInventarioController.confirmarAlertaTelegram
);

export default router;
