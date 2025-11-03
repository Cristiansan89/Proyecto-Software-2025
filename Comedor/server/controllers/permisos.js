// Importa las funciones de validación para los datos del Permiso
import { validatePermiso, validatePartialPermiso } from '../schemas/permisos.js'

// Controlador para manejar las operaciones relacionadas con los Permisos
export class PermisoController {
    // Recibe el modelo de Permiso por inyección de dependencias
    constructor({ permisoModel }) {
        this.permisoModel = permisoModel
    }

    // Obtiene todos los Permisos
    getAll = async (req, res) => {
        try {
            const permisos = await this.permisoModel.getAll()
            res.json(permisos)
        } catch (error) {
            console.error('Error al obtener permisos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Permiso por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const permiso = await this.permisoModel.getById({ id })
            if (permiso) return res.json(permiso)
            res.status(404).json({ message: 'Permiso no encontrado' })
        } catch (error) {
            console.error('Error al obtener permiso:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Permiso después de validar los datos recibidos
    create = async (req, res) => {
        try {
            console.log('PermisoController: Datos recibidos:', req.body)
            const result = validatePermiso(req.body)
            console.log('PermisoController: Resultado de validación:', result)

            if (!result.success) {
                console.log('PermisoController: Errores de validación:', result.error.issues)
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newPermiso = await this.permisoModel.create({ input: result.data })
            res.status(201).json(newPermiso)
        } catch (error) {
            console.error('Error al crear permiso:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Permiso por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            await this.permisoModel.delete({ id })
            return res.json({ message: 'Permiso eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar permiso:', error)

            // Manejar errores específicos
            if (error.message.includes('asignado a') || error.message.includes('referencia')) {
                return res.status(409).json({
                    message: error.message,
                    code: 'FOREIGN_KEY_CONSTRAINT'
                })
            }

            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    message: 'No se puede eliminar el permiso porque está asignado a uno o más roles. Primero debe eliminar las asignaciones.',
                    code: 'FOREIGN_KEY_CONSTRAINT'
                })
            }

            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Permiso parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialPermiso(req.body)

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
            const updatedPermiso = await this.permisoModel.update({ id, input: result.data })

            if (!updatedPermiso) {
                return res.status(404).json({ message: 'Permiso no encontrado' })
            }

            res.json(updatedPermiso)
        } catch (error) {
            console.error('Error al actualizar permiso:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener permisos activos
    getActivos = async (req, res) => {
        try {
            const permisos = await this.permisoModel.getActivos()
            res.json(permisos)
        } catch (error) {
            console.error('Error al obtener permisos activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener permisos por módulo
    getByModulo = async (req, res) => {
        try {
            const { modulo } = req.params
            const permisos = await this.permisoModel.getByModulo({ modulo })
            res.json(permisos)
        } catch (error) {
            console.error('Error al obtener permisos por módulo:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar permisos por texto
    searchByTexto = async (req, res) => {
        try {
            const { texto } = req.query
            if (!texto) {
                return res.status(400).json({ message: 'El parámetro texto es requerido' })
            }
            const permisos = await this.permisoModel.buscarPorTexto({ texto })
            res.json(permisos)
        } catch (error) {
            console.error('Error al buscar permisos por texto:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del permiso
    cambiarEstado = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (estado === undefined) {
                return res.status(400).json({ message: 'El estado es requerido' })
            }

            const updated = await this.permisoModel.cambiarEstado({ id, estado })

            if (!updated) {
                return res.status(404).json({ message: 'Permiso no encontrado' })
            }

            res.json(updated)
        } catch (error) {
            console.error('Error al cambiar estado del permiso:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}