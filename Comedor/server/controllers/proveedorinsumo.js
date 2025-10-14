import { ProveedorInsumoModel } from '../models/proveedorinsumo.js'
import { validateProveedorInsumo, validatePartialProveedorInsumo } from '../schemas/proveedorinsumo.js'

export class ProveedorInsumoController {
    static async getAll(req, res) {
        try {
            const relaciones = await ProveedorInsumoModel.getAll()
            res.json(relaciones)
        } catch (error) {
            console.error('Error al obtener relaciones proveedor-insumo:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async getById(req, res) {
        try {
            const { idProveedor, idInsumo } = req.params
            const relacion = await ProveedorInsumoModel.getById({ idProveedor, idInsumo })

            if (!relacion) {
                return res.status(404).json({ error: 'Relación no encontrada' })
            }

            res.json(relacion)
        } catch (error) {
            console.error('Error al obtener relación:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async create(req, res) {
        try {
            const result = validateProveedorInsumo(req.body)

            if (!result.success) {
                return res.status(400).json({
                    error: 'Datos de entrada inválidos',
                    details: result.error.issues
                })
            }

            const nuevaRelacion = await ProveedorInsumoModel.create({ input: result.data })
            res.status(201).json(nuevaRelacion)
        } catch (error) {
            console.error('Error al crear relación:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ error: error.message })
            }
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async delete(req, res) {
        try {
            const { idProveedor, idInsumo } = req.params
            const resultado = await ProveedorInsumoModel.delete({ idProveedor, idInsumo })

            if (!resultado) {
                return res.status(404).json({ error: 'Relación no encontrada' })
            }

            res.json({ message: 'Relación eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar relación:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async update(req, res) {
        try {
            const { idProveedor, idInsumo } = req.params
            const result = validatePartialProveedorInsumo(req.body)

            if (!result.success) {
                return res.status(400).json({
                    error: 'Datos de entrada inválidos',
                    details: result.error.issues
                })
            }

            const relacionActualizada = await ProveedorInsumoModel.update({
                idProveedor,
                idInsumo,
                input: result.data
            })

            if (!relacionActualizada) {
                return res.status(404).json({ error: 'Relación no encontrada' })
            }

            res.json(relacionActualizada)
        } catch (error) {
            console.error('Error al actualizar relación:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async getByProveedor(req, res) {
        try {
            const { idProveedor } = req.params
            const insumos = await ProveedorInsumoModel.getByProveedor({ idProveedor })
            res.json(insumos)
        } catch (error) {
            console.error('Error al obtener insumos del proveedor:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async getByInsumo(req, res) {
        try {
            const { idInsumo } = req.params
            const proveedores = await ProveedorInsumoModel.getByInsumo({ idInsumo })
            res.json(proveedores)
        } catch (error) {
            console.error('Error al obtener proveedores del insumo:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }

    static async getBestProviders(req, res) {
        try {
            const { idInsumo } = req.params
            const mejoresProveedores = await ProveedorInsumoModel.getBestProviders({ idInsumo })
            res.json(mejoresProveedores)
        } catch (error) {
            console.error('Error al obtener mejores proveedores:', error)
            res.status(500).json({ error: 'Error interno del servidor' })
        }
    }
}