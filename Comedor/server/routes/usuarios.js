import { Router } from 'express'
import { UsuarioController } from '../controllers/usuarios.js'

export const createUsuarioRouter = ({ usuarioModel }) => {
    const usuariosRouter = Router()
    const usuarioController = new UsuarioController({ usuarioModel })

    usuariosRouter.get('/', usuarioController.getAll)
    usuariosRouter.get('/:id', usuarioController.getById)
    usuariosRouter.post('/', usuarioController.create)
    usuariosRouter.delete('/:id', usuarioController.delete)
    usuariosRouter.patch('/:id', usuarioController.update)

    // Endpoints especializados
    usuariosRouter.get('/activos/list', usuarioController.getActivos)
    usuariosRouter.get('/search/by-nombre', usuarioController.searchByNombre)
    usuariosRouter.get('/rol/:id_rol', usuarioController.getByRol)
    usuariosRouter.patch('/:id/estado', usuarioController.cambiarEstado)
    usuariosRouter.post('/login', usuarioController.login)

    return usuariosRouter
}