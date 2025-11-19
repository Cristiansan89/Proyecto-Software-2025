import { Router } from 'express'
import { GradoController } from '../controllers/grados.js'

export const createGradoRouter = ({ gradoModel }) => {
    const gradosRouter = Router()
    const gradoController = new GradoController({ gradoModel })

    // Endpoints especializados (deben ir ANTES de las rutas con parámetros)
    gradosRouter.get('/activos/list', gradoController.getActivos)
    gradosRouter.get('/search/by-nombre', gradoController.searchByNombre)
    gradosRouter.get('/turno/:idTurno', gradoController.getByTurno)

    // Rutas básicas CRUD
    gradosRouter.get('/', gradoController.getAll)
    gradosRouter.post('/', gradoController.create)
    gradosRouter.get('/:id', gradoController.getById)
    gradosRouter.patch('/:id', gradoController.update)
    gradosRouter.delete('/:id', gradoController.delete)

    // Rutas con parámetros específicos
    gradosRouter.patch('/:id/estado', gradoController.cambiarEstado)

    return gradosRouter
}