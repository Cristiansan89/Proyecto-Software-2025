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
        try {
            const parametrosSistemas = await this.parametroSistemaModel.getAll()
            res.json(parametrosSistemas)
        } catch (error) {
            console.error('Error al obtener parámetros del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un ParametroSistema por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const parametroSistema = await this.parametroSistemaModel.getById({ id })
            if (parametroSistema) return res.json(parametroSistema)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Parámetro del sistema no encontrado' })
        } catch (error) {
            console.error('Error al obtener parámetro del sistema por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo ParametroSistema después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateParametroSistema(req.body)

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

            // Crea el nuevo ParametroSistema y responde con el objeto creado
            const newParametroSistema = await this.parametroSistemaModel.create({ input: result.data })
            res.status(201).json(newParametroSistema)
        } catch (error) {
            console.error('Error al crear parámetro del sistema:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un ParametroSistema por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.parametroSistemaModel.delete({ id })

            // Si no se encuentra el ParametroSistema, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Parámetro del sistema no encontrado' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Parámetro del sistema eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar parámetro del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un ParametroSistema parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialParametroSistema(req.body)

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
            // Actualiza el ParametroSistema y responde con el objeto actualizado
            const updatedParametroSistema = await this.parametroSistemaModel.update({ id, input: result.data })

            if (!updatedParametroSistema) {
                return res.status(404).json({ message: 'Parámetro del sistema no encontrado' })
            }

            return res.json(updatedParametroSistema)
        } catch (error) {
            console.error('Error al actualizar parámetro del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener parámetro por clave
    getByClave = async (req, res) => {
        try {
            const { clave } = req.params
            const parametro = await this.parametroSistemaModel.getByClave({ clave })
            if (parametro) return res.json(parametro)
            res.status(404).json({ message: 'Parámetro no encontrado' })
        } catch (error) {
            console.error('Error al obtener parámetro por clave:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualizar valor de parámetro por clave
    updateByClave = async (req, res) => {
        try {
            const { clave } = req.params
            const { valor } = req.body

            const parametroActualizado = await this.parametroSistemaModel.updateByClave({ clave, valor })

            if (!parametroActualizado) {
                return res.status(404).json({ message: 'Parámetro no encontrado' })
            }

            res.json(parametroActualizado)
        } catch (error) {
            console.error('Error al actualizar parámetro por clave:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
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
        try {
            const pedidos = await this.pedidoModel.getAll()
            res.json(pedidos)
        } catch (error) {
            console.error('Error al obtener pedidos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Pedido por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const pedido = await this.pedidoModel.getById({ id })

            if (pedido) return res.json(pedido)
            res.status(404).json({ message: 'Pedido no encontrado' })
        } catch (error) {
            console.error('Error al obtener pedido por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Pedido después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validatePedido(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newPedido = await this.pedidoModel.create({ input: result.data })
            res.status(201).json(newPedido)
        } catch (error) {
            console.error('Error al crear pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Pedido por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.pedidoModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Pedido no encontrado' })
            }
            return res.json({ message: 'Pedido eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Pedido parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialPedido(req.body)

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
            const updatedPedido = await this.pedidoModel.update({ id, input: result.data })

            if (!updatedPedido) {
                return res.status(404).json({ message: 'Pedido no encontrado' })
            }

            return res.json(updatedPedido)
        } catch (error) {
            console.error('Error al actualizar pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener pedidos por estado
    getByEstado = async (req, res) => {
        try {
            const { estado } = req.params
            const pedidos = await this.pedidoModel.getByEstado({ estado })
            res.json(pedidos)
        } catch (error) {
            console.error('Error al obtener pedidos por estado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener pedidos por proveedor
    getByProveedor = async (req, res) => {
        try {
            const { id_proveedor } = req.params
            const pedidos = await this.pedidoModel.getByProveedor({ id_proveedor })
            res.json(pedidos)
        } catch (error) {
            console.error('Error al obtener pedidos por proveedor:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del pedido
    cambiarEstado = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            const pedidoActualizado = await this.pedidoModel.cambiarEstado({ id, estado })

            if (!pedidoActualizado) {
                return res.status(404).json({ message: 'Pedido no encontrado' })
            }

            res.json(pedidoActualizado)
        } catch (error) {
            console.error('Error al cambiar estado del pedido:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}