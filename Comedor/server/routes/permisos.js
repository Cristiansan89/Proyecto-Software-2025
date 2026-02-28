import { Router } from 'express'
import { PermisoController } from '../controllers/permisos.js'
import { verificarPermiso } from '../middlewares/verificarPermiso.js'

export const createPermisoRouter = ({ permisoModel }) => {
    const permisosRouter = Router()
    const permisoController = new PermisoController({ permisoModel })

    // Endpoints especializados (deben ir ANTES de las rutas con parámetros)
    permisosRouter.get('/activos/list', permisoController.getActivos)
    permisosRouter.get('/search/by-texto', permisoController.searchByTexto)
    permisosRouter.get('/modulo/:modulo', permisoController.getByModulo)

    // Lectura
    permisosRouter.get('/:id', permisoController.getById)
    permisosRouter.get('/', permisoController.getAll)

    // Creación - Protegido
    permisosRouter.post('/', verificarPermiso('Permisos', 'Registrar'), permisoController.create)
    
    // Modificación - Protegido
    permisosRouter.patch('/:id', verificarPermiso('Permisos', 'Modificar'), permisoController.update)
    permisosRouter.patch('/:id/estado', verificarPermiso('Permisos', 'Modificar'), permisoController.cambiarEstado)
    
    // Eliminación - Protegido
    permisosRouter.delete('/:id', verificarPermiso('Permisos', 'Eliminar'), permisoController.delete)

    return permisosRouter
}