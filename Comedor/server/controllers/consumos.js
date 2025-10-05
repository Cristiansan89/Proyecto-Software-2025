import { validateConsumo, validatePartialConsumo } from '../schemas/consumos.js'

export class ConsumoController {
    constructor({ consumoModel }) {
        this.consumoModel = consumoModel
    }

    getAll = async (req, res) => {
        const consumos = await this.consumoModel.getAll()
        res.json(consumos)
    }

    getById = async (req, res) => {
        const { id } = req.params
        const consumo = await this.consumoModel.getById({ id })

        if (consumo) return res.json(consumo)
        res.status(404).json({ message: 'Consumo no encontrado' })
    }

    create = async (req, res) => {
        const result = validateConsumo(req.body)

        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const newConsumo = await this.consumoModel.create({ input: result.data })
        res.status(201).json(newConsumo)
    }

    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.consumoModel.delete({ id })

        if (!deleted) {
            return res.status(404).json({ message: 'Consumo no encontrado' })
        }

        return res.json({ message: 'Consumo eliminado' })
    }

    update = async (req, res) => {
        const result = validatePartialConsumo(req.body)

        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        const updatedConsumo = await this.consumoModel.update({ id, input: result.data })

        if (!updatedConsumo) {
            return res.status(404).json({ message: 'Consumo no encontrado' })
        }

        return res.json(updatedConsumo)
    }
}