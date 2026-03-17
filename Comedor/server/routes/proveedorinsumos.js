import { Router } from 'express'
import { ProveedorInsumoController } from '../controllers/proveedorinsumo.js'

export const createProveedorInsumoRouter = ({ proveedorInsumoModel }) => {
    const proveedorInsumosRouter = Router()
    const proveedorInsumoController = new ProveedorInsumoController({ proveedorInsumoModel })

    // Endpoints especializados PRIMERO (más específicos)
    proveedorInsumosRouter.get('/proveedor/:id_proveedor/insumos', proveedorInsumoController.getInsumosByProveedor)
    proveedorInsumosRouter.get('/insumo/:id_insumo/proveedores', proveedorInsumoController.getProveedoresByInsumo)
    proveedorInsumosRouter.get('/insumo/:id_insumo/mejor-proveedor', proveedorInsumoController.getMejorProveedorByInsumo)

    // CRUD con dos parámetros para clave compuesta
    proveedorInsumosRouter.get('/:id_proveedor/:id_insumo', proveedorInsumoController.getById)
    proveedorInsumosRouter.delete('/:id_proveedor/:id_insumo', proveedorInsumoController.delete)
    proveedorInsumosRouter.patch('/:id_proveedor/:id_insumo', proveedorInsumoController.update)

    // Rutas generales
    proveedorInsumosRouter.get('/', proveedorInsumoController.getAll)
    proveedorInsumosRouter.post('/', proveedorInsumoController.create)

    return proveedorInsumosRouter
}