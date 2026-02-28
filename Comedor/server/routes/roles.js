import { Router } from 'express'
import { RolController } from '../controllers/roles.js'
import { verificarPermiso } from '../middlewares/verificarPermiso.js'

export const createRolRouter = ({ rolModel }) => {
    const rolesRouter = Router()
    const rolController = new RolController({ rolModel })

    // Endpoints especializados (deben ir ANTES de las rutas con parámetros)
    rolesRouter.get('/activos/list', rolController.getActivos)
    rolesRouter.get('/search/by-nombre', rolController.searchByNombre)
    rolesRouter.get('/:id/permisos', rolController.getConPermisos)

    // Lectura
    rolesRouter.get('/:id', rolController.getById)
    rolesRouter.get('/', rolController.getAll)

    // Creación - Protegido
    rolesRouter.post('/', verificarPermiso('Roles', 'Registrar'), rolController.create)
    
    // Modificación - Protegido
    rolesRouter.patch('/:id', verificarPermiso('Roles', 'Modificar'), rolController.update)
    rolesRouter.patch('/:id/estado', verificarPermiso('Roles', 'Modificar'), rolController.cambiarEstado)
    
    // Eliminación - Protegido
    rolesRouter.delete('/:id', verificarPermiso('Roles', 'Eliminar'), rolController.delete)

    return rolesRouter
}