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

    return consumosRouter
}