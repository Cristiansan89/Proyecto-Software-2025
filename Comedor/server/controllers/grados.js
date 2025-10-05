// Importa las funciones de validación para los datos del Grado
import { validateGrado, validatePartialGrado } from '../schemas/grados.js'

// Controlador para manejar las operaciones relacionadas con los Grados
export class GradoController {
    // Recibe el modelo de Grado por inyección de dependencias
    constructor({ gradoModel }) {
        this.gradoModel = gradoModel
    }

    // Obtiene todos los Grados
    getAll = async (req, res) => {
        const grados = await this.gradoModel.getAll()
        res.json(grados)
    }

    // Obtiene un Grado por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const grado = await this.gradoModel.getById({ id })

        if (grado) return res.json(grado)
        res.status(404).json({ message: 'Grado no encontrado' })
    }

    // Crea un nuevo Grado después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateGrado(req.body)

        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const newGrado = await this.gradoModel.create({ input: result.data })
        res.status(201).json(newGrado)
    }

    // Elimina un Grado por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.gradoModel.delete({ id })

        if (!deleted) {
            return res.status(404).json({ message: 'Grado no encontrado' })
        }

        return res.json({ message: 'Grado eliminado' })
    }

    // Actualiza un Grado parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialGrado(req.body)

        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        const updatedGrado = await this.gradoModel.update({ id, input: result.data })

        if (!updatedGrado) {
            return res.status(404).json({ message: 'Grado no encontrado' })
        }

        return res.json(updatedGrado)
    }
}