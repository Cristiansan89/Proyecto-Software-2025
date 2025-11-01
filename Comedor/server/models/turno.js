import { connection } from './db.js'

export class TurnoModel {
    static async getAll() {
        const [turnos] = await connection.query(
            `SELECT 
                id_turno as idTurno,
                nombre,
                horaInicio,
                horaFin,
                fechaAlta,
                fechaModificacion,
                estado
             FROM Turnos
             ORDER BY horaInicio;`
        )
        return turnos
    }

    static async getById({ id }) {
        const [turnos] = await connection.query(
            `SELECT 
                id_turno as idTurno,
                nombre,
                horaInicio,
                horaFin,
                fechaAlta,
                fechaModificacion,
                estado
             FROM Turnos
             WHERE id_turno = ?;`,
            [id]
        )
        if (turnos.length === 0) return null
        return turnos[0]
    }

    static async create({ input }) {
        const {
            nombre,
            horaInicio,
            horaFin,
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Turnos (nombre, horaInicio, horaFin, estado)
                 VALUES (?, ?, ?, ?);`,
                [nombre, horaInicio, horaFin, estado]
            )

            return this.getById({ id: result.insertId })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un turno con ese nombre')
            }
            throw new Error('Error al crear el turno')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Turnos
                 WHERE id_turno = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            nombre,
            horaInicio,
            horaFin,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (nombre) {
                updates.push('nombre = ?')
                values.push(nombre)
            }
            if (horaInicio) {
                updates.push('horaInicio = ?')
                values.push(horaInicio)
            }
            if (horaFin) {
                updates.push('horaFin = ?')
                values.push(horaFin)
            }
            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fechaModificacion = NOW()')
            values.push(id)

            await connection.query(
                `UPDATE Turnos
                 SET ${updates.join(', ')}
                 WHERE id_turno = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un turno con ese nombre')
            }
            throw new Error('Error al actualizar el turno')
        }
    }

    static async getActivos() {
        const [turnos] = await connection.query(
            `SELECT 
                id_turno as idTurno,
                nombre,
                horaInicio,
                horaFin
             FROM Turnos
             WHERE estado = 'Activo'
             ORDER BY horaInicio;`
        )
        return turnos
    }
}