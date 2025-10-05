// Importa las funciones de validación para los datos del Usuario
import { validateUsuario, validatePartialUsuario } from '../schemas/usuarios.js'

// Controlador para manejar las operaciones relacionadas con los Usuarios
export class UsuarioController {
    // Recibe el modelo de Usuario por inyección de dependencias
    constructor({ usuarioModel }) {
        this.usuarioModel = usuarioModel
    }

    // Obtiene todos los Usuarios
    getAll = async (req, res) => {
        const usuarios = await this.usuarioModel.getAll()
        res.json(usuarios)
    }

    // Obtiene un Usuario por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const usuario = await this.usuarioModel.getById({ id })
        if (usuario) return res.json(usuario)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Usuario no funciona' })

    }

    // Crea un nuevo Usuario después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateUsuario(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Usuario y responde con el objeto creado
        const newUsuario = await this.usuarioModel.create({ input: result.data })
        res.status(201).json(newUsuario)
    }

    // Elimina un Usuario por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.usuarioModel.delete({ id })

        // Si no se encuentra el Usuario, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Usuario no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Usuario eliminado correctamente' })
    }

    // Actualiza un Usuario parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialUsuario(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el Usuario y responde con el objeto actualizado
        const updatedUsuario = await this.usuarioModel.update({ id, input: result.data })
        res.json(updatedUsuario)
    }
}