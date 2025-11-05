export class ServicioTurnoController {
    constructor({ servicioTurnoModel }) {
        this.servicioTurnoModel = servicioTurnoModel
    }

    // Obtener todas las relaciones servicio-turno
    getAll = async (req, res) => {
        try {
            const relaciones = await this.servicioTurnoModel.getAll()
            res.json(relaciones)
        } catch (error) {
            console.error('Error al obtener relaciones servicio-turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener turnos de un servicio específico
    getTurnosByServicio = async (req, res) => {
        try {
            const { idServicio } = req.params
            const turnos = await this.servicioTurnoModel.getTurnosByServicio({ idServicio })
            res.json(turnos)
        } catch (error) {
            console.error('Error al obtener turnos del servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener servicios de un turno específico
    getServiciosByTurno = async (req, res) => {
        try {
            const { idTurno } = req.params
            const servicios = await this.servicioTurnoModel.getServiciosByTurno({ idTurno })
            res.json(servicios)
        } catch (error) {
            console.error('Error al obtener servicios del turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crear una relación servicio-turno
    create = async (req, res) => {
        try {
            const { idServicio, idTurno, fechaAsociacion } = req.body

            if (!idServicio || !idTurno) {
                return res.status(400).json({
                    message: 'Los campos idServicio e idTurno son requeridos'
                })
            }

            const nuevaRelacion = await this.servicioTurnoModel.create({
                input: { idServicio, idTurno, fechaAsociacion }
            })

            res.status(201).json(nuevaRelacion)
        } catch (error) {
            console.error('Error al crear relación servicio-turno:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Eliminar una relación servicio-turno
    delete = async (req, res) => {
        try {
            const { idServicio, idTurno } = req.params

            const deleted = await this.servicioTurnoModel.delete({ idServicio, idTurno })

            if (!deleted) {
                return res.status(404).json({ message: 'Relación no encontrada' })
            }

            res.json({ message: 'Relación eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar relación servicio-turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Eliminar todas las relaciones de un servicio
    deleteByServicio = async (req, res) => {
        try {
            const { idServicio } = req.params
            const deletedCount = await this.servicioTurnoModel.deleteByServicio({ idServicio })

            res.json({
                message: `Se eliminaron ${deletedCount} relaciones del servicio`,
                deletedCount
            })
        } catch (error) {
            console.error('Error al eliminar relaciones del servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Eliminar todas las relaciones de un turno
    deleteByTurno = async (req, res) => {
        try {
            const { idTurno } = req.params
            const deletedCount = await this.servicioTurnoModel.deleteByTurno({ idTurno })

            res.json({
                message: `Se eliminaron ${deletedCount} relaciones del turno`,
                deletedCount
            })
        } catch (error) {
            console.error('Error al eliminar relaciones del turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}