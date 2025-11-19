import { Router } from 'express';
import { TelegramController } from '../controllers/telegramController.js';

const router = Router();

// Obtener estado del bot de Telegram
router.get('/status', TelegramController.getStatus);

// Inicializar el bot de Telegram
router.post('/initialize', TelegramController.initialize);

// Enviar mensaje a un chat específico
router.post('/send-message', TelegramController.sendMessage);

// Enviar enlaces de asistencia formateados
router.post('/send-asistencias', TelegramController.sendAsistencias);

export default router;