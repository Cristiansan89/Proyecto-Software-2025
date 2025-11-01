import { connection } from './db.js'

export class RegistroAsistenciaModel {
    static async getAll() {
        try {
            const [asistencias] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    BIN_TO_UUID(a.id_grado) as id_grado,
                    BIN_TO_UUID(a.id_servicio) as id_servicio,
                    g.nombreGrado,
                    s.nombreServicio,
                    a.fecha,
                    a.cantidadPresentes,
                    a.fecha_creacion,
                    a.fecha_actualizacion
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 ORDER BY a.fecha DESC, g.nombreGrado;`
            )
            return asistencias
        } catch (error) {
            console.error('Error al obtener registros de asistencia:', error)
            return []
        }
    }

    static async getById({ id }) {
        try {
            const [asistencias] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    BIN_TO_UUID(a.id_grado) as id_grado,
                    BIN_TO_UUID(a.id_servicio) as id_servicio,
                    g.nombreGrado,
                    s.nombreServicio,
                    a.fecha,
                    a.cantidadPresentes,
                    a.fecha_creacion,
                    a.fecha_actualizacion
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.id_asistencia = UUID_TO_BIN(?);`,
                [id]
            )
            if (asistencias.length === 0) return null
            return asistencias[0]
        } catch (error) {
            console.error('Error al obtener registro de asistencia:', error)
            throw new Error('Error al obtener registro de asistencia')
        }
    }

    static async create({ input }) {
        const {
            id_grado,
            id_servicio,
            fecha,
            cantidadPresentes
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO RegistrosAsistencias (
                    id_grado, 
                    id_servicio,
                    fecha, 
                    cantidadPresentes
                ) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?);`,
                [id_grado, id_servicio, fecha, cantidadPresentes]
            )

            const [newAsistencia] = await connection.query(
                `SELECT BIN_TO_UUID(id_asistencia) as id_asistencia 
                 FROM RegistrosAsistencias 
                 WHERE id_grado = UUID_TO_BIN(?) AND id_servicio = UUID_TO_BIN(?) AND fecha = ?
                 ORDER BY fecha_creacion DESC LIMIT 1;`,
                [id_grado, id_servicio, fecha]
            )

            return this.getById({ id: newAsistencia[0].id_asistencia })
        } catch (error) {
            console.error('Error al crear el registro de asistencia:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un registro para este grado, fecha y servicio')
            }
            throw new Error('Error al crear el registro de asistencia')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM RegistrosAsistencias
                 WHERE id_asistencia = UUID_TO_BIN(?);`,
                [id]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar registro de asistencia:', error)
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadPresentes,
            fecha
        } = input

        try {
            await connection.query(
                `UPDATE RegistrosAsistencias
                 SET cantidadPresentes = ?, fecha = ?
                 WHERE id_asistencia = UUID_TO_BIN(?);`,
                [cantidadPresentes, fecha, id]
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar el registro de asistencia:', error)
            throw new Error('Error al actualizar el registro de asistencia')
        }
    }

    // Métodos específicos para gestión de asistencias
    static async getAsistenciasByFecha({ fecha }) {
        try {
            const [rows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    BIN_TO_UUID(a.id_grado) as id_grado,
                    BIN_TO_UUID(a.id_servicio) as id_servicio,
                    g.nombreGrado,
                    s.nombreServicio,
                    a.cantidadPresentes,
                    a.fecha
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.fecha = ?
                 ORDER BY g.nombreGrado, s.nombreServicio;`,
                [fecha]
            )
            return rows
        } catch (error) {
            console.error('Error al obtener asistencias por fecha:', error)
            return []
        }
    }

    static async getAsistenciasByGradoAndPeriodo({ id_grado, fechaInicio, fechaFin }) {
        try {
            const [rows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(a.id_asistencia) as id_asistencia,
                    BIN_TO_UUID(a.id_grado) as id_grado,
                    BIN_TO_UUID(a.id_servicio) as id_servicio,
                    g.nombreGrado,
                    s.nombreServicio,
                    a.cantidadPresentes,
                    a.fecha
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.id_grado = UUID_TO_BIN(?)
                   AND a.fecha BETWEEN ? AND ?
                 ORDER BY a.fecha DESC, s.nombreServicio;`,
                [id_grado, fechaInicio, fechaFin]
            )
            return rows
        } catch (error) {
            console.error('Error al obtener asistencias por grado y período:', error)
            return []
        }
    }

    static async getEstadisticasAsistencia({ fechaInicio, fechaFin }) {
        try {
            const [rows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(g.id_grado) as id_grado,
                    g.nombreGrado,
                    s.nombreServicio,
                    COUNT(a.id_asistencia) as totalRegistros,
                    AVG(a.cantidadPresentes) as promedioAsistencia,
                    MAX(a.cantidadPresentes) as maxAsistencia,
                    MIN(a.cantidadPresentes) as minAsistencia,
                    SUM(a.cantidadPresentes) as totalAsistencia
                 FROM RegistrosAsistencias a
                 INNER JOIN Grados g ON a.id_grado = g.id_grado
                 INNER JOIN Servicios s ON a.id_servicio = s.id_servicio
                 WHERE a.fecha BETWEEN ? AND ?
                 GROUP BY g.id_grado, a.id_servicio
                 ORDER BY g.nombreGrado, s.nombreServicio;`,
                [fechaInicio, fechaFin]
            )
            return rows
        } catch (error) {
            console.error('Error al obtener estadísticas de asistencia:', error)
            return []
        }
    }
}