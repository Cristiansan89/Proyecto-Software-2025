import { Router } from 'express'
import { ServicioController } from '../controllers/servicios.js'

export const createServicioRouter = ({ servicioModel }) => {
    const serviciosRouter = Router()
    const servicioController = new ServicioController({ servicioModel })

    serviciosRouter.get('/', servicioController.getAll)
    serviciosRouter.get('/:id', servicioController.getById)
    serviciosRouter.post('/', servicioController.create)
    serviciosRouter.delete('/:id', servicioController.delete)
    serviciosRouter.patch('/:id', servicioController.update)

    // Endpoints especializados
    serviciosRouter.get('/activos/list', servicioController.getActivos)
    serviciosRouter.patch('/:id/estado', servicioController.changeStatus)

    return serviciosRouter
}