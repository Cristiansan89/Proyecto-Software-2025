import { Router } from 'express'
import { PersonaController } from '../controllers/personas.js'

export const createPersonaRouter = ({ personaModel }) => {
    const personasRouter = Router()
    const personaController = new PersonaController({ personaModel })

    personasRouter.get('/', personaController.getAll)
    personasRouter.get('/perfil', personaController.getPerfil) // Debe ir antes de /:id
    personasRouter.get('/:id', personaController.getById)
    personasRouter.post('/', personaController.create)
    personasRouter.delete('/:id', personaController.delete)
    personasRouter.patch('/:id', personaController.update)

    // Endpoints especializados
    personasRouter.get('/activas/list', personaController.getActivas)
    personasRouter.get('/search/by-nombre', personaController.searchByNombre)
    personasRouter.get('/grado/:id_grado', personaController.getByGrado)
    personasRouter.get('/servicio/:id_servicio', personaController.getByServicio)
    personasRouter.patch('/:id/estado', personaController.cambiarEstado)

    return personasRouter
}