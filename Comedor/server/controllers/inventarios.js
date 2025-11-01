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
        try {
            const inventarios = await this.inventarioModel.getAll()
            res.json(inventarios)
        } catch (error) {
            console.error('Error al obtener inventarios:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Inventario por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const inventario = await this.inventarioModel.getById({ id })
            if (inventario) return res.json(inventario)
            res.status(404).json({ message: 'Inventario no encontrado' })
        } catch (error) {
            console.error('Error al obtener inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Inventario después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateInventario(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newInventario = await this.inventarioModel.create({ input: result.data })
            res.status(201).json(newInventario)
        } catch (error) {
            console.error('Error al crear inventario:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Inventario por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.inventarioModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Inventario no encontrado' })
            }
            return res.json({ message: 'Inventario eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Inventario parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialInventario(req.body)

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
            const updatedInventario = await this.inventarioModel.update({ id, input: result.data })

            if (!updatedInventario) {
                return res.status(404).json({ message: 'Inventario no encontrado' })
            }

            res.json(updatedInventario)
        } catch (error) {
            console.error('Error al actualizar inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener inventarios con stock bajo
    getStockBajo = async (req, res) => {
        try {
            const inventarios = await this.inventarioModel.getInventariosStockBajo()
            res.json(inventarios)
        } catch (error) {
            console.error('Error al obtener inventarios con stock bajo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener inventarios por ubicación
    getByUbicacion = async (req, res) => {
        try {
            const { ubicacion } = req.params
            const inventarios = await this.inventarioModel.getInventariosByUbicacion({ ubicacion })
            res.json(inventarios)
        } catch (error) {
            console.error('Error al obtener inventarios por ubicación:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualizar stock
    updateStock = async (req, res) => {
        try {
            const { id } = req.params
            const { cantidadActual } = req.body

            if (typeof cantidadActual !== 'number' || cantidadActual < 0) {
                return res.status(400).json({ message: 'La cantidad actual debe ser un número no negativo' })
            }

            const updatedInventario = await this.inventarioModel.updateStock({ id, cantidadActual })

            if (!updatedInventario) {
                return res.status(404).json({ message: 'Inventario no encontrado' })
            }

            res.json({ message: 'Stock actualizado correctamente', inventario: updatedInventario })
        } catch (error) {
            console.error('Error al actualizar stock:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener inventario por insumo
    getByInsumo = async (req, res) => {
        try {
            const { id_insumo } = req.params
            const inventario = await this.inventarioModel.getByInsumo({ id_insumo })
            res.json(inventario)
        } catch (error) {
            console.error('Error al obtener inventario por insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Ajustar stock
    ajustarStock = async (req, res) => {
        try {
            const { id } = req.params
            const { cantidadAjuste, motivo } = req.body

            if (typeof cantidadAjuste !== 'number') {
                return res.status(400).json({ message: 'La cantidad de ajuste debe ser un número' })
            }

            const result = await this.inventarioModel.ajustarStock({ id, cantidadAjuste, motivo })

            if (!result) {
                return res.status(404).json({ message: 'Inventario no encontrado' })
            }

            res.json(result)
        } catch (error) {
            console.error('Error al ajustar stock:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener estadísticas del inventario
    getEstadisticas = async (req, res) => {
        try {
            const estadisticas = await this.inventarioModel.getEstadisticas()
            res.json(estadisticas)
        } catch (error) {
            console.error('Error al obtener estadísticas del inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}