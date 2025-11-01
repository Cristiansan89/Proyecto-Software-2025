import { Router } from 'express'
import { PermisoController } from '../controllers/permisos.js'

export const createPermisoRouter = ({ permisoModel }) => {
    const permisosRouter = Router()
    const permisoController = new PermisoController({ permisoModel })

    permisosRouter.get('/', permisoController.getAll)
    permisosRouter.get('/:id', permisoController.getById)
    permisosRouter.post('/', permisoController.create)
    permisosRouter.delete('/:id', permisoController.delete)
    permisosRouter.patch('/:id', permisoController.update)

    // Endpoints especializados
    permisosRouter.get('/activos/list', permisoController.getActivos)
    permisosRouter.get('/search/by-nombre', permisoController.searchByNombre)
    permisosRouter.get('/modulo/:modulo', permisoController.getByModulo)
    permisosRouter.patch('/:id/estado', permisoController.cambiarEstado)

    return permisosRouter
}