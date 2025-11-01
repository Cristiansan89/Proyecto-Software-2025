import { Router } from 'express'
import { ConsumoController } from '../controllers/consumos.js'

export const createConsumoRouter = ({ consumoModel }) => {
    const consumosRouter = Router()
    const consumoController = new ConsumoController({ consumoModel })

    consumosRouter.get('/', consumoController.getAll)
    consumosRouter.get('/:id', consumoController.getById)
    consumosRouter.post('/', consumoController.create)
    consumosRouter.delete('/:id', consumoController.delete)
    consumosRouter.patch('/:id', consumoController.update)

    // Endpoints especializados
    consumosRouter.get('/fecha/:fecha', consumoController.getByFecha)
    consumosRouter.get('/persona/:id_persona', consumoController.getByPersona)
    consumosRouter.get('/servicio/:id_servicio/fecha/:fecha', consumoController.getByServicioFecha)
    consumosRouter.get('/estadisticas/reporte', consumoController.getEstadisticas)

    return consumosRouter
}