import { Router } from 'express'
import { RegistroAsistenciaController } from '../controllers/registrosasistencias.js'

export const createRegistroAsistenciaRouter = ({ registroAsistenciaModel }) => {
    const registrosAsistenciasRouter = Router()
    const registroAsistenciaController = new RegistroAsistenciaController({ registroAsistenciaModel })

    registrosAsistenciasRouter.get('/', registroAsistenciaController.getAll)
    registrosAsistenciasRouter.get('/:id', registroAsistenciaController.getById)
    registrosAsistenciasRouter.post('/', registroAsistenciaController.create)
    registrosAsistenciasRouter.delete('/:id', registroAsistenciaController.delete)
    registrosAsistenciasRouter.patch('/:id', registroAsistenciaController.update)

    return registrosAsistenciasRouter
}