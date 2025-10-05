// Importa las funciones de validación para los datos del Receta
import { validateReceta, validatePartialReceta } from '../schemas/recetas.js'

// Controlador para manejar las operaciones relacionadas con los Recetas
export class RecetaController {
    // Recibe el modelo de Receta por inyección de dependencias
    constructor({ recetaModel }) {
        this.recetaModel = recetaModel
    }

    // Obtiene todos los Recetas
    getAll = async (req, res) => {
        const recetas = await this.recetaModel.getAll()
        res.json(recetas)
    }

    // Obtiene un Receta por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const receta = await this.recetaModel.getById({ id })

        if (receta) return res.json(receta)
        res.status(404).json({ message: 'Receta no encontrada' })
    }

    // Crea un nuevo Receta después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateReceta(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Receta y responde con el objeto creado
        const newReceta = await this.recetaModel.create({ input: result.data })
        res.status(201).json(newReceta)
    }

    // Elimina un Receta por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.recetaModel.delete({ id })

        // Si no se encuentra el Receta, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'Receta no encontrada' })
        }

        return res.json({ message: 'Receta eliminada' })
    }

    // Actualiza un Receta parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialReceta(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        const updatedReceta = await this.recetaModel.update({ id, input: result.data })

        if (!updatedReceta) {
            return res.status(404).json({ message: 'Receta no encontrada' })
        }

        return res.json(updatedReceta)
    }
}