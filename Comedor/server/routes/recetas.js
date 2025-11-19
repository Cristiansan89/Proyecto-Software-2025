import { Router } from 'express'
import { RecetaController } from '../controllers/recetas.js'

export const createRecetaRouter = ({ recetaModel }) => {
    const recetasRouter = Router()
    const recetaController = new RecetaController({ recetaModel })

    // Endpoints especializados - ANTES de las rutas con parámetros
    recetasRouter.get('/activas', recetaController.getActivas)
    recetasRouter.get('/search/by-nombre', recetaController.searchByNombre)
    recetasRouter.get('/with-insumo-count/all', recetaController.getAllWithInsumoCount)

    // Rutas principales CRUD
    recetasRouter.get('/', recetaController.getAll)
    recetasRouter.get('/:id', recetaController.getById)
    recetasRouter.post('/', recetaController.create)
    recetasRouter.delete('/:id', recetaController.delete)
    recetasRouter.patch('/:id', recetaController.update)

    // Gestión de insumos en recetas
    recetasRouter.get('/:id/insumos', recetaController.getWithInsumos)
    recetasRouter.post('/:id/insumos', recetaController.addInsumo)
    recetasRouter.patch('/insumos/:id_item', recetaController.updateInsumo)
    recetasRouter.delete('/insumos/:id_item', recetaController.removeInsumo)

    return recetasRouter
}
