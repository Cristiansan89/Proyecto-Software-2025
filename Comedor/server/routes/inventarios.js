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

    return inventariosRouter
}