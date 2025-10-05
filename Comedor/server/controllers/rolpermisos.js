// Importa las funciones de validación para los datos del RolPermiso
import { validateRolPermiso, validatePartialRolPermiso } from '../schemas/rolpermisos.js'

// Controlador para manejar las operaciones relacionadas con los RolPermisos
export class RolPermisoController {
    // Recibe el modelo de RolPermiso por inyección de dependencias
    constructor({ rolPermisoModel }) {
        this.rolPermisoModel = rolPermisoModel
    }

    // Obtiene todos los RolPermisos
    getAll = async (req, res) => {
        const rolPermisos = await this.rolPermisoModel.getAll()
        res.json(rolPermisos)
    }

    // Obtiene un RolPermiso por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const rolPermiso = await this.rolPermisoModel.getById({ id })
        if (rolPermiso) return res.json(rolPermiso)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del RolPermiso no funciona' })

    }

    // Crea un nuevo RolPermiso después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateRolPermiso(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo RolPermiso y responde con el objeto creado
        const newRolPermiso = await this.rolPermisoModel.create({ input: result.data })
        res.status(201).json(newRolPermiso)
    }

    // Elimina un RolPermiso por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.rolPermisoModel.delete({ id })

        // Si no se encuentra el RolPermiso, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del RolPermiso no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'RolPermiso eliminado correctamente' })
    }

    // Actualiza un RolPermiso parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialRolPermiso(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el RolPermiso y responde con el objeto actualizado
        const updatedRolPermiso = await this.rolPermisoModel.update({ id, input: result.data })
        res.json(updatedRolPermiso)
    }
}