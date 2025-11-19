import { Router } from 'express'
import { AsistenciaController } from '../controllers/asistencias.js'

export const createAsistenciaRouter = ({ asistenciaModel }) => {
    const asistenciasRouter = Router()
    const asistenciaController = new AsistenciaController({ asistenciaModel })

    // Rutas públicas (no requieren autenticación)
    asistenciasRouter.get('/registro/:token', asistenciaController.getByToken)
    asistenciasRouter.post('/registro/:token', asistenciaController.registrarAsistencias)

    // Rutas protegidas (requieren autenticación)
    asistenciasRouter.get('/', asistenciaController.getAll)
    asistenciasRouter.get('/:id', asistenciaController.getById)
    asistenciasRouter.post('/', asistenciaController.create)
    asistenciasRouter.patch('/:id', asistenciaController.update)
    asistenciasRouter.delete('/:id', asistenciaController.delete)

    // Registro de asistencias desde panel docente
    asistenciasRouter.post('/registro-docente', asistenciaController.registrarAsistenciasDocente)

    // Generar token para docente
    asistenciasRouter.post('/generar-token', asistenciaController.generateTokenForDocente)

    return asistenciasRouter
}