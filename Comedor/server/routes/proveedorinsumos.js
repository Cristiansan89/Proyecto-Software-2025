import { Router } from 'express'
import { ProveedorInsumoController } from '../controllers/proveedorinsumo.js'

export const createProveedorInsumoRouter = ({ proveedorInsumoModel }) => {
    const proveedorInsumosRouter = Router()
    const proveedorInsumoController = new ProveedorInsumoController({ proveedorInsumoModel })

    proveedorInsumosRouter.get('/', proveedorInsumoController.getAll)
    proveedorInsumosRouter.get('/:id', proveedorInsumoController.getById)
    proveedorInsumosRouter.post('/', proveedorInsumoController.create)
    proveedorInsumosRouter.delete('/:id', proveedorInsumoController.delete)
    proveedorInsumosRouter.patch('/:id', proveedorInsumoController.update)

    // Endpoints especializados
    proveedorInsumosRouter.get('/proveedor/:id_proveedor/insumos', proveedorInsumoController.getInsumosByProveedor)
    proveedorInsumosRouter.get('/insumo/:id_insumo/proveedores', proveedorInsumoController.getProveedoresByInsumo)
    proveedorInsumosRouter.get('/insumo/:id_insumo/mejor-proveedor', proveedorInsumoController.getMejorProveedorByInsumo)

    return proveedorInsumosRouter
}