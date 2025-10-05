// Importa las funciones de validación para los datos del Inventario
import { validateInventario, validatePartialInventario } from '../schemas/inventarios.js'

// Controlador para manejar las operaciones relacionadas con los Inventarios
export class InventarioController {
    // Recibe el modelo de Inventario por inyección de dependencias
    constructor({ inventarioModel }) {
        this.inventarioModel = inventarioModel
    }

    // Obtiene todos los Inventarios
    getAll = async (req, res) => {
        const inventarios = await this.inventarioModel.getAll()
        res.json(inventarios)
    }

    // Obtiene un Inventario por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const inventario = await this.inventarioModel.getById({ id })
        if (inventario) return res.json(inventario)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Inventario no funciona' })

    }

    // Crea un nuevo Inventario después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateInventario(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Inventario y responde con el objeto creado
        const newInventario = await this.inventarioModel.create({ input: result.data })
        res.status(201).json(newInventario)
    }

    // Elimina un Inventario por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.inventarioModel.delete({ id })

        // Si no se encuentra el Inventario, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Inventario no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Inventario eliminado correctamente' })
    }

    // Actualiza un Inventario parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialInventario(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el Inventario y responde con el objeto actualizado
        const updatedInventario = await this.inventarioModel.update({ id, input: result.data })
        res.json(updatedInventario)
    }
}