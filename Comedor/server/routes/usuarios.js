import { Router } from 'express'
import { UsuarioController } from '../controllers/usuarios.js'
import { verificarPermiso } from '../middlewares/verificarPermiso.js'

export const createUsuarioRouter = ({ usuarioModel }) => {
    const usuariosRouter = Router()
    const usuarioController = new UsuarioController({ usuarioModel })

    // Lectura - Sin protección especial (usuarios pueden consultar su propio perfil)
    usuariosRouter.get('/activos/list', usuarioController.getActivos)
    usuariosRouter.get('/search/by-nombre', usuarioController.searchByNombre)
    usuariosRouter.get('/rol/:id_rol', usuarioController.getByRol)
    usuariosRouter.get('/:id', usuarioController.getById)
    usuariosRouter.get('/', usuarioController.getAll)

    // Creación - Protegido
    usuariosRouter.post('/', verificarPermiso('Usuarios', 'Registrar'), usuarioController.create)
    
    // Modificación - Protegido
    usuariosRouter.patch('/:id', verificarPermiso('Usuarios', 'Modificar'), usuarioController.update)
    usuariosRouter.patch('/:id/estado', verificarPermiso('Usuarios', 'Modificar'), usuarioController.cambiarEstado)
    
    // Eliminación - Protegido
    usuariosRouter.delete('/:id', verificarPermiso('Usuarios', 'Eliminar'), usuarioController.delete)

    return usuariosRouter
}