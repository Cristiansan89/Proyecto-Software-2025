import { Router } from 'express'
import { InsumoController } from '../controllers/insumos.js'

export const createInsumoRouter = ({ insumoModel }) => {
    const insumosRouter = Router()
    const insumoController = new InsumoController({ insumoModel })

    insumosRouter.get('/', insumoController.getAll)
    insumosRouter.get('/:id', insumoController.getById)
    insumosRouter.post('/', insumoController.create)
    insumosRouter.delete('/:id', insumoController.delete)
    insumosRouter.patch('/:id', insumoController.update)

    return insumosRouter
}