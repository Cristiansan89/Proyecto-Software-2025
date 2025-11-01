import { Router } from 'express'
import { PedidoController } from '../controllers/pedidos.js'

export const createPedidoRouter = ({ pedidoModel }) => {
    const pedidosRouter = Router()
    const pedidoController = new PedidoController({ pedidoModel })

    pedidosRouter.get('/', pedidoController.getAll)
    pedidosRouter.get('/:id', pedidoController.getById)
    pedidosRouter.post('/', pedidoController.create)
    pedidosRouter.delete('/:id', pedidoController.delete)
    pedidosRouter.patch('/:id', pedidoController.update)

    // Endpoints especializados
    pedidosRouter.get('/estado/:estado', pedidoController.getByEstado)
    pedidosRouter.get('/proveedor/:id_proveedor', pedidoController.getByProveedor)
    pedidosRouter.patch('/:id/estado', pedidoController.cambiarEstado)

    return pedidosRouter
}