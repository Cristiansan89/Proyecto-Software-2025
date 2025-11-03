import { Router } from 'express'
import { RolController } from '../controllers/roles.js'

export const createRolRouter = ({ rolModel }) => {
    const rolesRouter = Router()
    const rolController = new RolController({ rolModel })

    // Endpoints especializados (deben ir ANTES de las rutas con parámetros)
    rolesRouter.get('/activos/list', rolController.getActivos)
    rolesRouter.get('/search/by-nombre', rolController.searchByNombre)

    // Rutas básicas CRUD
    rolesRouter.get('/', rolController.getAll)
    rolesRouter.post('/', rolController.create)
    rolesRouter.get('/:id', rolController.getById)
    rolesRouter.patch('/:id', rolController.update)
    rolesRouter.delete('/:id', rolController.delete)

    // Rutas con parámetros específicos
    rolesRouter.get('/:id/permisos', rolController.getConPermisos)
    rolesRouter.patch('/:id/estado', rolController.cambiarEstado)

    return rolesRouter
}