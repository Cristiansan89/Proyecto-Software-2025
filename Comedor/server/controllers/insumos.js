// Importa las funciones de validación para los datos del Insumo
import { validateInsumo, validatePartialInsumo } from '../schemas/insumos.js'

// Controlador para manejar las operaciones relacionadas con los Insumos
export class InsumoController {
    // Recibe el modelo de Insumo por inyección de dependencias
    constructor({ insumoModel }) {
        this.insumoModel = insumoModel
    }

    // Obtiene todos los Insumos
    getAll = async (req, res) => {
        const insumos = await this.insumoModel.getAll()
        res.json(insumos)
    }

    // Obtiene un Insumo por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const insumo = await this.insumoModel.getById({ id })
        if (insumo) return res.json(insumo)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Insumo no funciona' })

    }

    // Crea un nuevo Insumo después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateInsumo(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Insumo y responde con el objeto creado
        const newInsumo = await this.insumoModel.create({ input: result.data })
        res.status(201).json(newInsumo)
    }

    // Elimina un Insumo por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.insumoModel.delete({ id })

        // Si no se encuentra el Insumo, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Insumo no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Insumo eliminado correctamente' })
    }

    // Actualiza un Insumo parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialInsumo(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el Insumo y responde con el objeto actualizado
        const updatedInsumo = await this.insumoModel.update({ id, input: result.data })
        res.json(updatedInsumo)
    }
}