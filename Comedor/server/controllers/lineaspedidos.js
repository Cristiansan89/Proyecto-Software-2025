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
        const lineasPedido = await this.lineaPedidoModel.getAll()
        res.json(lineasPedido)
    }

    // Obtiene un LineaPedido por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const lineasPedido = await this.lineaPedidoModel.getById({ id })
        if (lineasPedido) return res.json(lineasPedido)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del LineaPedido no funciona' })

    }

    // Crea un nuevo LineaPedido después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateLineaPedido(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo LineaPedido y responde con el objeto creado
        const newLineaPedido = await this.lineaPedidoModel.create({ input: result.data })
        res.status(201).json(newLineaPedido)
    }

    // Elimina un LineaPedido por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.lineaPedidoModel.delete({ id })

        // Si no se encuentra el LineaPedido, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del LineaPedido no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'LineaPedido eliminado correctamente' })
    }

    // Actualiza un LineaPedido parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialLineaPedido(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el LineaPedido y responde con el objeto actualizado
        const updatedLineaPedido = await this.lineaPedidoModel.update({ id, input: result.data })
        res.json(updatedLineaPedido)
    }
}