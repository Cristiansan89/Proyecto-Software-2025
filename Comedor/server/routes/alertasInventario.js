import { Router } from "express";
import { AlertasInventarioController } from "../controllers/alertasInventarioController.js";
import { authRequired } from "../middlewares/auth.js";

const router = Router();

// ========== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ==========
// DEBEN IR PRIMERO para no ser interceptadas por rutas parametrizadas

// Obtener insumos faltantes (sin autenticación - accesible desde Telegram)
router.get(
  "/web/insumos-faltantes",
  AlertasInventarioController.obtenerInsumosFaltantesWeb
);

// Realizar pedido automático desde página web (sin autenticación)
router.post(
  "/web/realizar-pedido-automatico",
  AlertasInventarioController.realizarPedidoAutomaticoWeb
);

// Obtener alertas no vistas (para la cocinera)
router.get(
  "/no-vistas/listar",
  AlertasInventarioController.obtenerAlertasNoVistas
);

// Confirmar alerta por Telegram (sin autenticación requerida)
router.post(
  "/telegram/confirmar",
  AlertasInventarioController.confirmarAlertaTelegram
);

// ========== RUTAS PROTEGIDAS (CON AUTENTICACIÓN) ==========

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

// Marcar alerta como vista
router.put(
  "/:id_alerta/visto",
  authRequired,
  AlertasInventarioController.marcarAlertaComoVista
);

// ESTA RUTA PARAMETRIZADA DEBE IR AL FINAL para no interceptar otras rutas
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

export default router;
