// Importa las funciones de validación para los datos del itemsReceta
import { validateItemsReceta, validatePartialItemsReceta } from '../schemas/itemsrecetas.js'

// Controlador para manejar las operaciones relacionadas con los ItemsRecetas
export class ItemRecetaController {
    // Recibe el modelo de ItemsReceta por inyección de dependencias
    constructor({ itemsRecetaModel }) {
        this.itemsRecetaModel = itemsRecetaModel
    }

    // Obtiene todos los ItemsReceta
    getAll = async (req, res) => {
        const itemsRecetas = await this.itemsRecetaModel.getAll()
        res.json(itemsRecetas)
    }

    // Obtiene un itemsReceta por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const itemReceta = await this.itemsRecetaModel.getById({ id })

        if (itemReceta) return res.json(itemReceta)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'Item de receta no encontrado' })

    }

    // Crea un nuevo itemsReceta después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateItemsReceta(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo itemsReceta y responde con el objeto creado
        const newItemReceta = await this.itemsRecetaModel.create({ input: result.data })
        res.status(201).json(newItemReceta)
    }

    // Elimina un itemsReceta por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.itemsRecetaModel.delete({ id })

        // Si no se encuentra el itemsReceta, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'Item de receta no encontrado' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Item de receta eliminado' })
    }

    // Actualiza un itemsReceta parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialItemsReceta(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el itemsReceta y responde con el objeto actualizado
        const updatedItemReceta = await this.itemsRecetaModel.update({ id, input: result.data })

        if (!updatedItemReceta) {
            return res.status(404).json({ message: 'Item de receta no encontrado' })
        }

        return res.json(updatedItemReceta)
    }
}