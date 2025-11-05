import { DocenteGradoModel } from '../models/docentegrado.js'
import { validateDocenteGrado, validatePartialDocenteGrado } from '../schemas/docentegrado.js'

export class DocenteGradoController {
    // Función para normalizar fechas de timestamp a YYYY-MM-DD
    static normalizeFecha(fecha) {
        if (!fecha) return fecha;

        // Convertir a string si no lo es
        const fechaStr = String(fecha);

        // Si es un timestamp completo, convertir a fecha
        if (fechaStr.includes('T')) {
            return fechaStr.split('T')[0];
        }

        return fechaStr;
    }

    static async getAll(req, res) {
        try {
            const docentes = await DocenteGradoModel.getAll()
            res.json(docentes)
        } catch (error) {
            console.error('Error al obtener docentes-grados:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getById(req, res) {
        try {
            const { idDocenteTitular, idPersona, nombreGrado } = req.params
            const docente = await DocenteGradoModel.getById({
                idDocenteTitular: parseInt(idDocenteTitular),
                idPersona: parseInt(idPersona),
                nombreGrado
            })

            if (!docente) {
                return res.status(404).json({
                    message: 'Asignación de docente-grado no encontrada'
                })
            }

            res.json(docente)
        } catch (error) {
            console.error('Error al obtener docente-grado:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getByGrado(req, res) {
        try {
            const { nombreGrado } = req.params
            const docentes = await DocenteGradoModel.getByGrado({ nombreGrado })
            res.json(docentes)
        } catch (error) {
            console.error('Error al obtener docentes por grado:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async create(req, res) {
        try {
            // Normalizar fechas antes de validar
            const normalizedData = {
                ...req.body,
                cicloLectivo: DocenteGradoController.normalizeFecha(req.body.cicloLectivo),
                fechaAsignado: DocenteGradoController.normalizeFecha(req.body.fechaAsignado)
            };

            const result = validateDocenteGrado(normalizedData)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }

            const docente = await DocenteGradoModel.create({ input: result.data })
            res.status(201).json(docente)
        } catch (error) {
            console.error('Error al crear asignación docente-grado:', error)

            if (error.message.includes('ya tiene un docente asignado')) {
                return res.status(409).json({
                    message: error.message
                })
            }

            if (error.message.includes('no tiene el rol')) {
                return res.status(400).json({
                    message: error.message
                })
            }

            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async update(req, res) {
        try {
            const { idDocenteTitular, idPersona, nombreGrado } = req.params
            const result = validatePartialDocenteGrado(req.body)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }

            const docente = await DocenteGradoModel.update({
                idDocenteTitular: parseInt(idDocenteTitular),
                idPersona: parseInt(idPersona),
                nombreGrado,
                input: result.data
            })

            if (!docente) {
                return res.status(404).json({
                    message: 'Asignación de docente-grado no encontrada'
                })
            }

            res.json(docente)
        } catch (error) {
            console.error('Error al actualizar asignación docente-grado:', error)

            if (error.message.includes('ya tiene un docente asignado')) {
                return res.status(409).json({
                    message: error.message
                })
            }

            if (error.message.includes('no tiene el rol')) {
                return res.status(400).json({
                    message: error.message
                })
            }

            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async delete(req, res) {
        try {
            const { idDocenteTitular, idPersona, nombreGrado } = req.params
            const deleted = await DocenteGradoModel.delete({
                idDocenteTitular: parseInt(idDocenteTitular),
                idPersona: parseInt(idPersona),
                nombreGrado
            })

            if (!deleted) {
                return res.status(404).json({
                    message: 'Asignación de docente-grado no encontrada'
                })
            }

            res.json({
                message: 'Asignación de docente-grado eliminada correctamente'
            })
        } catch (error) {
            console.error('Error al eliminar asignación docente-grado:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getDocentesDisponibles(req, res) {
        try {
            const { cicloLectivo } = req.query
            const docentes = await DocenteGradoModel.getDocentesDisponibles({
                cicloLectivo: cicloLectivo || new Date().getFullYear()
            })
            res.json(docentes)
        } catch (error) {
            console.error('Error al obtener docentes disponibles:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getGradosDisponibles(req, res) {
        try {
            const { cicloLectivo } = req.query
            const grados = await DocenteGradoModel.getGradosDisponibles({
                cicloLectivo: cicloLectivo || new Date().getFullYear()
            })
            res.json(grados)
        } catch (error) {
            console.error('Error al obtener grados disponibles:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }
}