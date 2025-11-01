import { validateConsumo, validatePartialConsumo } from '../schemas/consumos.js'

export class ConsumoController {
    constructor({ consumoModel }) {
        this.consumoModel = consumoModel
    }

    getAll = async (req, res) => {
        try {
            const consumos = await this.consumoModel.getAll()
            res.json(consumos)
        } catch (error) {
            console.error('Error al obtener consumos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    getById = async (req, res) => {
        try {
            const { id } = req.params
            const consumo = await this.consumoModel.getById({ id })

            if (consumo) return res.json(consumo)
            res.status(404).json({ message: 'Consumo no encontrado' })
        } catch (error) {
            console.error('Error al obtener consumo por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    create = async (req, res) => {
        try {
            const result = validateConsumo(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newConsumo = await this.consumoModel.create({ input: result.data })
            res.status(201).json(newConsumo)
        } catch (error) {
            console.error('Error al crear consumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.consumoModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Consumo no encontrado' })
            }

            return res.json({ message: 'Consumo eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar consumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    update = async (req, res) => {
        try {
            const result = validatePartialConsumo(req.body)

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
            const updatedConsumo = await this.consumoModel.update({ id, input: result.data })

            if (!updatedConsumo) {
                return res.status(404).json({ message: 'Consumo no encontrado' })
            }

            return res.json(updatedConsumo)
        } catch (error) {
            console.error('Error al actualizar consumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener consumos por fecha
    getByFecha = async (req, res) => {
        try {
            const { fecha } = req.params
            const consumos = await this.consumoModel.getByFecha({ fecha })
            res.json(consumos)
        } catch (error) {
            console.error('Error al obtener consumos por fecha:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener consumos por persona
    getByPersona = async (req, res) => {
        try {
            const { id_persona } = req.params
            const consumos = await this.consumoModel.getByPersona({ id_persona })
            res.json(consumos)
        } catch (error) {
            console.error('Error al obtener consumos por persona:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener estadísticas de consumo
    getEstadisticas = async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin } = req.query
            const estadisticas = await this.consumoModel.getEstadisticas({ fecha_inicio, fecha_fin })
            res.json(estadisticas)
        } catch (error) {
            console.error('Error al obtener estadísticas de consumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener consumos por servicio y fecha
    getByServicioFecha = async (req, res) => {
        try {
            const { id_servicio, fecha } = req.params
            const consumos = await this.consumoModel.getByServicioFecha({ id_servicio, fecha })
            res.json(consumos)
        } catch (error) {
            console.error('Error al obtener consumos por servicio y fecha:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}