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

    return rolesRouter
}