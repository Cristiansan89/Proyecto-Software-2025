import telegramService from '../services/telegramService.js';

export class TelegramController {
    // Obtener estado del bot de Telegram
    static async getStatus(req, res) {
        try {
            const status = telegramService.getStatus();
            res.json({
                status,
                message: status.isReady ? 'Bot de Telegram conectado' : 'Bot de Telegram desconectado'
            });
        } catch (error) {
            console.error('Error al obtener estado de Telegram:', error);
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Inicializar el bot de Telegram
    static async initialize(req, res) {
        try {
            const result = await telegramService.initialize();
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error al inicializar Telegram:', error);
            res.status(500).json({
                message: 'Error al inicializar Telegram',
                error: error.message
            });
        }
    }

    // Enviar mensaje a un chat específico
    static async sendMessage(req, res) {
        try {
            const { chatId, message, options } = req.body;

            if (!chatId || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'chatId y message son requeridos'
                });
            }

            const result = await telegramService.sendMessage(chatId, message, options);
            
            if (result.success) {
                res.json({
                    success: true,
                    messageId: result.messageId,
                    message: 'Mensaje enviado correctamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Error al enviar mensaje',
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error al enviar mensaje por Telegram:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Enviar enlaces de asistencia formateados
    static async sendAsistencias(req, res) {
        try {
            const { enlaces, fecha, mensaje, chatId } = req.body;

            if (!enlaces || !Array.isArray(enlaces) || enlaces.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de enlaces válido'
                });
            }

            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es requerida'
                });
            }

            const formattedMessage = telegramService.formatAsistenciasMessage(enlaces, fecha, mensaje);
            
            let result;
            if (chatId) {
                result = await telegramService.sendMessage(chatId, formattedMessage);
            } else {
                result = await telegramService.sendToMainChat(formattedMessage);
            }

            if (result.success) {
                res.json({
                    success: true,
                    messageId: result.messageId,
                    message: 'Enlaces de asistencia enviados correctamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Error al enviar enlaces de asistencia',
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Error al enviar enlaces de asistencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}