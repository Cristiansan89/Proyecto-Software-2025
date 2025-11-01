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

    // Endpoints especializados
    recetasRouter.get('/search/by-nombre', recetaController.searchByNombre)
    recetasRouter.get('/tipo/:tipo', recetaController.getByTipo)
    recetasRouter.get('/activas/list', recetaController.getActivas)
    recetasRouter.get('/:id/con-ingredientes', recetaController.getConIngredientes)

    return recetasRouter
}
