import { Router } from 'express'
import { RegistroAsistenciaController } from '../controllers/registrosasistencias.js'

export const createRegistroAsistenciaRouter = ({ registroAsistenciaModel }) => {
    const registrosAsistenciasRouter = Router()
    const registroAsistenciaController = new RegistroAsistenciaController({ registroAsistenciaModel })

    registrosAsistenciasRouter.get('/', registroAsistenciaController.getAll)
    registrosAsistenciasRouter.get('/:id', registroAsistenciaController.getById)
    registrosAsistenciasRouter.post('/', registroAsistenciaController.create)
    registrosAsistenciasRouter.delete('/:id', registroAsistenciaController.delete)
    registrosAsistenciasRouter.patch('/:id', registroAsistenciaController.update)

    // Endpoints especializados
    registrosAsistenciasRouter.get('/fecha/:fecha', registroAsistenciaController.getByFecha)
    registrosAsistenciasRouter.get('/persona/:id_persona', registroAsistenciaController.getByPersona)
    registrosAsistenciasRouter.get('/servicio/:id_servicio/fecha/:fecha', registroAsistenciaController.getByServicioFecha)
    registrosAsistenciasRouter.post('/marcar-asistencia', registroAsistenciaController.marcarAsistencia)
    registrosAsistenciasRouter.get('/estadisticas/reporte', registroAsistenciaController.getEstadisticas)

    return registrosAsistenciasRouter
}