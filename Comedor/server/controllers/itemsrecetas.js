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
        try {
            const itemsRecetas = await this.itemsRecetaModel.getAll()
            res.json(itemsRecetas)
        } catch (error) {
            console.error('Error al obtener items de recetas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un itemsReceta por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const itemReceta = await this.itemsRecetaModel.getById({ id })

            if (itemReceta) return res.json(itemReceta)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Item de receta no encontrado' })
        } catch (error) {
            console.error('Error al obtener item de receta por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo itemsReceta después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateItemsReceta(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            // Crea el nuevo itemsReceta y responde con el objeto creado
            const newItemReceta = await this.itemsRecetaModel.create({ input: result.data })
            res.status(201).json(newItemReceta)
        } catch (error) {
            console.error('Error al crear item de receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un itemsReceta por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.itemsRecetaModel.delete({ id })

            // Si no se encuentra el itemsReceta, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Item de receta no encontrado' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Item de receta eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar item de receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un itemsReceta parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialItemsReceta(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const { id } = req.params
            // Actualiza el itemsReceta y responde con el objeto actualizado
            const updatedItemReceta = await this.itemsRecetaModel.update({ id, input: result.data })

            if (!updatedItemReceta) {
                return res.status(404).json({ message: 'Item de receta no encontrado' })
            }

            return res.json(updatedItemReceta)
        } catch (error) {
            console.error('Error al actualizar item de receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener items por receta
    getByReceta = async (req, res) => {
        try {
            const { id_receta } = req.params
            const items = await this.itemsRecetaModel.getByReceta({ id_receta })
            res.json(items)
        } catch (error) {
            console.error('Error al obtener items por receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener items por insumo
    getByInsumo = async (req, res) => {
        try {
            const { id_insumo } = req.params
            const items = await this.itemsRecetaModel.getByInsumo({ id_insumo })
            res.json(items)
        } catch (error) {
            console.error('Error al obtener items por insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Calcular costo total de receta
    getCostoTotalReceta = async (req, res) => {
        try {
            const { id_receta } = req.params
            const costoTotal = await this.itemsRecetaModel.getCostoTotalReceta({ id_receta })
            res.json({ costo_total: costoTotal })
        } catch (error) {
            console.error('Error al calcular costo total de receta:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}