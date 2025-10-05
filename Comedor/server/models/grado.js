import { connection } from './db.js'

export class GradoModel {
    static async getAll() {
        const [grados] = await connection.query(
            `SELECT 
                id_grado as idGrado,
                nombreGrado,
                turno,
                cantidadAlumnos
             FROM Grados
             ORDER BY nombreGrado, turno;`
        )
        return grados
    }

    static async getById({ id }) {
        const [grados] = await connection.query(
            `SELECT 
                id_grado as idGrado,
                nombreGrado,
                turno,
                cantidadAlumnos
             FROM Grados
             WHERE id_grado = ?;`,
            [id]
        )
        if (grados.length === 0) return null
        return grados[0]
    }

    static async create({ input }) {
        const {
            nombreGrado,
            turno,
            cantidadAlumnos
        } = input

        try {
            await connection.query(
                `INSERT INTO Grados (id_grado, nombreGrado, turno, cantidadAlumnos)
                 VALUES (UUID(), ?, ?, ?);`,
                [nombreGrado, turno, cantidadAlumnos]
            )

            const [newGrado] = await connection.query(
                `SELECT id_grado as idGrado 
                 FROM Grados 
                 WHERE nombreGrado = ? AND turno = ? 
                 ORDER BY id_grado DESC LIMIT 1;`,
                [nombreGrado, turno]
            )

            return this.getById({ id: newGrado[0].idGrado })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un grado con ese nombre y turno')
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
            nombreGrado,
            turno,
            cantidadAlumnos
        } = input

        try {
            await connection.query(
                `UPDATE Grados
                 SET nombreGrado = ?,
                     turno = ?,
                     cantidadAlumnos = ?
                 WHERE id_grado = ?;`,
                [nombreGrado, turno, cantidadAlumnos, id]
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un grado con ese nombre y turno')
            }
            throw new Error('Error al actualizar el grado')
        }
    }
}