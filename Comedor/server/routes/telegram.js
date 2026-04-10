import { Router } from "express";
import { TelegramController } from "../controllers/telegramController.js";

const router = Router();

// Obtener estado del bot de Telegram
router.get("/status", TelegramController.getStatus);

// Inicializar el bot de Telegram
router.post("/initialize", TelegramController.initialize);

// Enviar mensaje a un chat específico
router.post("/send-message", TelegramController.sendMessage);

// Enviar enlaces de asistencia formateados
router.post("/send-asistencias", TelegramController.sendAsistencias);

// Guardar Chat ID de docentes
router.post("/docentes-chat-id", TelegramController.saveDocentesChatId);

// Obtener Chat ID de docentes
router.get("/docentes-chat-id", TelegramController.getDocentesChatId);

// Guardar Chat ID de cocinera
router.post("/cocinera-chat-id", TelegramController.saveCocineraparaChatId);

// Obtener Chat ID de cocinera
router.get("/cocinera-chat-id", TelegramController.getCocineraparaChatId);

// Guardar Chat ID de proveedores
router.post("/proveedor-chat-id", TelegramController.saveProveedorChatId);

// Obtener Chat ID de proveedores
router.get("/proveedor-chat-id", TelegramController.getProveedorChatId);

// Listar todos los proveedores con sus Chat IDs
router.get("/proveedores-list", TelegramController.listProveedoresWithChatId);

// Guardar Chat ID de docente individual
router.post("/docente-chat-id", TelegramController.saveDocenteChatId);

// Listar todos los docentes con sus Chat IDs
router.get("/docentes-list", TelegramController.listDocentesWithChatId);

// Manejar callbacks de botones de alertas (Dar visto / Realizar Pedido)
router.post("/alerta-callback", TelegramController.handleAlertaCallback);

// 🚀 NUEVO: Enviar mensajes personalizados a múltiples destinatarios
router.post("/send-personalized-mass", TelegramController.sendPersonalizedMassMessages);

export default router;
