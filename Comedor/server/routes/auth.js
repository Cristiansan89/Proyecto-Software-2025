import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { forgotPassword, changePassword } from '../controllers/passwordController.js'
import { authRequired } from '../middlewares/auth.js'

export const createAuthRouter = ({ usuarioModel }) => {
    const authRouter = Router()

    authRouter.post('/login', async (req, res) => {
        try {
            const { nombreUsuario, contrasena } = req.body

            if (!nombreUsuario || !contrasena) {
                return res.status(400).json({
                    message: 'Usuario y contraseña son requeridos'
                })
            }

            const usuario = await usuarioModel.getByUsername(nombreUsuario)

            if (!usuario) {
                return res.status(401).json({
                    message: 'Usuario o contraseña incorrectos'
                })
            }

            const validPassword = await bcrypt.compare(contrasena, usuario.contrasena)

            if (!validPassword) {
                return res.status(401).json({
                    message: 'Usuario o contraseña incorrectos'
                })
            }

            // Actualizar la última actividad del usuario
            await usuarioModel.updateLastActivity({ id: usuario.idUsuario })

            const token = jwt.sign(
                {
                    id: usuario.idUsuario,
                    nombreUsuario: usuario.nombreUsuario,
                    rol: usuario.nombreRol
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            )

            const userData = {
                idUsuario: usuario.idUsuario,
                idPersona: usuario.idPersona,
                nombreUsuario: usuario.nombreUsuario,
                nombres: usuario.nombres,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.nombreRol,
                nombre_rol: usuario.nombreRol, // Para compatibilidad
                mail: usuario.mail,
                telefono: usuario.telefono
            }

            res.json({
                token,
                user: userData
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({
                message: 'Error al intentar iniciar sesión'
            })
        }
    })

    // Rutas para recuperación de contraseña
    authRouter.post('/forgot-password', async (req, res) => {
        await forgotPassword(req, res, usuarioModel)
    })

    // Ruta para cambiar contraseña (requiere autenticación)
    authRouter.post('/change-password', authRequired, async (req, res) => {
        await changePassword(req, res, usuarioModel)
    })

    return authRouter
}