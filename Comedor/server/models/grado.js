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
            id_turno,
            idTurno,
            nombreGrado,
            estado = 'Activo'
        } = input

        // Usar id_turno si está presente, sino usar idTurno para compatibilidad
        const turnoId = id_turno || idTurno;

        try {
            console.log('GradoModel: Creando grado con datos:', { turnoId, nombreGrado, estado });
            const [result] = await connection.query(
                `INSERT INTO Grados (id_turno, nombreGrado, estado)
                 VALUES (?, ?, ?);`,
                [turnoId, nombreGrado, estado]
            )

            console.log('GradoModel: Grado insertado con ID:', result.insertId);
            return this.getById({ id: result.insertId })
        } catch (error) {
            console.error('GradoModel: Error al crear grado:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un grado con ese nombre')
            }
            throw new Error('Error al crear el grado: ' + error.message)
        }
    }

    static async delete({ id }) {
        try {
            console.log('GradoModel: Ejecutando DELETE para ID:', id)
            const [result] = await connection.query(
                `DELETE FROM Grados
                 WHERE id_grado = ?;`,
                [id]
            )
            console.log('GradoModel: Resultado de DELETE:', result)
            console.log('GradoModel: Filas afectadas:', result.affectedRows)

            // Verificar si se eliminó alguna fila
            return result.affectedRows > 0
        } catch (error) {
            console.error('GradoModel: Error en DELETE:', error)
            throw error
        }
    }

    static async update({ id, input }) {
        const {
            id_turno,
            idTurno,
            nombreGrado,
            estado
        } = input

        // Usar id_turno si está presente, sino usar idTurno para compatibilidad
        const turnoId = id_turno || idTurno;

        try {
            const updates = []
            const values = []

            if (turnoId) {
                updates.push('id_turno = ?')
                values.push(turnoId)
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