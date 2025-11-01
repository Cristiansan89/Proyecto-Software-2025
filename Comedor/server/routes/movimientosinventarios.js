import { Router } from 'express'
import { MovimientoInventarioController } from '../controllers/movimientosinventarios.js'

export const createMovimientoInventarioRouter = ({ movimientoInventarioModel }) => {
    const movimientosInventariosRouter = Router()
    const movimientoInventarioController = new MovimientoInventarioController({ movimientoInventarioModel })

    movimientosInventariosRouter.get('/', movimientoInventarioController.getAll)
    movimientosInventariosRouter.get('/:id', movimientoInventarioController.getById)
    movimientosInventariosRouter.post('/', movimientoInventarioController.create)
    movimientosInventariosRouter.delete('/:id', movimientoInventarioController.delete)
    movimientosInventariosRouter.patch('/:id', movimientoInventarioController.update)

    // Endpoints especializados
    movimientosInventariosRouter.get('/insumo/:id_insumo', movimientoInventarioController.getByInsumo)
    movimientosInventariosRouter.get('/tipo/:tipo', movimientoInventarioController.getByTipo)
    movimientosInventariosRouter.get('/fecha/:fecha', movimientoInventarioController.getByFecha)
    movimientosInventariosRouter.get('/rango-fechas/reporte', movimientoInventarioController.getByRangoFechas)
    movimientosInventariosRouter.post('/entrada', movimientoInventarioController.registrarEntrada)
    movimientosInventariosRouter.post('/salida', movimientoInventarioController.registrarSalida)

    return movimientosInventariosRouter
}