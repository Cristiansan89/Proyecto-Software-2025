import { Router } from 'express'
import { DocenteGradoController } from '../controllers/docentegrado.js'

const router = Router()

// Obtener todos los docentes asignados a grados
router.get('/', DocenteGradoController.getAll)

// Obtener docentes disponibles para asignar
router.get('/docentes-disponibles', DocenteGradoController.getDocentesDisponibles)

// Obtener grados disponibles (sin docente asignado)
router.get('/grados-disponibles', DocenteGradoController.getGradosDisponibles)

// Obtener grados asignados a un docente específico
router.get('/grados-by-docente', DocenteGradoController.getGradosByDocente)

// Obtener docentes por grado específico
router.get('/grado/:nombreGrado', DocenteGradoController.getByGrado)

// Obtener asignación específica por clave compuesta
router.get('/:idDocenteTitular/:idPersona/:nombreGrado', DocenteGradoController.getById)

// Crear nueva asignación de docente a grado
router.post('/', DocenteGradoController.create)

// Actualizar asignación existente
router.put('/:idDocenteTitular/:idPersona/:nombreGrado', DocenteGradoController.update)

// Eliminar asignación
router.delete('/:idDocenteTitular/:idPersona/:nombreGrado', DocenteGradoController.delete)

export default router