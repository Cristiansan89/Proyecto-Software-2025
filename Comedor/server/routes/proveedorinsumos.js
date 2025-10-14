import { Router } from 'express'
import { ProveedorInsumoController } from '../controllers/proveedorinsumo.js'
import { verifyToken, authorize } from '../middleware/auth.js'

export const proveedorInsumosRouter = Router()

// Obtener todas las relaciones proveedor-insumo
proveedorInsumosRouter.get('/', verifyToken, authorize(['VER_REPORTES']), ProveedorInsumoController.getAll)

// Obtener relación específica por IDs
proveedorInsumosRouter.get('/:idProveedor/:idInsumo', verifyToken, authorize(['VER_REPORTES']), ProveedorInsumoController.getById)

// Crear nueva relación proveedor-insumo
proveedorInsumosRouter.post('/', verifyToken, authorize(['GESTIONAR_INVENTARIO']), ProveedorInsumoController.create)

// Actualizar relación proveedor-insumo
proveedorInsumosRouter.patch('/:idProveedor/:idInsumo', verifyToken, authorize(['GESTIONAR_INVENTARIO']), ProveedorInsumoController.update)

// Eliminar relación proveedor-insumo
proveedorInsumosRouter.delete('/:idProveedor/:idInsumo', verifyToken, authorize(['GESTIONAR_INVENTARIO']), ProveedorInsumoController.delete)

// Obtener insumos de un proveedor
proveedorInsumosRouter.get('/proveedor/:idProveedor', verifyToken, authorize(['VER_REPORTES']), ProveedorInsumoController.getByProveedor)

// Obtener proveedores de un insumo
proveedorInsumosRouter.get('/insumo/:idInsumo', verifyToken, authorize(['VER_REPORTES']), ProveedorInsumoController.getByInsumo)

// Obtener mejores proveedores para un insumo
proveedorInsumosRouter.get('/insumo/:idInsumo/mejores', verifyToken, authorize(['GESTIONAR_INVENTARIO']), ProveedorInsumoController.getBestProviders)