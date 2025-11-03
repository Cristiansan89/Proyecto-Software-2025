// Importa las funciones de validación para los datos de los Turnos
import { validateTurno, validatePartialTurno } from '../schemas/turnos.js'

// Controlador para manejar las operaciones relacionadas con los Turnos
export class TurnoController {
    // Recibe el modelo de Turno por inyección de dependencias
    constructor({ turnoModel }) {
        this.turnoModel = turnoModel
    }

    // Obtiene todos los Turnos
    getAll = async (req, res) => {
        try {
            const turnos = await this.turnoModel.getAll()
            res.json(turnos)
        } catch (error) {
            console.error('Error al obtener turnos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Turno por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const turno = await this.turnoModel.getById({ id })
            if (turno) return res.json(turno)
            res.status(404).json({ message: 'Turno no encontrado' })
        } catch (error) {
            console.error('Error al obtener turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Turno después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateTurno(req.body)

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

            // Validar que horaFin sea mayor que horaInicio
            const { horaInicio, horaFin } = result.data
            if (horaInicio >= horaFin) {
                return res.status(400).json({
                    message: 'La hora de fin debe ser mayor que la hora de inicio'
                })
            }

            // Crea el nuevo Turno y responde con el objeto creado
            const newTurno = await this.turnoModel.create({ input: result.data })
            res.status(201).json(newTurno)
        } catch (error) {
            console.error('Error al crear turno:', error)
            if (error.message.includes('ya existe') || error.message.includes('conflicto')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Turno por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            console.log('TurnoController: Eliminando turno con ID:', id)

            const deleted = await this.turnoModel.delete({ id })
            console.log('TurnoController: Resultado de eliminación:', deleted)

            if (!deleted) {
                console.log('TurnoController: Turno no encontrado')
                return res.status(404).json({ message: 'Turno no encontrado' })
            }
            console.log('TurnoController: Turno eliminado exitosamente')
            return res.json({ message: 'Turno eliminado correctamente' })
        } catch (error) {
            console.error('TurnoController: Error al eliminar turno:', error)
            if (error.message.includes('referencia') || error.message.includes('usado')) {
                return res.status(409).json({ message: 'No se puede eliminar el turno porque está en uso' })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Turno parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialTurno(req.body)

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

            // Validar horarios si ambos están presentes
            const { horaInicio, horaFin } = result.data
            if (horaInicio && horaFin && horaInicio >= horaFin) {
                return res.status(400).json({
                    message: 'La hora de fin debe ser mayor que la hora de inicio'
                })
            }

            const { id } = req.params
            const updatedTurno = await this.turnoModel.update({ id, input: result.data })

            if (!updatedTurno) {
                return res.status(404).json({ message: 'Turno no encontrado' })
            }

            res.json(updatedTurno)
        } catch (error) {
            console.error('Error al actualizar turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener turnos activos
    getActivos = async (req, res) => {
        try {
            const turnos = await this.turnoModel.getActivos()
            res.json(turnos)
        } catch (error) {
            console.error('Error al obtener turnos activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del turno
    changeStatus = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ message: 'Estado inválido' })
            }

            const updatedTurno = await this.turnoModel.update({ id, input: { estado } })

            if (!updatedTurno) {
                return res.status(404).json({ message: 'Turno no encontrado' })
            }

            res.json({ message: `Turno ${estado.toLowerCase()} correctamente`, turno: updatedTurno })
        } catch (error) {
            console.error('Error al cambiar estado del turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}