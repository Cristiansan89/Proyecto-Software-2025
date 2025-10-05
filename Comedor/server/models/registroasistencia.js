import { connection } from './db.js'

export class RegistroAsistenciaModel {
    static async getAll() {
        const [asistencias] = await connection.query(
            `SELECT 
                a.id_asistencia as idAsistencia,
                a.id_grado as idGrado,
                g.nombreGrado,
                a.fecha,
                a.tipoServicio,
                a.cantidadPresentes
             FROM Asistencias a
             JOIN Grados g ON a.id_grado = g.id_grado
             ORDER BY a.fecha DESC;`
        )
        return asistencias
    }

    static async getById({ id }) {
        const [asistencias] = await connection.query(
            `SELECT 
                a.id_asistencia as idAsistencia,
                a.id_grado as idGrado,
                g.nombreGrado,
                a.fecha,
                a.tipoServicio,
                a.cantidadPresentes
             FROM Asistencias a
             JOIN Grados g ON a.id_grado = g.id_grado
             WHERE a.id_asistencia = ?;`,
            [id]
        )
        if (asistencias.length === 0) return null
        return asistencias[0]
    }

    static async create({ input }) {
        const {
            idGrado,
            fecha,
            tipoServicio,
            cantidadPresentes
        } = input

        try {
            await connection.query(
                `INSERT INTO Asistencias (
                    id_asistencia, 
                    id_grado, 
                    fecha, 
                    tipoServicio, 
                    cantidadPresentes
                ) VALUES (UUID(), ?, ?, ?, ?);`,
                [idGrado, fecha, tipoServicio, cantidadPresentes]
            )

            const [newAsistencia] = await connection.query(
                `SELECT id_asistencia as idAsistencia 
                 FROM Asistencias 
                 WHERE id_grado = ? AND fecha = ? AND tipoServicio = ?
                 ORDER BY id_asistencia DESC LIMIT 1;`,
                [idGrado, fecha, tipoServicio]
            )

            return this.getById({ id: newAsistencia[0].idAsistencia })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un registro para este grado, fecha y tipo de servicio')
            }
            throw new Error('Error al crear el registro de asistencia')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Asistencias
                 WHERE id_asistencia = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadPresentes
        } = input

        try {
            await connection.query(
                `UPDATE Asistencias
                 SET cantidadPresentes = ?
                 WHERE id_asistencia = ?;`,
                [cantidadPresentes, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el registro de asistencia')
        }
    }
}