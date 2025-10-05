import { Router } from 'express'
import { ParametroSistemaController } from '../controllers/parametrossistemas.js'

export const createParametroSistemaRouter = ({ parametroSistemaModel }) => {
    const parametrosSistemasRouter = Router()
    const parametroSistemaController = new ParametroSistemaController({ parametroSistemaModel })

    parametrosSistemasRouter.get('/', parametroSistemaController.getAll)
    parametrosSistemasRouter.get('/:id', parametroSistemaController.getById)
    parametrosSistemasRouter.post('/', parametroSistemaController.create)
    parametrosSistemasRouter.delete('/:id', parametroSistemaController.delete)
    parametrosSistemasRouter.patch('/:id', parametroSistemaController.update)

    return parametrosSistemasRouter
}