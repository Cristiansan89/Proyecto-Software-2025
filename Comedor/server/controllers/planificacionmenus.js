// Importa las funciones de validación para los datos del planificacionmenu
import { validatePlanificacionMenu, validatePartialPlanificacionMenu } from '../schemas/planificacionmenus.js'

// Controlador para manejar las operaciones relacionadas con los PlanificacionMenus
export class PlanificacionMenuController {
    // Recibe el modelo de PlanificacionMenu por inyección de dependencias
    constructor({ planificacionMenuModel }) {
        this.planificacionMenuModel = planificacionMenuModel
    }

    // Obtiene todos los PlanificacionMenus
    getAll = async (req, res) => {
        try {
            const planificacionMenus = await this.planificacionMenuModel.getAll()
            res.json(planificacionMenus)
        } catch (error) {
            console.error('Error al obtener planificaciones de menú:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un PlanificacionMenu por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const planificacionMenu = await this.planificacionMenuModel.getById({ id })
            if (planificacionMenu) return res.json(planificacionMenu)
            // Si no existe, responde con 404
            res.status(404).json({ message: 'Planificación de menú no encontrada' })
        } catch (error) {
            console.error('Error al obtener planificación de menú por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo PlanificacionMenu después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validatePlanificacionMenu(req.body)

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

            // Crea el nuevo PlanificacionMenu y responde con el objeto creado
            const newPlanificacionMenu = await this.planificacionMenuModel.create({ input: result.data })
            res.status(201).json(newPlanificacionMenu)
        } catch (error) {
            console.error('Error al crear planificación de menú:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un PlanificacionMenu por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.planificacionMenuModel.delete({ id })

            // Si no se encuentra el PlanificacionMenu, responde con 404
            if (!deleted) {
                return res.status(404).json({ message: 'Planificación de menú no encontrada' })
            }
            // Si se elimina correctamente, responde con mensaje de éxito
            return res.json({ message: 'Planificación de menú eliminada correctamente' })
        } catch (error) {
            console.error('Error al eliminar planificación de menú:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un PlanificacionMenu parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialPlanificacionMenu(req.body)

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
            // Actualiza el PlanificacionMenu y responde con el objeto actualizado
            const updatedPlanificacionMenu = await this.planificacionMenuModel.update({ id, input: result.data })

            if (!updatedPlanificacionMenu) {
                return res.status(404).json({ message: 'Planificación de menú no encontrada' })
            }

            return res.json(updatedPlanificacionMenu)
        } catch (error) {
            console.error('Error al actualizar planificación de menú:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener planificaciones por fecha
    getByFecha = async (req, res) => {
        try {
            const { fecha } = req.params
            const planificaciones = await this.planificacionMenuModel.getByFecha({ fecha })
            res.json(planificaciones)
        } catch (error) {
            console.error('Error al obtener planificaciones por fecha:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener planificaciones por servicio
    getByServicio = async (req, res) => {
        try {
            const { id_servicio } = req.params
            const planificaciones = await this.planificacionMenuModel.getByServicio({ id_servicio })
            res.json(planificaciones)
        } catch (error) {
            console.error('Error al obtener planificaciones por servicio:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener planificaciones por rango de fechas
    getByRangoFechas = async (req, res) => {
        try {
            const { fecha_inicio, fecha_fin } = req.query
            const planificaciones = await this.planificacionMenuModel.getByRangoFechas({ fecha_inicio, fecha_fin })
            res.json(planificaciones)
        } catch (error) {
            console.error('Error al obtener planificaciones por rango de fechas:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener menú del día
    getMenuDelDia = async (req, res) => {
        try {
            const { fecha, id_servicio } = req.params
            const menu = await this.planificacionMenuModel.getMenuDelDia({ fecha, id_servicio })
            if (menu) return res.json(menu)
            res.status(404).json({ message: 'No hay menú planificado para esta fecha y servicio' })
        } catch (error) {
            console.error('Error al obtener menú del día:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}