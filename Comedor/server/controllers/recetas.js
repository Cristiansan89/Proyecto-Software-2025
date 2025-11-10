// Importa las funciones de validación para los datos del Receta
import { validateReceta, validatePartialReceta } from '../schemas/recetas.js'
import { validateItemsReceta, validatePartialItemsReceta } from '../schemas/itemsrecetas.js'

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
                const errors = result.error.errors || result.error.issues || [];
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: errors.map(err => ({
                        field: err.path?.join('.') || 'campo desconocido',
                        message: err.message || 'Error de validación'
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
                const errors = result.error.errors || result.error.issues || [];
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: errors.map(err => ({
                        field: err.path?.join('.') || 'campo desconocido',
                        message: err.message || 'Error de validación'
                    }))
                })
            }

            const { id } = req.params
            const { nombreReceta, instrucciones, unidadSalida, estado } = result.data
            const updated = await this.recetaModel.update({
                id,
                nombreReceta,
                instrucciones,
                unidadSalida,
                estado
            })

            if (!updated) {
                return res.status(404).json({ message: 'Receta no encontrada' })
            }

            // Obtener la receta actualizada
            const updatedReceta = await this.recetaModel.getById({ id })
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
            if (!nombre) {
                return res.status(400).json({ message: 'El parámetro nombre es requerido' })
            }
            const recetas = await this.recetaModel.searchByNombre({ nombre })
            res.json(recetas)
        } catch (error) {
            console.error('Error al buscar recetas por nombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener recetas activas
    getActivas = async (req, res) => {
        try {
            const recetas = await this.recetaModel.getRecetasActivas()
            res.json(recetas)
        } catch (error) {
            console.error('Error al obtener recetas activas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener recetas con conteo de insumos
    getAllWithInsumoCount = async (req, res) => {
        try {
            const recetas = await this.recetaModel.getAllWithInsumoCount()
            res.json(recetas)
        } catch (error) {
            console.error('Error al obtener recetas con conteo de insumos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener receta con sus insumos
    getWithInsumos = async (req, res) => {
        try {
            const { id } = req.params
            const receta = await this.recetaModel.getRecetaWithInsumos({ id })

            if (!receta) {
                return res.status(404).json({ message: 'Receta no encontrada' })
            }

            res.json(receta)
        } catch (error) {
            console.error('Error al obtener receta con insumos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Agregar insumo a una receta
    addInsumo = async (req, res) => {
        try {
            const { id } = req.params
            const inputData = { ...req.body, id_receta: id }

            // Validar los datos de entrada
            const result = validateItemsReceta(inputData)
            if (!result.success) {
                const errors = result.error.errors || result.error.issues || [];
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: errors.map(err => ({
                        field: err.path?.join('.') || 'campo desconocido',
                        message: err.message || 'Error de validación'
                    }))
                })
            }

            const { id_insumo, cantidadPorPorcion, unidadPorPorcion } = result.data

            const resultAdd = await this.recetaModel.addInsumo({
                id_receta: id,
                id_insumo,
                cantidadPorPorcion,
                unidadPorPorcion
            })

            res.status(201).json(resultAdd)
        } catch (error) {
            console.error('Error al agregar insumo a receta:', error)
            if (error.message.includes('ya está agregado')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualizar insumo en una receta
    updateInsumo = async (req, res) => {
        try {
            const { id_item } = req.params

            // Validar los datos de entrada
            const result = validatePartialItemsReceta(req.body)
            if (!result.success) {
                const errors = result.error.errors || result.error.issues || [];
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: errors.map(err => ({
                        field: err.path?.join('.') || 'campo desconocido',
                        message: err.message || 'Error de validación'
                    }))
                })
            }

            const { cantidadPorPorcion, unidadPorPorcion } = result.data

            const resultUpdate = await this.recetaModel.updateInsumo({
                id_item,
                cantidadPorPorcion,
                unidadPorPorcion
            })

            res.json(resultUpdate)
        } catch (error) {
            console.error('Error al actualizar insumo en receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Remover insumo de una receta
    removeInsumo = async (req, res) => {
        try {
            const { id_item } = req.params
            const result = await this.recetaModel.removeInsumo({ id_item })

            if (!result.success) {
                return res.status(404).json({ message: result.message })
            }

            res.json(result)
        } catch (error) {
            console.error('Error al remover insumo de receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}