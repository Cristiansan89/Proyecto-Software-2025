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

    // Endpoints especializados
    planificacionMenusRouter.get('/fecha/:fecha', planificacionMenuController.getByFecha)
    planificacionMenusRouter.get('/servicio/:id_servicio', planificacionMenuController.getByServicio)
    planificacionMenusRouter.get('/rango-fechas/reporte', planificacionMenuController.getByRangoFechas)
    planificacionMenusRouter.get('/menu-del-dia/:fecha/:id_servicio', planificacionMenuController.getMenuDelDia)

    return planificacionMenusRouter
}