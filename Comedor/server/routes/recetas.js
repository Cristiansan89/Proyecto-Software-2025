import { Router } from 'express'
import { RecetaController } from '../controllers/recetas.js'

export const createRecetaRouter = ({ recetaModel }) => {
    const recetasRouter = Router()
    const recetaController = new RecetaController({ recetaModel })

    recetasRouter.get('/', recetaController.getAll)
    recetasRouter.get('/:id', recetaController.getById)
    recetasRouter.post('/', recetaController.create)
    recetasRouter.delete('/:id', recetaController.delete)
    recetasRouter.patch('/:id', recetaController.update)

    return recetasRouter
}
