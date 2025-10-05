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
        const planificacionMenus = await this.planificacionMenuModel.getAll()
        res.json(planificacionMenus)
    }

    // Obtiene un PlanificacionMenu por su ID
    getById = async (req, res) => {
        const { id } = req.params
        const planificacionMenu = await this.planificacionMenuModel.getById({ id })
        if (planificacionMenu) return res.json(planificacionMenu)
        // Si no existe, responde con 404
        res.status(404).json({ message: 'El ID del PlanificacionMenu no funciona' })

    }

    // Crea un nuevo PlanificacionMenu después de validar los datos recibidos
    create = async (req, res) => {
        const result = validatePlanificacionMenu(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        // Crea el nuevo PlanificacionMenu y responde con el objeto creado
        const newPlanificacionMenu = await this.planificacionMenuModel.create({ input: result.data })
        res.status(201).json(newPlanificacionMenu)
    }

    // Elimina un PlanificacionMenu por su ID
    delete = async (req, res) => {
        const { id } = req.params
        const deleted = await this.planificacionMenuModel.delete({ id })

        // Si no se encuentra el PlanificacionMenu, responde con 404
        if (!deleted) {
            return res.status(404).json({ message: 'El ID del PlanificacionMenu no funciona' })
        }
        // Si se elimina correctamente, responde con mensaje de éxito
        return res.json({ message: 'PlanificacionMenu eliminado correctamente' })
    }

    // Actualiza un PlanificacionMenu parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        const result = validatePartialPlanificacionMenu(req.body)

        // Si la validación falla, responde con error 400
        if (!result.success) {
            return res.status(400).json({ error: JSON.parse(result.error.message) })
        }

        const { id } = req.params
        // Actualiza el PlanificacionMenu y responde con el objeto actualizado
        const updatedPlanificacionMenu = await this.planificacionMenuModel.update({ id, input: result.data })
        res.json(updatedPlanificacionMenu)
    }
}