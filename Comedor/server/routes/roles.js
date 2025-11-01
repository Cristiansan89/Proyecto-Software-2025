import { Router } from 'express'
import { RolController } from '../controllers/roles.js'

export const createRolRouter = ({ rolModel }) => {
    const rolesRouter = Router()
    const rolController = new RolController({ rolModel })

    rolesRouter.get('/', rolController.getAll)
    rolesRouter.get('/:id', rolController.getById)
    rolesRouter.post('/', rolController.create)
    rolesRouter.delete('/:id', rolController.delete)
    rolesRouter.patch('/:id', rolController.update)

    // Endpoints especializados
    rolesRouter.get('/activos/list', rolController.getActivos)
    rolesRouter.get('/search/by-nombre', rolController.searchByNombre)
    rolesRouter.get('/:id/permisos', rolController.getConPermisos)
    rolesRouter.patch('/:id/estado', rolController.cambiarEstado)

    return rolesRouter
}