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
        try {
            const recetas = await this.recetaModel.getAll()
            res.json(recetas)
        } catch (error) {
            console.error('Error al obtener recetas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Receta por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const receta = await this.recetaModel.getById({ id })

            if (receta) return res.json(receta)
            res.status(404).json({ message: 'Receta no encontrada' })
        } catch (error) {
            console.error('Error al obtener receta por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Receta después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateReceta(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            // Crea el nuevo Receta y responde con el objeto creado
            const newReceta = await this.recetaModel.create({ input: result.data })
            res.status(201).json(newReceta)
        } catch (error) {
            console.error('Error al crear receta:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Receta por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.recetaModel.delete({ id })

            // Si no se encuentra el Receta, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Receta no encontrada' })
            }

            return res.json({ message: 'Receta eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Receta parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialReceta(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const { id } = req.params
            const updatedReceta = await this.recetaModel.update({ id, input: result.data })

            if (!updatedReceta) {
                return res.status(404).json({ message: 'Receta no encontrada' })
            }

            return res.json(updatedReceta)
        } catch (error) {
            console.error('Error al actualizar receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar recetas por nombre
    searchByNombre = async (req, res) => {
        try {
            const { nombre } = req.query
            const recetas = await this.recetaModel.searchByNombre({ nombre })
            res.json(recetas)
        } catch (error) {
            console.error('Error al buscar recetas por nombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener recetas por tipo
    getByTipo = async (req, res) => {
        try {
            const { tipo } = req.params
            const recetas = await this.recetaModel.getByTipo({ tipo })
            res.json(recetas)
        } catch (error) {
            console.error('Error al obtener recetas por tipo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener recetas activas
    getActivas = async (req, res) => {
        try {
            const recetas = await this.recetaModel.getActivas()
            res.json(recetas)
        } catch (error) {
            console.error('Error al obtener recetas activas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener receta con sus ingredientes
    getConIngredientes = async (req, res) => {
        try {
            const { id } = req.params
            const receta = await this.recetaModel.getConIngredientes({ id })
            if (receta) return res.json(receta)
            res.status(404).json({ message: 'Receta no encontrada' })
        } catch (error) {
            console.error('Error al obtener receta con ingredientes:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}