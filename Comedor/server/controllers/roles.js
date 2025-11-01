// Importa las funciones de validación para los datos del rol
import { validateRol, validatePartialRol } from '../schemas/roles.js'

// Controlador para manejar las operaciones relacionadas con los roles
export class RolController {
    // Recibe el modelo de rol por inyección de dependencias
    constructor({ rolModel }) {
        this.rolModel = rolModel
    }

    // Obtiene todos los roles o filtra por nombre_rol si se pasa como query
    getAll = async (req, res) => {
        try {
            const { nombre_rol } = req.query
            const roles = await this.rolModel.getAll({ nombre_rol })
            res.json(roles)
        } catch (error) {
            console.error('Error al obtener roles:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un rol por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const rol = await this.rolModel.getById({ id })
            if (rol) return res.json(rol)
            res.status(404).json({ message: 'Rol no encontrado' })
        } catch (error) {
            console.error('Error al obtener rol:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo rol después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateRol(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            const newRol = await this.rolModel.create({ input: result.data })
            res.status(201).json(newRol)
        } catch (error) {
            console.error('Error al crear rol:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un rol por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const deleted = await this.rolModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({ message: 'Rol no encontrado' })
            }
            return res.json({ message: 'Rol eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar rol:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un rol parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialRol(req.body)

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
            const updatedRol = await this.rolModel.update({ id, input: result.data })

            if (!updatedRol) {
                return res.status(404).json({ message: 'Rol no encontrado' })
            }

            res.json(updatedRol)
        } catch (error) {
            console.error('Error al actualizar rol:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener roles activos
    getActivos = async (req, res) => {
        try {
            const roles = await this.rolModel.getRolesActivos()
            res.json(roles)
        } catch (error) {
            console.error('Error al obtener roles activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar roles por nombre
    searchByNombre = async (req, res) => {
        try {
            const { nombre } = req.query
            if (!nombre) {
                return res.status(400).json({ message: 'El parámetro nombre es requerido' })
            }
            const roles = await this.rolModel.searchByNombre({ nombre })
            res.json(roles)
        } catch (error) {
            console.error('Error al buscar roles por nombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener rol con sus permisos
    getConPermisos = async (req, res) => {
        try {
            const { id } = req.params
            const rolConPermisos = await this.rolModel.getConPermisos({ id })
            if (!rolConPermisos) {
                return res.status(404).json({ message: 'Rol no encontrado' })
            }
            res.json(rolConPermisos)
        } catch (error) {
            console.error('Error al obtener rol con permisos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del rol
    cambiarEstado = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (estado === undefined) {
                return res.status(400).json({ message: 'El estado es requerido' })
            }

            const rolActualizado = await this.rolModel.cambiarEstado({ id, estado })
            if (!rolActualizado) {
                return res.status(404).json({ message: 'Rol no encontrado' })
            }

            res.json(rolActualizado)
        } catch (error) {
            console.error('Error al cambiar estado del rol:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}