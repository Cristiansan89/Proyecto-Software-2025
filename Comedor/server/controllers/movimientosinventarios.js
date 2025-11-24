// Importa las funciones de validación para los datos del MovimientoInventario
import { validateMovimientosInvetarios, validatePartialMovimientosInvetarios } from '../schemas/movimientosinventarios.js'

// Controlador para manejar las operaciones relacionadas con los MovimientosInventarios
export class MovimientoInventarioController {
    // Recibe el modelo de MovimientoInventario por inyección de dependencias
    constructor({ movimientoInventarioModel }) {
        this.movimientoInventarioModel = movimientoInventarioModel
    }

    // Obtiene todos los MovimientosInventarios
    getAll = async (req, res) => {
        try {
            const movimientos = await this.movimientoInventarioModel.getAll()
            res.json(movimientos)
        } catch (error) {
            console.error('Error al obtener movimientos de inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un MovimientoInventario por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const movimiento = await this.movimientoInventarioModel.getById({ id })

            if (movimiento) return res.json(movimiento)
            res.status(404).json({ message: 'Movimiento de inventario no encontrado' })
        } catch (error) {
            console.error('Error al obtener movimiento de inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo MovimientoInventario después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateMovimientosInvetarios(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newMovimiento = await this.movimientoInventarioModel.create({ input: result.data })
            res.status(201).json(newMovimiento)
        } catch (error) {
            console.error('Error al crear movimiento de inventario:', error)
            if (error.message.includes('stock insuficiente')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un MovimientoInventario por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.movimientoInventarioModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Movimiento de inventario no encontrado' })
            }
            return res.json({ message: 'Movimiento de inventario eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar movimiento de inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un MovimientoInventario parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialMovimientosInvetarios(req.body)

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
            const updatedMovimiento = await this.movimientoInventarioModel.update({ id, input: result.data })

            if (!updatedMovimiento) {
                return res.status(404).json({ message: 'Movimiento de inventario no encontrado' })
            }

            return res.json(updatedMovimiento)
        } catch (error) {
            console.error('Error al actualizar movimiento de inventario:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener movimientos por insumo
    getByInsumo = async (req, res) => {
        try {
            const { id_insumo } = req.params
            const movimientos = await this.movimientoInventarioModel.getMovimientosByInsumo({ id_insumo })
            res.json(movimientos)
        } catch (error) {
            console.error('Error al obtener movimientos por insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener movimientos por rango de fechas
    getByDateRange = async (req, res) => {
        try {
            const { fechaInicio, fechaFin } = req.query

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({ message: 'Fecha de inicio y fin son requeridas' })
            }

            const movimientos = await this.movimientoInventarioModel.getMovimientosByDateRange({ fechaInicio, fechaFin })
            res.json(movimientos)
        } catch (error) {
            console.error('Error al obtener movimientos por rango de fechas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener movimientos por tipo
    getByTipo = async (req, res) => {
        try {
            const { tipo } = req.params
            const movimientos = await this.movimientoInventarioModel.getMovimientosByTipo({ tipo })
            res.json(movimientos)
        } catch (error) {
            console.error('Error al obtener movimientos por tipo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener movimientos por fecha
    getByFecha = async (req, res) => {
        try {
            const { fecha } = req.params
            const movimientos = await this.movimientoInventarioModel.getByFecha({ fecha })
            res.json(movimientos)
        } catch (error) {
            console.error('Error al obtener movimientos por fecha:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener movimientos por rango de fechas
    getByRangoFechas = async (req, res) => {
        try {
            const { fechaInicio, fechaFin } = req.query
            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({ message: 'fechaInicio y fechaFin son requeridos' })
            }
            const movimientos = await this.movimientoInventarioModel.getByRangoFechas({ fechaInicio, fechaFin })
            res.json(movimientos)
        } catch (error) {
            console.error('Error al obtener movimientos por rango de fechas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Registrar entrada de inventario
    registrarEntrada = async (req, res) => {
        try {
            const { id_insumo, cantidad, motivo, observaciones } = req.body

            if (!id_insumo || !cantidad) {
                return res.status(400).json({ message: 'id_insumo y cantidad son requeridos' })
            }

            const result = await this.movimientoInventarioModel.registrarEntrada({
                id_insumo,
                cantidad,
                motivo,
                observaciones
            })

            res.status(201).json(result)
        } catch (error) {
            console.error('Error al registrar entrada:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Registrar salida de inventario
    registrarSalida = async (req, res) => {
        try {
            const { id_insumo, cantidad, motivo, observaciones } = req.body

            if (!id_insumo || !cantidad) {
                return res.status(400).json({ message: 'id_insumo y cantidad son requeridos' })
            }

            const result = await this.movimientoInventarioModel.registrarSalida({
                id_insumo,
                cantidad,
                motivo,
                observaciones
            })

            res.status(201).json(result)
        } catch (error) {
            console.error('Error al registrar salida:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}