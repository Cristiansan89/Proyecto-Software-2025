import { Router } from 'express'
import { PersonaController } from '../controllers/personas.js'

export const createPersonaRouter = ({ personaModel }) => {
    const personasRouter = Router()
    const personaController = new PersonaController({ personaModel })

    personasRouter.get('/', personaController.getAll)
    personasRouter.get('/:id', personaController.getById)
    personasRouter.post('/', personaController.create)
    personasRouter.delete('/:id', personaController.delete)
    personasRouter.patch('/:id', personaController.update)

    return personasRouter
}