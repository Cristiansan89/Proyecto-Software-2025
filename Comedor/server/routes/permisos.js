import { Router } from 'express'
import { PermisoController } from '../controllers/permisos.js'

export const createPermisoRouter = ({ permisoModel }) => {
    const permisosRouter = Router()
    const permisoController = new PermisoController({ permisoModel })

    // Endpoints especializados (deben ir ANTES de las rutas con parámetros)
    permisosRouter.get('/activos/list', permisoController.getActivos)
    permisosRouter.get('/search/by-texto', permisoController.searchByTexto)

    // Rutas básicas CRUD
    permisosRouter.get('/', permisoController.getAll)
    permisosRouter.post('/', permisoController.create)
    permisosRouter.get('/:id', permisoController.getById)
    permisosRouter.patch('/:id', permisoController.update)
    permisosRouter.delete('/:id', permisoController.delete)

    // Rutas con parámetros específicos
    permisosRouter.get('/modulo/:modulo', permisoController.getByModulo)
    permisosRouter.patch('/:id/estado', permisoController.cambiarEstado)

    return permisosRouter
}