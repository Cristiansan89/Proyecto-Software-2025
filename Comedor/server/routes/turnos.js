import { Router } from 'express'
import { TurnoController } from '../controllers/turnos.js'

export const createTurnoRouter = ({ turnoModel }) => {
    const turnosRouter = Router()
    const turnoController = new TurnoController({ turnoModel })

    turnosRouter.get('/', turnoController.getAll)
    turnosRouter.get('/:id', turnoController.getById)
    turnosRouter.post('/', turnoController.create)
    turnosRouter.delete('/:id', turnoController.delete)
    turnosRouter.patch('/:id', turnoController.update)

    // Endpoints especializados
    turnosRouter.get('/activos/list', turnoController.getActivos)
    turnosRouter.patch('/:id/estado', turnoController.changeStatus)

    return turnosRouter
}