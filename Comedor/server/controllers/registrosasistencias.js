// Importa las funciones de validación para los datos del RegistroAsistencia
import { validateRegistroAsistencia, validatePartialRegistroAsistencia } from '../schemas/registrosasistencias.js'

// Controlador para manejar las operaciones relacionadas con los RegistrosAsistencias
export class RegistroAsistenciaController {
    // Recibe el modelo de RegistroAsistencia por inyección de dependencias
    constructor({ registroAsistenciaModel }) {
        this.registroAsistenciaModel = registroAsistenciaModel
    }

    // Obtiene todos los RegistrosAsistencias
    getAll = async (req, res) => {
        const registrosAsistencias = await this.registroAsistenciaModel.getAll()
        res.json(registrosAsistencias)
    }

    // Obtiene un RegistroAsistencia por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const registroAsistencia = await this.registroAsistenciaModel.getById({ id })
        if (registroAsistencia) return res.json(registroAsistencia)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del RegistroAsistencia no funciona' })

    }

    // Crea un nuevo RegistroAsistencia después de validar los datos recibidos
    create = async (req, res) => {
        const result = validateRegistroAsistencia(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo RegistroAsistencia y responde con el objeto creado
        const newRegistroAsistencia = await this.registroAsistenciaModel.create({ input: result.data })
        res.status(201).json(newRegistroAsistencia)
    }

    // Elimina un RegistroAsistencia por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.registroAsistenciaModel.delete({ id })

        // Si no se encuentra el RegistroAsistencia, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del RegistroAsistencia no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'RegistroAsistencia eliminado correctamente' })
    }

    // Actualiza un RegistroAsistencia parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialRegistroAsistencia(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el RegistroAsistencia y responde con el objeto actualizado
        const updatedRegistroAsistencia = await this.registroAsistenciaModel.update({ id, input: result.data })
        res.json(updatedRegistroAsistencia)
    }
}