import { Router } from 'express'
import { ItemRecetaController } from '../controllers/itemsrecetas.js'

export const createItemRecetaRouter = ({ itemRecetaModel }) => {
    const itemsRecetasRouter = Router()
    const itemRecetaController = new ItemRecetaController({ itemRecetaModel })

    itemsRecetasRouter.get('/', itemRecetaController.getAll)
    itemsRecetasRouter.get('/:id', itemRecetaController.getById)
    itemsRecetasRouter.post('/', itemRecetaController.create)
    itemsRecetasRouter.delete('/:id', itemRecetaController.delete)
    itemsRecetasRouter.patch('/:id', itemRecetaController.update)

    return itemsRecetasRouter
}