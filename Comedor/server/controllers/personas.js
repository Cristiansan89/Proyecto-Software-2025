// Importa las funciones de validación para los datos del Persona
import { validatePersona, validatePartialPersona } from '../schemas/personas.js'

// Controlador para manejar las operaciones relacionadas con los Personas
export class PersonaController {
    // Recibe el modelo de Persona por inyección de dependencias
    constructor({ personaModel }) {
        this.personaModel = personaModel
    }

    // Obtiene todos los Personas
    getAll = async (req, res) => {
        const personas = await this.personaModel.getAll()
        res.json(personas)
    }

    // Obtiene un Persona por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const persona = await this.personaModel.getById({ id })
        if (persona) return res.json(persona)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del Persona no funciona' })

    }

    // Crea un nuevo Persona después de validar los datos recibidos
    create = async (req, res) => {
        const result = validatePersona(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo Persona y responde con el objeto creado
        const newPersona = await this.personaModel.create({ input: result.data })
        res.status(201).json(newPersona)
    }

    // Elimina un Persona por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.personaModel.delete({ id })

        // Si no se encuentra el Persona, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del Persona no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'Persona eliminado correctamente' })
    }

    // Actualiza un Persona parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialPersona(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el Persona y responde con el objeto actualizado
        const updatedPersona = await this.personaModel.update({ id, input: result.data })
        res.json(updatedPersona)
    }
}