import { Router } from 'express'
import { ReemplazoDocenteController } from '../controllers/reemplazodocente.js'

const router = Router()

// Obtener todos los reemplazos
router.get('/', ReemplazoDocenteController.getAll)

// Obtener opciones (motivos y estados)
router.get('/options', ReemplazoDocenteController.getOptions)

// Obtener docentes suplentes disponibles
router.get('/suplentes-disponibles', ReemplazoDocenteController.getDocentesSupletesDisponibles)

// Obtener docentes titulares
router.get('/docentes-titulares', ReemplazoDocenteController.getDocentesTitulares)

// Obtener reemplazo específico por ID
router.get('/:id', ReemplazoDocenteController.getById)

// Obtener reemplazos por grado específico
router.get('/grado/:nombreGrado', ReemplazoDocenteController.getByGrado)

// Crear nuevo reemplazo
router.post('/', ReemplazoDocenteController.create)

// Actualizar reemplazo existente
router.put('/:id', ReemplazoDocenteController.update)

// Finalizar reemplazo
router.patch('/:id/finalizar', ReemplazoDocenteController.finalizarReemplazo)

// Eliminar reemplazo
router.delete('/:id', ReemplazoDocenteController.delete)

export default router