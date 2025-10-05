import { Router } from 'express'
import { RolPermisoController } from '../controllers/rolpermisos.js'

export const createRolPermisoRouter = ({ rolPermisoModel }) => {
    const rolPermisoRouter = Router()
    const rolPermisoController = new RolPermisoController({ rolPermisoModel })

    rolPermisoRouter.get('/', rolPermisoController.getAll)
    rolPermisoRouter.get('/:id', rolPermisoController.getById)
    rolPermisoRouter.post('/', rolPermisoController.create)
    rolPermisoRouter.delete('/:id', rolPermisoController.delete)
    rolPermisoRouter.patch('/:id', rolPermisoController.update)

    return rolPermisoRouter
}