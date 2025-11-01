// Importa las funciones de validación para los datos del LineaPedido
import { validateLineaPedido, validatePartialLineaPedido } from '../schemas/lineaspedidos.js'

// Controlador para manejar las operaciones relacionadas con las LineaPedido
export class LineaPedidoController {
    // Recibe el modelo de LineaPedido por inyección de dependencias
    constructor({ lineaPedidoModel }) {
        this.lineaPedidoModel = lineaPedidoModel
    }

    // Obtiene todos las LineaPedido
    getAll = async (req, res) => {
        try {
            const lineasPedido = await this.lineaPedidoModel.getAll()
            res.json(lineasPedido)
        } catch (error) {
            console.error('Error al obtener líneas de pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un LineaPedido por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const lineasPedido = await this.lineaPedidoModel.getById({ id })
            if (lineasPedido) return res.json(lineasPedido)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Línea de pedido no encontrada' })
        } catch (error) {
            console.error('Error al obtener línea de pedido por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo LineaPedido después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateLineaPedido(req.body)

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

            // Crea el nuevo LineaPedido y responde con el objeto creado
            const newLineaPedido = await this.lineaPedidoModel.create({ input: result.data })
            res.status(201).json(newLineaPedido)
        } catch (error) {
            console.error('Error al crear línea de pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un LineaPedido por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.lineaPedidoModel.delete({ id })

            // Si no se encuentra el LineaPedido, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Línea de pedido no encontrada' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Línea de pedido eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar línea de pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un LineaPedido parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialLineaPedido(req.body)

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
            // Actualiza el LineaPedido y responde con el objeto actualizado
            const updatedLineaPedido = await this.lineaPedidoModel.update({ id, input: result.data })

            if (!updatedLineaPedido) {
                return res.status(404).json({ message: 'Línea de pedido no encontrada' })
            }

            return res.json(updatedLineaPedido)
        } catch (error) {
            console.error('Error al actualizar línea de pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener líneas de pedido por pedido
    getByPedido = async (req, res) => {
        try {
            const { id_pedido } = req.params
            const lineas = await this.lineaPedidoModel.getByPedido({ id_pedido })
            res.json(lineas)
        } catch (error) {
            console.error('Error al obtener líneas por pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener total del pedido
    getTotalPedido = async (req, res) => {
        try {
            const { id_pedido } = req.params
            const total = await this.lineaPedidoModel.getTotalPedido({ id_pedido })
            res.json({ total })
        } catch (error) {
            console.error('Error al obtener total del pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener líneas por insumo
    getByInsumo = async (req, res) => {
        try {
            const { id_insumo } = req.params
            const lineas = await this.lineaPedidoModel.getByInsumo({ id_insumo })
            res.json(lineas)
        } catch (error) {
            console.error('Error al obtener líneas por insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}