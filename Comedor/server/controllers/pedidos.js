// Importa las funciones de validación para los datos del ParametroSistema
import { validateParametroSistema, validatePartialParametroSistema } from '../schemas/parametrossistemas.js'
import { validatePedido, validatePartialPedido } from '../schemas/pedidos.js'

// Controlador para manejar las operaciones relacionadas con los ParametrosSistemas
export class ParametroSistemaController {
    // Recibe el modelo de ParametroSistema por inyección de dependencias
    constructor({ parametroSistemaModel }) {
        this.parametroSistemaModel = parametroSistemaModel
    }

    // Obtiene todos los ParametrosSistemas
    getAll = async (req, res) => {
        const parametrosSistemas = await this.parametroSistemaModel.getAll()
        res.json(parametrosSistemas)
    }

    // Obtiene un ParametroSistema por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const parametroSistema = await this.parametroSistemaModel.getById({ id })
        if (parametroSistema) return res.json(parametroSistema)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del ParametroSistema no funciona' })

    }

    // Crea un nuevo ParametroSistema después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateParametroSistema(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo ParametroSistema y responde con el objeto creado
        const newParametroSistema = await this.parametroSistemaModel.create({ input: result.data })
        res.status(201).json(newParametroSistema)
    }

    // Elimina un ParametroSistema por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.parametroSistemaModel.delete({ id })

        // Si no se encuentra el ParametroSistema, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del ParametroSistema no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'ParametroSistema eliminado correctamente' })
    }

    // Actualiza un ParametroSistema parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialParametroSistema(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el ParametroSistema y responde con el objeto actualizado
        const updatedParametroSistema = await this.parametroSistemaModel.update({ id, input: result.data })
        res.json(updatedParametroSistema)
    }
}

// Controlador para manejar las operaciones relacionadas con los Pedidos
export class PedidoController {
    // Recibe el modelo de Pedido por inyección de dependencias
    constructor({ pedidoModel }) {
        this.pedidoModel = pedidoModel
    }

    // Obtiene todos los Pedidos
    getAll = async (req, res) => {
        const pedidos = await this.pedidoModel.getAll()
        res.json(pedidos)
    }

    // Obtiene un Pedido por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const pedido = await this.pedidoModel.getById({ id })

        if (pedido) return res.json(pedido)
        res.status(404).json({ message: 'Pedido no encontrado' })
    }

    // Crea un nuevo Pedido después de validar los datos recibidos
    create = async (req, res) => {
        const result = validatePedido(req.body)

        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const newPedido = await this.pedidoModel.create({ input: result.data })
        res.status(201).json(newPedido)
    }

    // Elimina un Pedido por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.pedidoModel.delete({ id })

        if (!deleted) {
            return res.status(404).json({ message: 'Pedido no encontrado' })
        }
        return res.json({ message: 'Pedido eliminado correctamente' })
    }

    // Actualiza un Pedido parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialPedido(req.body)

        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        const updatedPedido = await this.pedidoModel.update({ id, input: result.data })
        res.json(updatedPedido)
    }
}