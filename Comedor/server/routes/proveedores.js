import { Router } from 'express'
import { ProveedorController } from '../controllers/proveedores.js'

export const createProveedorRouter = ({ proveedorModel }) => {
    const proveedoresRouter = Router()
    const proveedorController = new ProveedorController({ proveedorModel })

    proveedoresRouter.get('/', proveedorController.getAll)
    proveedoresRouter.get('/:id', proveedorController.getById)
    proveedoresRouter.post('/', proveedorController.create)
    proveedoresRouter.delete('/:id', proveedorController.delete)
    proveedoresRouter.patch('/:id', proveedorController.update)

    return proveedoresRouter
}