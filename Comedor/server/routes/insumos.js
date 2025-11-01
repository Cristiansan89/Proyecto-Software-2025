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

    // Endpoints especializados
    insumosRouter.get('/activos/list', insumoController.getActivos)
    insumosRouter.get('/search/by-nombre', insumoController.searchByNombre)
    insumosRouter.get('/categoria/:categoria', insumoController.getByCategoria)
    insumosRouter.patch('/:id/estado', insumoController.cambiarEstado)

    return insumosRouter
}