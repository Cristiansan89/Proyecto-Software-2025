import { Router } from 'express'
import { AlumnoGradoController } from '../controllers/alumnogrado.js'

const router = Router()

// Obtener todos los alumnos asignados a grados
router.get('/', AlumnoGradoController.getAll)

// Obtener alumnos disponibles para asignar
router.get('/disponibles', AlumnoGradoController.getAlumnosDisponibles)

// Obtener asignación específica por ID
router.get('/:id', AlumnoGradoController.getById)

// Obtener alumnos por grado específico
router.get('/grado/:nombreGrado', AlumnoGradoController.getByGrado)

// Crear nueva asignación de alumno a grado
router.post('/', AlumnoGradoController.create)

// Actualizar asignación existente
router.put('/:id', AlumnoGradoController.update)

// Eliminar asignación
router.delete('/:id', AlumnoGradoController.delete)

export default router