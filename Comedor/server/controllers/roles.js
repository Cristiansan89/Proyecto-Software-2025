// Importa las funciones de validación para los datos del rol
import { validateRol, validatePartialRol } from '../schemas/roles.js'

// Controlador para manejar las operaciones relacionadas con los roles
export class RolController {
    // Recibe el modelo de rol por inyección de dependencias
    constructor({ rolModel }) {
        this.rolModel = rolModel
    }

    // Obtiene todos los roles o filtra por nombre_rol si se pasa como query
    getAll = async (req, res) => {
        const { nombre_rol } = req.query
        const roles = await this.rolModel.getAll({ nombre_rol })
        res.json(roles)
    }

    // Obtiene un rol por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const rol = await this.rolModel.getById({ id })
        if (rol) return res.json(rol)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Rol no funciona' })
    }

    // Crea un nuevo rol después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateRol(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo rol y responde con el objeto creado
        const newRol = await this.rolModel.create({ input: result.data })
        res.status(201).json(newRol)
    }

    // Elimina un rol por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.rolModel.delete({ id })

        // Si no se encuentra el rol, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Rol no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Rol eliminado correctamente' })
    }

    // Actualiza un rol parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialRol(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el rol y responde con el objeto actualizado
        const updatedRol = await this.rolModel.update({ id, input: result.data })
        res.json(updatedRol)
    }
}