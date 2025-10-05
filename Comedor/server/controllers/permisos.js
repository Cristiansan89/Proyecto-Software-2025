// Importa las funciones de validación para los datos del Permiso
import { validatePermiso, validatePartialPermiso } from '../schemas/permisos.js'

// Controlador para manejar las operaciones relacionadas con los Permisos
export class PermisoController {
    // Recibe el modelo de Permiso por inyección de dependencias
    constructor({ permisoModel }) {
        this.permisoModel = permisoModel
    }

    // Obtiene todos los Permisos
    getAll = async (req, res) => {
        const permisos = await this.permisoModel.getAll()
        res.json(permisos)
    }

    // Obtiene un Permiso por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const permiso = await this.permisoModel.getById({ id })
        if (permiso) return res.json(permiso)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Permiso no funciona' })

    }

    // Crea un nuevo Permiso después de validar los datos recibidos
    create = async (req, res) => {
        const result = validatePermiso(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Permiso y responde con el objeto creado
        const newPermiso = await this.permisoModel.create({ input: result.data })
        res.status(201).json(newPermiso)
    }

    // Elimina un Permiso por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.permisoModel.delete({ id })

        // Si no se encuentra el Permiso, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Permiso no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Permiso eliminado correctamente' })
    }

    // Actualiza un Permiso parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialPermiso(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el Permiso y responde con el objeto actualizado
        const updatedPermiso = await this.permisoModel.update({ id, input: result.data })
        res.json(updatedPermiso)
    }
}