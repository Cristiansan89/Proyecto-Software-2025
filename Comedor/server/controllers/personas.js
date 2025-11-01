// Importa las funciones de validación para los datos de las Personas
import { validatePersona, validatePartialPersona } from '../schemas/personas.js'

// Controlador para manejar las operaciones relacionadas con las Personas
export class PersonaController {
    // Recibe el modelo de Persona por inyección de dependencias
    constructor({ personaModel }) {
        this.personaModel = personaModel
    }

    // Obtiene todas las Personas
    getAll = async (req, res) => {
        try {
            const personas = await this.personaModel.getAll()
            res.json(personas)
        } catch (error) {
            console.error('Error al obtener personas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene una Persona por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const persona = await this.personaModel.getById({ id })
            if (persona) return res.json(persona)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Persona no encontrada' })
        } catch (error) {
            console.error('Error al obtener persona:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea una nueva Persona después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validatePersona(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            // Crea la nueva Persona y responde con el objeto creado
            const newPersona = await this.personaModel.create({ input: result.data })
            res.status(201).json(newPersona)
        } catch (error) {
            console.error('Error al crear persona:', error)
            if (error.message.includes('ya existe') || error.message.includes('duplicado')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina una Persona por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.personaModel.delete({ id })

            // Si no se encuentra la Persona, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Persona no encontrada' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Persona eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar persona:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza una Persona parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialPersona(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const { id } = req.params
            // Actualiza la Persona y responde con el objeto actualizado
            const updatedPersona = await this.personaModel.update({ id, input: result.data })

            if (!updatedPersona) {
                return res.status(404).json({ message: 'Persona no encontrada' })
            }

            res.json(updatedPersona)
        } catch (error) {
            console.error('Error al actualizar persona:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar personas por grado
    getByGrado = async (req, res) => {
        try {
            const { id_grado } = req.params
            const personas = await this.personaModel.getByGrado({ id_grado })
            res.json(personas)
        } catch (error) {
            console.error('Error al obtener personas por grado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar persona por documento
    getByDocumento = async (req, res) => {
        try {
            const { numeroDocumento } = req.params
            const persona = await this.personaModel.getByDocumento({ numeroDocumento })
            if (persona) return res.json(persona)
            res.status(404).json({ message: 'Persona no encontrada' })
        } catch (error) {
            console.error('Error al buscar persona por documento:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener personas activas
    getActivas = async (req, res) => {
        try {
            const personas = await this.personaModel.getActivas()
            res.json(personas)
        } catch (error) {
            console.error('Error al obtener personas activas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar personas por nombre
    searchByNombre = async (req, res) => {
        try {
            const { nombre } = req.query
            if (!nombre) {
                return res.status(400).json({ message: 'El parámetro nombre es requerido' })
            }
            const personas = await this.personaModel.searchByNombre({ nombre })
            res.json(personas)
        } catch (error) {
            console.error('Error al buscar personas por nombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener personas por servicio
    getByServicio = async (req, res) => {
        try {
            const { id_servicio } = req.params
            const personas = await this.personaModel.getByServicio({ id_servicio })
            res.json(personas)
        } catch (error) {
            console.error('Error al obtener personas por servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado de la persona
    cambiarEstado = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (estado === undefined) {
                return res.status(400).json({ message: 'El estado es requerido' })
            }

            const updated = await this.personaModel.cambiarEstado({ id, estado })

            if (!updated) {
                return res.status(404).json({ message: 'Persona no encontrada' })
            }

            res.json(updated)
        } catch (error) {
            console.error('Error al cambiar estado de la persona:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}