import { connection } from './db.js'

export class GradoModel {
    static async getAll() {
        const [grados] = await connection.query(
            `SELECT 
                g.id_grado as idGrado,
                g.id_turno as idTurno,
                g.nombreGrado,
                g.estado,
                t.nombre as turno,
                t.horaInicio,
                t.horaFin
             FROM Grados g
             JOIN Turnos t ON g.id_turno = t.id_turno
             ORDER BY g.nombreGrado, t.nombre;`
        )
        return grados
    }

    static async getById({ id }) {
        const [grados] = await connection.query(
            `SELECT 
                g.id_grado as idGrado,
                g.id_turno as idTurno,
                g.nombreGrado,
                g.estado,
                t.nombre as turno,
                t.horaInicio,
                t.horaFin
             FROM Grados g
             JOIN Turnos t ON g.id_turno = t.id_turno
             WHERE g.id_grado = ?;`,
            [id]
        )
        if (grados.length === 0) return null
        return grados[0]
    }

    static async create({ input }) {
        const {
            idTurno,
            nombreGrado,
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Grados (id_turno, nombreGrado, estado)
                 VALUES (?, ?, ?);`,
                [idTurno, nombreGrado, estado]
            )

            return this.getById({ id: result.insertId })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un grado con ese nombre')
            }
            throw new Error('Error al crear el grado')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Grados
                 WHERE id_grado = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            idTurno,
            nombreGrado,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (idTurno) {
                updates.push('id_turno = ?')
                values.push(idTurno)
            }
            if (nombreGrado) {
                updates.push('nombreGrado = ?')
                values.push(nombreGrado)
            }
            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Grados
                 SET ${updates.join(', ')}
                 WHERE id_grado = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un grado con ese nombre')
            }
            throw new Error('Error al actualizar el grado')
        }
    }

    static async getByTurno({ idTurno }) {
        const [grados] = await connection.query(
            `SELECT 
                g.id_grado as idGrado,
                g.nombreGrado,
                g.estado
             FROM Grados g
             WHERE g.id_turno = ? AND g.estado = 'Activo'
             ORDER BY g.nombreGrado;`,
            [idTurno]
        )
        return grados
    }
}