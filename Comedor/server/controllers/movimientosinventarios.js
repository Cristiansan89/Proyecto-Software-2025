// Importa las funciones de validación para los datos del MovimientoInvetario
import { validateMovimientosInvetarios, validatePartialMovimientosInvetarios } from '../schemas/movimientosinventarios.js'

// Controlador para manejar las operaciones relacionadas con los MovimientosInvetarios
export class MovimientoInventarioController {
    // Recibe el modelo de MovimientoInvetario por inyección de dependencias
    constructor({ movimientoInventarioModel }) {
        this.movimientoInventarioModel = movimientoInventarioModel
    }

    // Obtiene todos los MovimientosInvetarios
    getAll = async (req, res) => {
        const movimientos = await this.movimientoInventarioModel.getAll()
        res.json(movimientos)
    }

    // Obtiene un MovimientoInvetario por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const movimiento = await this.movimientoInventarioModel.getById({ id })

        if (movimiento) return res.json(movimiento)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'Movimiento de inventario no encontrado' })
    }

    // Crea un nuevo MovimientoInvetario después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateMovimientosInvetarios(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo MovimientoInvetario y responde con el objeto creado
        const newMovimiento = await this.movimientoInventarioModel.create({ input: result.data })
        res.status(201).json(newMovimiento)
    }

    // Elimina un MovimientoInvetario por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.movimientoInventarioModel.delete({ id })

        // Si no se encuentra el MovimientoInvetario, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'Movimiento de inventario no encontrado' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Movimiento de inventario eliminado' })
    }

    // Actualiza un MovimientoInvetario parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialMovimientosInvetarios(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el MovimientoInvetario y responde con el objeto actualizado
        const updatedMovimiento = await this.movimientoInventarioModel.update({ id, input: result.data })

        if (!updatedMovimiento) {
            return res.status(404).json({ message: 'Movimiento de inventario no encontrado' })
        }

        return res.json(updatedMovimiento)
    }
}