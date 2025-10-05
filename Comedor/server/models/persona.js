import { connection } from './db.js'

export class PersonaModel {
    static async getAll({ idGrado }) {
        if (idGrado) {
            const [personas] = await connection.query(
                `SELECT 
                    p.id_persona as idPersona, 
                    p.id_usuario as idUsuario,
                    p.nombre, 
                    p.apellido, 
                    p.id_grado as idGrado, 
                    p.tipoPersona, 
                    p.estado
                FROM Personas p
                JOIN Grados g ON p.id_grado = g.id_grado
                WHERE g.id_grado = ?;`,
                [idGrado]
            )
            return personas
        }

        const [personas] = await connection.query(
            `SELECT 
                id_persona as idPersona,
                id_usuario as idUsuario,
                nombre, 
                apellido, 
                id_grado as idGrado,
                tipoPersona, 
                estado
            FROM Personas;`
        )
        return personas
    }

    static async getById({ id }) {
        const [personas] = await connection.query(
            `SELECT 
                id_persona as idPersona,
                id_usuario as idUsuario,
                nombre, 
                apellido, 
                id_grado as idGrado,
                tipoPersona, 
                estado
            FROM Personas
            WHERE id_persona = ?;`,
            [id]
        )
        if (personas.length === 0) return null
        return personas[0]
    }

    static async create({ input }) {
        const {
            idUsuario,
            nombre,
            apellido,
            idGrado,
            tipoPersona,
            estado = 'Activo'
        } = input

        try {
            await connection.query(
                `INSERT INTO Personas (
                    id_persona, 
                    id_usuario, 
                    nombre, 
                    apellido, 
                    id_grado, 
                    tipoPersona, 
                    estado
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?);`,
                [idUsuario, nombre, apellido, idGrado, tipoPersona, estado]
            )

            const [newPersona] = await connection.query(
                `SELECT id_persona as idPersona 
                 FROM Personas 
                 WHERE nombre = ? AND apellido = ? 
                 ORDER BY id_persona DESC LIMIT 1;`,
                [nombre, apellido]
            )

            return this.getById({ id: newPersona[0].idPersona })
        } catch (error) {
            throw new Error('Error al crear la persona')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Personas
                 WHERE id_persona = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            idUsuario,
            nombre,
            apellido,
            idGrado,
            tipoPersona,
            estado
        } = input

        try {
            await connection.query(
                `UPDATE Personas
                 SET id_usuario = ?,
                 nombre = ?, 
                 apellido = ?, 
                 id_grado = ?,
                 tipoPersona = ?, 
                 estado = ?
                 WHERE id_persona = ?;`,
                [idUsuario, nombre, apellido, idGrado, tipoPersona, estado, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar la persona')
        }
    }
}
