import { ReemplazoDocenteModel } from '../models/reemplazodocente.js'
import { validateReemplazoDocente, validatePartialReemplazoDocente, motivosReemplazo, estadosReemplazo, motivosDisplay } from '../schemas/reemplazodocente.js'

export class ReemplazoDocenteController {
    // Mapeo inverso de nombres amigables a valores en BD
    static motivosInverso = Object.entries(motivosDisplay).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    }, {});

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

    // Función para normalizar el campo motivo
    // Convierte nombres amigables (ej: 'Licencia Médica') a valores sin acentos (ej: 'licencia_medica')
    static normalizarMotivo(motivo) {
        if (!motivo) return motivo;
        
        // Convertir a string y hacer trim para eliminar espacios en blanco
        const motivoTrimmed = String(motivo).trim();
        
        // Buscar en el mapeo inverso (si viene con nombre amigable)
        if (this.motivosInverso[motivoTrimmed]) {
            return this.motivosInverso[motivoTrimmed];
        }
        
        // Si ya es un valor sin acentos, validar que sea permitido
        if (motivosReemplazo.includes(motivoTrimmed)) {
            return motivoTrimmed;
        }
        
        throw new Error(`Motivo inválido: ${motivo}. Motivos permitidos: ${Object.values(this.motivosInverso).join(', ')}`);
    }

    static async getAll(req, res) {
        try {
            const reemplazos = await ReemplazoDocenteModel.getAll()
            res.json(reemplazos)
        } catch (error) {
            console.error('Error al obtener reemplazos:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params
            const reemplazo = await ReemplazoDocenteModel.getById({ id })

            if (!reemplazo) {
                return res.status(404).json({
                    message: 'Reemplazo no encontrado'
                })
            }

            res.json(reemplazo)
        } catch (error) {
            console.error('Error al obtener reemplazo:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getByGrado(req, res) {
        try {
            const { nombreGrado } = req.params
            const reemplazos = await ReemplazoDocenteModel.getByGrado({ nombreGrado })
            res.json(reemplazos)
        } catch (error) {
            console.error('Error al obtener reemplazos por grado:', error)
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
                fechaInicio: ReemplazoDocenteController.normalizeFecha(req.body.fechaInicio),
                fechaFin: ReemplazoDocenteController.normalizeFecha(req.body.fechaFin),
                cicloLectivo: ReemplazoDocenteController.normalizeFecha(req.body.cicloLectivo),
                motivo: ReemplazoDocenteController.normalizarMotivo(req.body.motivo)
            };

            const result = validateReemplazoDocente(normalizedData)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }

            const reemplazo = await ReemplazoDocenteModel.create({ input: result.data })
            res.status(201).json(reemplazo)
        } catch (error) {
            console.error('Error al crear reemplazo:', error)

            if (error.message.includes('ya existe un reemplazo activo')) {
                return res.status(409).json({
                    message: error.message
                })
            }

            if (error.message.includes('no tiene el rol')) {
                return res.status(400).json({
                    message: error.message
                })
            }

            if (error.message.includes('No existe un docente titular')) {
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
            const { id } = req.params

            // Normalizar fechas antes de validar
            const normalizedData = {
                ...req.body,
                fechaInicio: ReemplazoDocenteController.normalizeFecha(req.body.fechaInicio),
                fechaFin: ReemplazoDocenteController.normalizeFecha(req.body.fechaFin),
                cicloLectivo: ReemplazoDocenteController.normalizeFecha(req.body.cicloLectivo),
                motivo: req.body.motivo ? ReemplazoDocenteController.normalizarMotivo(req.body.motivo) : undefined
            };

            const result = validatePartialReemplazoDocente(normalizedData)

            if (!result.success) {
                return res.status(400).json({
                    message: 'Datos de entrada inválidos',
                    errors: result.error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message
                    }))
                })
            }

            const reemplazo = await ReemplazoDocenteModel.update({ id, input: result.data })

            if (!reemplazo) {
                return res.status(404).json({
                    message: 'Reemplazo no encontrado'
                })
            }

            res.json(reemplazo)
        } catch (error) {
            console.error('Error al actualizar reemplazo:', error)

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
            const { id } = req.params
            const deleted = await ReemplazoDocenteModel.delete({ id })

            if (!deleted) {
                return res.status(404).json({
                    message: 'Reemplazo no encontrado'
                })
            }

            res.json({
                message: 'Reemplazo eliminado correctamente'
            })
        } catch (error) {
            console.error('Error al eliminar reemplazo:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getDocentesSupletesDisponibles(req, res) {
        try {
            const suplentes = await ReemplazoDocenteModel.getDocentesSupletesDisponibles()
            res.json(suplentes)
        } catch (error) {
            console.error('Error al obtener docentes suplentes disponibles:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async getDocentesTitulares(req, res) {
        try {
            const { cicloLectivo } = req.query
            const titulares = await ReemplazoDocenteModel.getDocentesTitulares({
                cicloLectivo: cicloLectivo || new Date().getFullYear()
            })
            res.json(titulares)
        } catch (error) {
            console.error('Error al obtener docentes titulares:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    static async finalizarReemplazo(req, res) {
        try {
            const { id } = req.params
            const { fechaFin } = req.body

            const reemplazo = await ReemplazoDocenteModel.finalizarReemplazo({
                id,
                fechaFin: fechaFin || new Date().toISOString().split('T')[0]
            })

            if (!reemplazo) {
                return res.status(404).json({
                    message: 'Reemplazo no encontrado'
                })
            }

            res.json({
                message: 'Reemplazo finalizado correctamente',
                reemplazo
            })
        } catch (error) {
            console.error('Error al finalizar reemplazo:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }

    // Endpoint para obtener los motivos y estados disponibles
    static async getOptions(req, res) {
        try {
            res.json({
                motivos: Object.values(motivosDisplay),
                estados: estadosReemplazo
            })
        } catch (error) {
            console.error('Error al obtener opciones:', error)
            res.status(500).json({
                message: 'Error interno del servidor',
                error: error.message
            })
        }
    }
}