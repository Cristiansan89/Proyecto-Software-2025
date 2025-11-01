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

    // Endpoints especializados
    lineasPedidosRouter.get('/pedido/:id_pedido', lineaPedidoController.getByPedido)
    lineasPedidosRouter.get('/pedido/:id_pedido/total', lineaPedidoController.getTotalPedido)
    lineasPedidosRouter.get('/insumo/:id_insumo', lineaPedidoController.getByInsumo)

    return lineasPedidosRouter
}