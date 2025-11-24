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
        try {
            const registrosAsistencias = await this.registroAsistenciaModel.getAll()
            res.json(registrosAsistencias)
        } catch (error) {
            console.error('Error al obtener registros de asistencia:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un RegistroAsistencia por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const registroAsistencia = await this.registroAsistenciaModel.getById({ id })
            if (registroAsistencia) return res.json(registroAsistencia)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Registro de asistencia no encontrado' })
        } catch (error) {
            console.error('Error al obtener registro de asistencia por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo RegistroAsistencia después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateRegistroAsistencia(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            // Crea el nuevo RegistroAsistencia y responde con el objeto creado
            const newRegistroAsistencia = await this.registroAsistenciaModel.create({ input: result.data })
            res.status(201).json(newRegistroAsistencia)
        } catch (error) {
            console.error('Error al crear registro de asistencia:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un RegistroAsistencia por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.registroAsistenciaModel.delete({ id })

            // Si no se encuentra el RegistroAsistencia, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Registro de asistencia no encontrado' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Registro de asistencia eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar registro de asistencia:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un RegistroAsistencia parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialRegistroAsistencia(req.body)

            // Si la validación falla, responde con error 400
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
            // Actualiza el RegistroAsistencia y responde con el objeto actualizado
            const updatedRegistroAsistencia = await this.registroAsistenciaModel.update({ id, input: result.data })

            if (!updatedRegistroAsistencia) {
                return res.status(404).json({ message: 'Registro de asistencia no encontrado' })
            }

            return res.json(updatedRegistroAsistencia)
        } catch (error) {
            console.error('Error al actualizar registro de asistencia:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener asistencias por fecha
    getByFecha = async (req, res) => {
        try {
            const { fecha } = req.params
            const asistencias = await this.registroAsistenciaModel.getByFecha({ fecha })
            res.json(asistencias)
        } catch (error) {
            console.error('Error al obtener asistencias por fecha:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener asistencias por persona
    getByPersona = async (req, res) => {
        try {
            const { id_persona } = req.params
            const asistencias = await this.registroAsistenciaModel.getByPersona({ id_persona })
            res.json(asistencias)
        } catch (error) {
            console.error('Error al obtener asistencias por persona:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener asistencias por servicio y fecha
    getByServicioFecha = async (req, res) => {
        try {
            const { id_servicio, fecha } = req.params
            const asistencias = await this.registroAsistenciaModel.getByServicioFecha({ id_servicio, fecha })
            res.json(asistencias)
        } catch (error) {
            console.error('Error al obtener asistencias por servicio y fecha:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Marcar asistencia
    marcarAsistencia = async (req, res) => {
        try {
            const { id_persona, id_servicio, fecha } = req.body
            const asistencia = await this.registroAsistenciaModel.marcarAsistencia({ id_persona, id_servicio, fecha })
            res.status(201).json(asistencia)
        } catch (error) {
            console.error('Error al marcar asistencia:', error)
            if (error.message.includes('ya marcada')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener estadísticas de asistencia
    getEstadisticas = async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin } = req.query
            const estadisticas = await this.registroAsistenciaModel.getEstadisticas({ fecha_inicio, fecha_fin })
            res.json(estadisticas)
        } catch (error) {
            console.error('Error al obtener estadísticas de asistencia:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}