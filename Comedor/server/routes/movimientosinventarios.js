import { Router } from 'express'
import { MovimientoInventarioController } from '../controllers/movimientosinventarios.js'

export const createMovimientoInventarioRouter = ({ movimientoInventarioModel }) => {
    const movimientosInventariosRouter = Router()
    const movimientoInventarioController = new MovimientoInventarioController({ movimientoInventarioModel })

    movimientosInventariosRouter.get('/', movimientoInventarioController.getAll)
    movimientosInventariosRouter.get('/:id', movimientoInventarioController.getById)
    movimientosInventariosRouter.post('/', movimientoInventarioController.create)
    movimientosInventariosRouter.delete('/:id', movimientoInventarioController.delete)
    movimientosInventariosRouter.patch('/:id', movimientoInventarioController.update)

    return movimientosInventariosRouter
}