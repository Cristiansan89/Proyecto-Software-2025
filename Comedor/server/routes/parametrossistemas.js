import { Router } from 'express'
import { ParametroSistemaController } from '../controllers/pedidos.js'

export const createParametroSistemaRouter = ({ parametroSistemaModel }) => {
    const parametrosSistemasRouter = Router()
    const parametroSistemaController = new ParametroSistemaController({ parametroSistemaModel })

    parametrosSistemasRouter.get('/', parametroSistemaController.getAll)
    parametrosSistemasRouter.get('/:id', parametroSistemaController.getById)
    parametrosSistemasRouter.post('/', parametroSistemaController.create)
    parametrosSistemasRouter.delete('/:id', parametroSistemaController.delete)
    parametrosSistemasRouter.patch('/:id', parametroSistemaController.update)

    // Endpoints especializados
    parametrosSistemasRouter.get('/clave/:clave', parametroSistemaController.getByClave)
    parametrosSistemasRouter.patch('/clave/:clave', parametroSistemaController.updateByClave)

    return parametrosSistemasRouter
}