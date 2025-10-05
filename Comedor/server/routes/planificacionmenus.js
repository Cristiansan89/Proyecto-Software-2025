import { Router } from 'express'
import { PlanificacionMenuController } from '../controllers/planificacionmenus.js'

export const createPlanificacionMenuRouter = ({ planificacionMenuModel }) => {
    const planificacionMenusRouter = Router()
    const planificacionMenuController = new PlanificacionMenuController({ planificacionMenuModel })

    planificacionMenusRouter.get('/', planificacionMenuController.getAll)
    planificacionMenusRouter.get('/:id', planificacionMenuController.getById)
    planificacionMenusRouter.post('/', planificacionMenuController.create)
    planificacionMenusRouter.delete('/:id', planificacionMenuController.delete)
    planificacionMenusRouter.patch('/:id', planificacionMenuController.update)

    return planificacionMenusRouter
}