import { validateProveedorInsumo, validatePartialProveedorInsumo } from '../schemas/proveedorinsumo.js'

export class ProveedorInsumoController {
    constructor({ proveedorInsumoModel }) {
        this.proveedorInsumoModel = proveedorInsumoModel
    }

    getAll = async (req, res) => {
        try {
            const proveedorInsumos = await this.proveedorInsumoModel.getAll()
            res.json(proveedorInsumos)
        } catch (error) {
            console.error('Error al obtener relaciones proveedor-insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    getById = async (req, res) => {
        try {
            const { id } = req.params
            const proveedorInsumo = await this.proveedorInsumoModel.getById({ id })

            if (proveedorInsumo) return res.json(proveedorInsumo)
            res.status(404).json({ message: 'Relación proveedor-insumo no encontrada' })
        } catch (error) {
            console.error('Error al obtener relación proveedor-insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
    create = async (req, res) => {
        try {
            const result = validateProveedorInsumo(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newProveedorInsumo = await this.proveedorInsumoModel.create({ input: result.data })
            res.status(201).json(newProveedorInsumo)
        } catch (error) {
            console.error('Error al crear relación proveedor-insumo:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.proveedorInsumoModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Relación proveedor-insumo no encontrada' })
            }

            return res.json({ message: 'Relación proveedor-insumo eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar relación proveedor-insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    update = async (req, res) => {
        try {
            const result = validatePartialProveedorInsumo(req.body)

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
            const updatedProveedorInsumo = await this.proveedorInsumoModel.update({ id, input: result.data })

            if (!updatedProveedorInsumo) {
                return res.status(404).json({ message: 'Relación proveedor-insumo no encontrada' })
            }

            return res.json(updatedProveedorInsumo)
        } catch (error) {
            console.error('Error al actualizar relación proveedor-insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener insumos por proveedor
    getInsumosByProveedor = async (req, res) => {
        try {
            const { id_proveedor } = req.params
            const insumos = await this.proveedorInsumoModel.getInsumosByProveedor({ id_proveedor })
            res.json(insumos)
        } catch (error) {
            console.error('Error al obtener insumos por proveedor:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener proveedores por insumo
    getProveedoresByInsumo = async (req, res) => {
        try {
            const { id_insumo } = req.params
            const proveedores = await this.proveedorInsumoModel.getProveedoresByInsumo({ id_insumo })
            res.json(proveedores)
        } catch (error) {
            console.error('Error al obtener proveedores por insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener mejor proveedor por insumo (menor precio)
    getMejorProveedorByInsumo = async (req, res) => {
        try {
            const { id_insumo } = req.params
            const proveedor = await this.proveedorInsumoModel.getMejorProveedorByInsumo({ id_insumo })
            if (proveedor) return res.json(proveedor)
            res.status(404).json({ message: 'No se encontraron proveedores para este insumo' })
        } catch (error) {
            console.error('Error al obtener mejor proveedor por insumo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}
