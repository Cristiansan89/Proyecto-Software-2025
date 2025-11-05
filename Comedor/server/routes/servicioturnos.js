import { Router } from 'express'
import { ServicioTurnoController } from '../controllers/servicioturno.js'

export const createServicioTurnoRouter = ({ servicioTurnoModel }) => {
    const servicioTurnoRouter = Router()

    const servicioTurnoController = new ServicioTurnoController({ servicioTurnoModel })

    // Obtener todas las relaciones servicio-turno
    servicioTurnoRouter.get('/', servicioTurnoController.getAll)

    // Obtener turnos de un servicio específico
    servicioTurnoRouter.get('/servicio/:idServicio/turnos', servicioTurnoController.getTurnosByServicio)

    // Obtener servicios de un turno específico
    servicioTurnoRouter.get('/turno/:idTurno/servicios', servicioTurnoController.getServiciosByTurno)

    // Crear una relación servicio-turno
    servicioTurnoRouter.post('/', servicioTurnoController.create)

    // Eliminar una relación servicio-turno específica
    servicioTurnoRouter.delete('/servicio/:idServicio/turno/:idTurno', servicioTurnoController.delete)

    // Eliminar todas las relaciones de un servicio
    servicioTurnoRouter.delete('/servicio/:idServicio', servicioTurnoController.deleteByServicio)

    // Eliminar todas las relaciones de un turno
    servicioTurnoRouter.delete('/turno/:idTurno', servicioTurnoController.deleteByTurno)

    return servicioTurnoRouter
}