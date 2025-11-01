import { Router } from 'express'
import { InventarioController } from '../controllers/inventarios.js'

export const createInventarioRouter = ({ inventarioModel }) => {
    const inventariosRouter = Router()
    const inventarioController = new InventarioController({ inventarioModel })

    inventariosRouter.get('/', inventarioController.getAll)
    inventariosRouter.get('/:id', inventarioController.getById)
    inventariosRouter.post('/', inventarioController.create)
    inventariosRouter.delete('/:id', inventarioController.delete)
    inventariosRouter.patch('/:id', inventarioController.update)

    // Endpoints especializados
    inventariosRouter.get('/stock-bajo/list', inventarioController.getStockBajo)
    inventariosRouter.get('/insumo/:id_insumo', inventarioController.getByInsumo)
    inventariosRouter.patch('/:id/ajustar-stock', inventarioController.ajustarStock)
    inventariosRouter.get('/estadisticas/resumen', inventarioController.getEstadisticas)

    return inventariosRouter
}