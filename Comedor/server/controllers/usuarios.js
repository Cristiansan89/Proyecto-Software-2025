// Importa las funciones de validación para los datos del Usuario
import { validateUsuario, validatePartialUsuario } from '../schemas/usuarios.js'
import { sendWelcomeEmail } from '../services/emailService.js'

// Controlador para manejar las operaciones relacionadas con los Usuarios
export class UsuarioController {
    // Recibe el modelo de Usuario por inyección de dependencias
    constructor({ usuarioModel }) {
        this.usuarioModel = usuarioModel
    }

    // Obtiene todos los Usuarios
    getAll = async (req, res) => {
        try {
            const usuarios = await this.usuarioModel.getAll()
            res.json(usuarios)
        } catch (error) {
            console.error('Error al obtener usuarios:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Usuario por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const usuario = await this.usuarioModel.getById({ id })
            if (usuario) return res.json(usuario)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Usuario no encontrado' })
        } catch (error) {
            console.error('Error al obtener usuario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Usuario después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateUsuario(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            // Guardar la contraseña original antes de hashearla
            const originalPassword = result.data.contrasena;

            // Crea el nuevo Usuario y responde con el objeto creado
            const newUsuario = await this.usuarioModel.create({ input: result.data })

            // Enviar correo de bienvenida con el usuario y contraseña creados
            try {
                await sendWelcomeEmail(
                    newUsuario.mail || '',
                    newUsuario.nombreUsuario,
                    originalPassword // Usar la contraseña original antes del hash
                );
                console.log('Correo de bienvenida enviado a:', newUsuario.mail);
            } catch (emailError) {
                console.error('Error enviando correo de bienvenida:', emailError);
                // No interrumpir el flujo si falla el email
            }

            res.status(201).json(newUsuario)
        } catch (error) {
            console.error('Error al crear usuario:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Usuario por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.usuarioModel.delete({ id })

            // Si no se encuentra el Usuario, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Usuario no encontrado' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Usuario eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar usuario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Usuario parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialUsuario(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const { id } = req.params
            // Actualiza el Usuario y responde con el objeto actualizado
            const updatedUsuario = await this.usuarioModel.update({ id, input: result.data })

            if (!updatedUsuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' })
            }

            res.json(updatedUsuario)
        } catch (error) {
            console.error('Error al actualizar usuario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener usuarios activos
    getActivos = async (req, res) => {
        try {
            const usuarios = await this.usuarioModel.getActivos()
            res.json(usuarios)
        } catch (error) {
            console.error('Error al obtener usuarios activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar usuarios por nombre
    searchByNombre = async (req, res) => {
        try {
            const { nombre } = req.query
            const usuarios = await this.usuarioModel.searchByNombre({ nombre })
            res.json(usuarios)
        } catch (error) {
            console.error('Error al buscar usuarios por nombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener usuarios por rol
    getByRol = async (req, res) => {
        try {
            const { id_rol } = req.params
            const usuarios = await this.usuarioModel.getByRol({ id_rol })
            res.json(usuarios)
        } catch (error) {
            console.error('Error al obtener usuarios por rol:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del usuario
    cambiarEstado = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ message: 'Estado inválido' })
            }

            const updatedUsuario = await this.usuarioModel.update({ id, input: { estado } })

            if (!updatedUsuario) {
                return res.status(404).json({ message: 'Usuario no encontrado' })
            }

            res.json({ message: `Usuario ${estado.toLowerCase()} correctamente`, usuario: updatedUsuario })
        } catch (error) {
            console.error('Error al cambiar estado del usuario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Login de usuario
    login = async (req, res) => {
        try {
            const { nombre_usuario, contrasena } = req.body
            const usuario = await this.usuarioModel.login({ nombre_usuario, contrasena })

            if (!usuario) {
                return res.status(401).json({ message: 'Credenciales inválidas' })
            }

            res.json({ message: 'Login exitoso', usuario })
        } catch (error) {
            console.error('Error en login:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Método legacy - mantener para compatibilidad
    changeStatus = async (req, res) => {
        return this.cambiarEstado(req, res)
    }
}