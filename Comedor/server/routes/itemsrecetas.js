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

    // Endpoints especializados
    itemsRecetasRouter.get('/receta/:id_receta', itemRecetaController.getByReceta)
    itemsRecetasRouter.get('/insumo/:id_insumo', itemRecetaController.getByInsumo)
    itemsRecetasRouter.get('/receta/:id_receta/costo-total', itemRecetaController.getCostoTotalReceta)

    return itemsRecetasRouter
}