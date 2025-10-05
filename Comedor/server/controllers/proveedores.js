// Importa las funciones de validación para los datos del Proveedor
import { validateProveedor, validatePartialProveedor } from '../schemas/proveedores.js'

// Controlador para manejar las operaciones relacionadas con los Proveedores
export class ProveedorController {
    // Recibe el modelo de Proveedor por inyección de dependencias
    constructor({ proveedorModel }) {
        this.proveedorModel = proveedorModel
    }

    // Obtiene todos los Proveedores
    getAll = async (req, res) => {
        const proveedores = await this.proveedorModel.getAll()
        res.json(proveedores)
    }

    // Obtiene un Proveedor por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const proveedor = await this.proveedorModel.getById({ id })
        if (proveedor) return res.json(proveedor)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Proveedor no funciona' })

    }

    // Crea un nuevo Proveedor después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateProveedor(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Proveedor y responde con el objeto creado
        const newProveedor = await this.proveedorModel.create({ input: result.data })
        res.status(201).json(newProveedor)
    }

    // Elimina un Proveedor por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.proveedorModel.delete({ id })

        // Si no se encuentra el Proveedor, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Proveedor no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Proveedor eliminado correctamente' })
    }

    // Actualiza un Proveedor parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialProveedor(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el Proveedor y responde con el objeto actualizado
        const updatedProveedor = await this.proveedorModel.update({ id, input: result.data })
        res.json(updatedProveedor)
    }
}