import { validateAsistencia, validatePartialAsistencia } from '../schemas/asistencias.js'
import { connection } from '../models/db.js'

export class AsistenciaController {
    constructor({ asistenciaModel }) {
        this.asistenciaModel = asistenciaModel
    }

    getAll = async (req, res) => {
        try {
            const asistencias = await this.asistenciaModel.getAll()
            res.json(asistencias)
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    getById = async (req, res) => {
        try {
            const { id } = req.params
            const asistencia = await this.asistenciaModel.getById({ id })

            if (!asistencia) {
                return res.status(404).json({ message: 'Asistencia no encontrada' })
            }

            res.json(asistencia)
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    getByToken = async (req, res) => {
        try {
            const { token } = req.params

            // Validar token
            const tokenData = await this.asistenciaModel.validateToken(token)

            // Obtener alumnos del grado del docente
            const alumnos = await this.asistenciaModel.getAlumnosByDocenteGrado({
                idPersonaDocente: tokenData.idPersonaDocente,
                nombreGrado: tokenData.nombreGrado,
                fecha: tokenData.fecha,
                idServicio: tokenData.idServicio
            })

            // Obtener información del servicio
            const [servicios] = await connection.query(
                'SELECT nombre, descripcion FROM Servicios WHERE id_servicio = ?',
                [tokenData.idServicio]
            )

            const servicio = servicios?.[0] || { nombre: 'Servicio', descripcion: '' }

            res.json({
                tokenData,
                alumnos,
                servicio
            })
        } catch (error) {
            console.error(error)
            if (error.message === 'Token expirado' || error.message === 'Token inválido') {
                return res.status(401).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    registrarAsistencias = async (req, res) => {
        try {
            const { token } = req.params
            const { asistencias } = req.body

            // Validar token
            const tokenData = await this.asistenciaModel.validateToken(token)

            if (!asistencias || !Array.isArray(asistencias)) {
                return res.status(400).json({ message: 'Datos de asistencias inválidos' })
            }

            const resultados = []

            // Procesar cada asistencia
            for (const asistencia of asistencias) {
                const { idAlumnoGrado, estado } = asistencia

                if (!['Si', 'No', 'Ausente'].includes(estado)) {
                    return res.status(400).json({
                        message: `Estado inválido: ${estado}. Debe ser 'Si', 'No' o 'Ausente'`
                    })
                }

                const resultado = await this.asistenciaModel.upsertAsistencia({
                    idServicio: tokenData.idServicio,
                    idAlumnoGrado,
                    fecha: tokenData.fecha,
                    estado
                })

                resultados.push(resultado)
            }

            res.json({
                message: 'Asistencias registradas correctamente',
                registradas: resultados.length,
                asistencias: resultados
            })
        } catch (error) {
            console.error(error)
            if (error.message === 'Token expirado' || error.message === 'Token inválido') {
                return res.status(401).json({ message: error.message })
            }
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    generateTokenForDocente = async (req, res) => {
        try {
            const { idPersonaDocente, nombreGrado, fecha, idServicio } = req.body

            if (!idPersonaDocente || !nombreGrado || !fecha || !idServicio) {
                return res.status(400).json({
                    message: 'Faltan datos requeridos: idPersonaDocente, nombreGrado, fecha, idServicio'
                })
            }

            const token = await this.asistenciaModel.generateTokenForDocente({
                idPersonaDocente,
                nombreGrado,
                fecha,
                idServicio
            })

            const link = `${req.protocol}://${req.get('host')}/asistencias/registro/${token}`

            res.json({
                message: 'Token generado correctamente',
                token,
                link
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    create = async (req, res) => {
        try {
            const result = validateAsistencia(req.body)

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) })
            }

            const nuevaAsistencia = await this.asistenciaModel.create({ input: result.data })
            res.status(201).json(nuevaAsistencia)
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    update = async (req, res) => {
        try {
            const result = validatePartialAsistencia(req.body)

            if (!result.success) {
                return res.status(400).json({ error: JSON.parse(result.error.message) })
            }

            const { id } = req.params
            const asistenciaActualizada = await this.asistenciaModel.update({ id, input: result.data })

            if (!asistenciaActualizada) {
                return res.status(404).json({ message: 'Asistencia no encontrada' })
            }

            res.json(asistenciaActualizada)
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }

    delete = async (req, res) => {
        try {
            const { id } = req.params
            const resultado = await this.asistenciaModel.delete({ id })

            if (!resultado) {
                return res.status(404).json({ message: 'Asistencia no encontrada' })
            }

            res.json({ message: 'Asistencia eliminada correctamente' })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Error interno del servidor' })
        }
    }
}