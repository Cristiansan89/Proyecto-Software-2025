// Importa las funciones de validación para los datos de los Servicios
import { validateServicio, validatePartialServicio } from '../schemas/servicios.js'

// Controlador para manejar las operaciones relacionadas con los Servicios
export class ServicioController {
    // Recibe el modelo de Servicio por inyección de dependencias
    constructor({ servicioModel }) {
        this.servicioModel = servicioModel
    }

    // Obtiene todos los Servicios
    getAll = async (req, res) => {
        try {
            const servicios = await this.servicioModel.getAll()
            res.json(servicios)
        } catch (error) {
            console.error('Error al obtener servicios:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Servicio por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const servicio = await this.servicioModel.getById({ id })
            if (servicio) return res.json(servicio)
            res.status(404).json({ message: 'Servicio no encontrado' })
        } catch (error) {
            console.error('Error al obtener servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Servicio después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateServicio(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            // Crea el nuevo Servicio y responde con el objeto creado
            const newServicio = await this.servicioModel.create({ input: result.data })
            res.status(201).json(newServicio)
        } catch (error) {
            console.error('Error al crear servicio:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Servicio por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            console.log('ServicioController: Eliminando servicio con ID:', id)

            const deleted = await this.servicioModel.delete({ id })
            console.log('ServicioController: Resultado de eliminación:', deleted)

            if (!deleted) {
                console.log('ServicioController: Servicio no found')
                return res.status(404).json({ message: 'Servicio no encontrado' })
            }
            console.log('ServicioController: Servicio eliminado exitosamente')
            return res.json({ message: 'Servicio eliminado correctamente' })
        } catch (error) {
            console.error('ServicioController: Error al eliminar servicio:', error)
            if (error.message.includes('referencia') || error.message.includes('usado')) {
                return res.status(409).json({ message: 'No se puede eliminar el servicio porque está en uso' })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Servicio parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialServicio(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const { id } = req.params
            const updatedServicio = await this.servicioModel.update({ id, input: result.data })

            if (!updatedServicio) {
                return res.status(404).json({ message: 'Servicio no encontrado' })
            }

            res.json(updatedServicio)
        } catch (error) {
            console.error('Error al actualizar servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener servicios activos
    getActivos = async (req, res) => {
        try {
            const servicios = await this.servicioModel.getActivos()
            res.json(servicios)
        } catch (error) {
            console.error('Error al obtener servicios activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del servicio
    changeStatus = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ message: 'Estado inválido' })
            }

            const updatedServicio = await this.servicioModel.update({ id, input: { estado } })

            if (!updatedServicio) {
                return res.status(404).json({ message: 'Servicio no encontrado' })
            }

            res.json({ message: `Servicio ${estado.toLowerCase()} correctamente`, servicio: updatedServicio })
        } catch (error) {
            console.error('Error al cambiar estado del servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}