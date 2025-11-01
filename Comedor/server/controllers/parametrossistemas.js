// Importa las funciones de validación para los datos del ParametroSistema
import { validateParametroSistema, validatePartialParametroSistema } from '../schemas/parametrossistemas.js'

// Controlador para manejar las operaciones relacionadas con los ParametrosSistemas
export class ParametroSistemaController {
    // Recibe el modelo de ParametroSistema por inyección de dependencias
    constructor({ parametroSistemaModel }) {
        this.parametroSistemaModel = parametroSistemaModel
    }

    // Obtiene todos los ParametrosSistemas
    getAll = async (req, res) => {
        try {
            const parametrosSistemas = await this.parametroSistemaModel.getAll()
            res.json(parametrosSistemas)
        } catch (error) {
            console.error('Error al obtener parámetros del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un ParametroSistema por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const parametroSistema = await this.parametroSistemaModel.getById({ id })
            if (!parametroSistema) {
                return res.status(404).json({ message: 'Parámetro del sistema no encontrado' })
            }
            res.json(parametroSistema)
        } catch (error) {
            console.error('Error al obtener parámetro del sistema por ID:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo ParametroSistema después de validar los datos recibidos
    create = async (req, res) => {
        try {
            const result = validateParametroSistema(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) })
            }

            // Verificar si ya existe un parámetro con la misma clave
            if (result.data.clave) {
                const parametroExistente = await this.parametroSistemaModel.getByClave({ clave: result.data.clave })
                if (parametroExistente) {
                    return res.status(409).json({ message: 'Ya existe un parámetro con esta clave' })
                }
            }

            // Crea el nuevo ParametroSistema y responde con el objeto creado
            const newParametroSistema = await this.parametroSistemaModel.create({ input: result.data })
            res.status(201).json(newParametroSistema)
        } catch (error) {
            console.error('Error al crear parámetro del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un ParametroSistema por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            const parametroExistente = await this.parametroSistemaModel.getById({ id })
            if (!parametroExistente) {
                return res.status(404).json({ message: 'Parámetro del sistema no encontrado' })
            }

            await this.parametroSistemaModel.delete({ id })
            res.json({ message: 'Parámetro del sistema eliminado correctamente' })
        } catch (error) {
            console.error('Error al eliminar parámetro del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un ParametroSistema parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            const result = validatePartialParametroSistema(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) })
            }

            const { id } = req.params
            const parametroExistente = await this.parametroSistemaModel.getById({ id })
            if (!parametroExistente) {
                return res.status(404).json({ message: 'Parámetro del sistema no encontrado' })
            }

            // Verificar duplicado de clave si se está actualizando
            if (result.data.clave && result.data.clave !== parametroExistente.clave) {
                const parametroConClave = await this.parametroSistemaModel.getByClave({ clave: result.data.clave })
                if (parametroConClave) {
                    return res.status(409).json({ message: 'Ya existe un parámetro con esta clave' })
                }
            }

            // Actualiza el ParametroSistema y responde con el objeto actualizado
            const updatedParametroSistema = await this.parametroSistemaModel.update({ id, input: result.data })
            res.json(updatedParametroSistema)
        } catch (error) {
            console.error('Error al actualizar parámetro del sistema:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un ParametroSistema por su clave
    getByClave = async (req, res) => {
        try {
            const { clave } = req.params
            const parametroSistema = await this.parametroSistemaModel.getByClave({ clave })
            if (!parametroSistema) {
                return res.status(404).json({ message: 'Parámetro no encontrado' })
            }
            res.json(parametroSistema)
        } catch (error) {
            console.error('Error al obtener parámetro por clave:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un ParametroSistema por su clave
    updateByClave = async (req, res) => {
        try {
            const result = validatePartialParametroSistema(req.body)

            // Si la validación falla, responde con error 400
            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) })
            }

            const { clave } = req.params
            const parametroExistente = await this.parametroSistemaModel.getByClave({ clave })
            if (!parametroExistente) {
                return res.status(404).json({ message: 'Parámetro no encontrado' })
            }

            // Actualiza el ParametroSistema por clave y responde con el objeto actualizado
            const updatedParametroSistema = await this.parametroSistemaModel.updateByClave({ clave, input: result.data })
            res.json(updatedParametroSistema)
        } catch (error) {
            console.error('Error al actualizar parámetro por clave:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene parámetros por categoría
    getByCategoria = async (req, res) => {
        try {
            const { categoria } = req.params
            const parametros = await this.parametroSistemaModel.getByCategoria({ categoria })
            res.json(parametros)
        } catch (error) {
            console.error('Error al obtener parámetros por categoría:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene todos los parámetros activos
    getActivos = async (req, res) => {
        try {
            const parametros = await this.parametroSistemaModel.getActivos()
            res.json(parametros)
        } catch (error) {
            console.error('Error al obtener parámetros activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}