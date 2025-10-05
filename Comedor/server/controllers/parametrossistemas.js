// Importa las funciones de validación para los datos del ParametroSistema
import { validateParametroSistema, validatePartialParametroSistema } from '../schemas/parametrossistemas.js'

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