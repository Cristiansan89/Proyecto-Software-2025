// Importa las funciones de validación para los datos del Grado
import { validateGrado, validatePartialGrado } from '../schemas/grados.js'

// Controlador para manejar las operaciones relacionadas con los Grados
export class GradoController {
    // Recibe el modelo de Grado por inyección de dependencias
    constructor({ gradoModel }) {
        this.gradoModel = gradoModel
    }

    // Obtiene todos los Grados
    getAll = async (req, res) => {
        try {
            const grados = await this.gradoModel.getAll()
            res.json(grados)
        } catch (error) {
            console.error('Error al obtener grados:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene un Grado por su ID
    getById = async (req, res) => {
        try {
            const { id } = req.params
            const grado = await this.gradoModel.getById({ id })

            if (grado) return res.json(grado)
            res.status(404).json({ message: 'Grado no encontrado' })
        } catch (error) {
            console.error('Error al obtener grado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Crea un nuevo Grado después de validar los datos recibidos
    create = async (req, res) => {
        try {
            console.log('GradoController: Datos recibidos:', req.body)

            // Transformar idTurno de string a number si es necesario
            const processedData = {
                ...req.body,
                idTurno: req.body.idTurno ? parseInt(req.body.idTurno) : req.body.idTurno
            }
            console.log('GradoController: Datos procesados:', processedData)

            const result = validateGrado(processedData)
            console.log('GradoController: Resultado de validación:', result)

            if (!result.success) {
                console.log('GradoController: Errores de validación:', result.error.issues)
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                })
            }

            console.log('GradoController: Creando grado con datos:', result.data)
            const newGrado = await this.gradoModel.create({ input: result.data })
            console.log('GradoController: Grado creado:', newGrado)
            res.status(201).json(newGrado)
        } catch (error) {
            console.error('GradoController: Error al crear grado:', error)
            if (error.message.includes('ya existe')) {
                return res.status(409).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Elimina un Grado por su ID
    delete = async (req, res) => {
        try {
            const { id } = req.params
            console.log('GradoController: Eliminando grado con ID:', id)

            const deleted = await this.gradoModel.delete({ id })
            console.log('GradoController: Resultado de eliminación:', deleted)

            if (!deleted) {
                console.log('GradoController: Grado no encontrado')
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            console.log('GradoController: Grado eliminado exitosamente')
            return res.json({ message: 'Grado eliminado correctamente' })
        } catch (error) {
            console.error('GradoController: Error al eliminar grado:', error)
            if (error.message.includes('referencia') || error.message.includes('usado')) {
                return res.status(409).json({ message: 'No se puede eliminar el grado porque está en uso' })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Actualiza un Grado parcialmente después de validar los datos recibidos
    update = async (req, res) => {
        try {
            // Transformar idTurno de string a number si es necesario
            const processedData = {
                ...req.body,
                idTurno: req.body.idTurno ? parseInt(req.body.idTurno) : req.body.idTurno
            }

            const result = validatePartialGrado(processedData)

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
            const updatedGrado = await this.gradoModel.update({ id, input: result.data })

            if (!updatedGrado) {
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            return res.json(updatedGrado)
        } catch (error) {
            console.error('Error al actualizar grado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener grados activos
    getActivos = async (req, res) => {
        try {
            // Filtrar grados activos desde getAll()
            const allGrados = await this.gradoModel.getAll()
            const gradosActivos = allGrados.filter(grado => grado.estado === 'Activo')
            res.json(gradosActivos)
        } catch (error) {
            console.error('Error al obtener grados activos:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtener grados por turno
    getByTurno = async (req, res) => {
        try {
            const { id_turno } = req.params
            const grados = await this.gradoModel.getByTurno({ idTurno: id_turno })
            res.json(grados)
        } catch (error) {
            console.error('Error al obtener grados por turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Buscar grados por nombre
    searchByNombre = async (req, res) => {
        try {
            const { nombre } = req.query
            if (!nombre) {
                return res.status(400).json({ message: 'El parámetro nombre es requerido' })
            }
            // Implementar búsqueda usando getAll y filtrar
            const allGrados = await this.gradoModel.getAll()
            const gradosFiltrados = allGrados.filter(grado =>
                grado.nombreGrado.toLowerCase().includes(nombre.toLowerCase())
            )
            res.json(gradosFiltrados)
        } catch (error) {
            console.error('Error al buscar grados por nombre:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del grado
    cambiarEstado = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (estado === undefined) {
                return res.status(400).json({ message: 'El estado es requerido' })
            }

            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ message: 'Estado inválido' })
            }

            const gradoActualizado = await this.gradoModel.update({ id, input: { estado } })
            if (!gradoActualizado) {
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            res.json(gradoActualizado)
        } catch (error) {
            console.error('Error al cambiar estado del grado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Obtiene grados por turno específico
    getByTurno = async (req, res) => {
        try {
            const { idTurno } = req.params
            console.log('GradoController: Obteniendo grados para turno ID:', idTurno)
            
            const grados = await this.gradoModel.getByTurno({ idTurno })
            console.log('GradoController: Grados encontrados:', grados)
            
            res.json(grados)
        } catch (error) {
            console.error('Error al obtener grados por turno:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    // Cambiar estado del grado (método alternativo)
    changeStatus = async (req, res) => {
        try {
            const { id } = req.params
            const { estado } = req.body

            if (!['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ message: 'Estado inválido' })
            }

            const updatedGrado = await this.gradoModel.update({ id, input: { estado } })

            if (!updatedGrado) {
                return res.status(404).json({ message: 'Grado no encontrado' })
            }

            res.json({ message: `Grado ${estado.toLowerCase()} correctamente`, grado: updatedGrado })
        } catch (error) {
            console.error('Error al cambiar estado del grado:', error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}