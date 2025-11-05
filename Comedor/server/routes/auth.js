import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

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
                nombreUsuario: usuario.nombreUsuario,
                nombres: usuario.nombres,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.nombreRol,
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

    return authRouter
}