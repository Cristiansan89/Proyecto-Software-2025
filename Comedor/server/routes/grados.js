import { Router } from 'express'
import { GradoController } from '../controllers/grados.js'

export const createGradoRouter = ({ gradoModel }) => {
    const gradosRouter = Router()
    const gradoController = new GradoController({ gradoModel })

    gradosRouter.get('/', gradoController.getAll)
    gradosRouter.get('/:id', gradoController.getById)
    gradosRouter.post('/', gradoController.create)
    gradosRouter.delete('/:id', gradoController.delete)
    gradosRouter.patch('/:id', gradoController.update)

    // Endpoints especializados
    gradosRouter.get('/activos/list', gradoController.getActivos)
    gradosRouter.get('/search/by-nombre', gradoController.searchByNombre)
    gradosRouter.patch('/:id/estado', gradoController.cambiarEstado)

    return gradosRouter
}