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

    // Endpoints especializados
    rolPermisoRouter.get('/rol/:id_rol/permisos', rolPermisoController.getPermisosByRol)
    rolPermisoRouter.get('/permiso/:id_permiso/roles', rolPermisoController.getRolesByPermiso)
    rolPermisoRouter.post('/rol/:id_rol/asignar-permisos', rolPermisoController.asignarPermisosRol)
    rolPermisoRouter.delete('/rol/:id_rol/permiso/:id_permiso', rolPermisoController.revocarPermisoRol)

    return rolPermisoRouter
}