import { UsuarioModel } from '../models/usuario.js'

export const updateLastActivity = async (req, res, next) => {
    // Solo actualizar si hay un usuario autenticado
    if (req.user && req.user.id) {
        try {
            // Actualizar la última actividad de forma asíncrona sin bloquear la respuesta
            UsuarioModel.updateLastActivity({ id: req.user.id }).catch(error => {
                console.error('Error al actualizar última actividad:', error)
            })
        } catch (error) {
            // No queremos que esto rompa el flujo principal, solo logeamos el error
            console.error('Error en middleware updateLastActivity:', error)
        }
    }
    next()
}