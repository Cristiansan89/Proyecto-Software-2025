import { Router } from 'express'
import { LineaPedidoController } from '../controllers/lineaspedidos.js'

export const createLineaPedidoRouter = ({ lineaPedidoModel }) => {
    const lineasPedidosRouter = Router()
    const lineaPedidoController = new LineaPedidoController({ lineaPedidoModel })

    lineasPedidosRouter.get('/', lineaPedidoController.getAll)
    lineasPedidosRouter.get('/:id', lineaPedidoController.getById)
    lineasPedidosRouter.post('/', lineaPedidoController.create)
    lineasPedidosRouter.delete('/:id', lineaPedidoController.delete)
    lineasPedidosRouter.patch('/:id', lineaPedidoController.update)

    return lineasPedidosRouter
}