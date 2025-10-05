import { connection } from './db.js'

export class RolModel {
    static async getAll() {
        const [roles] = await connection.query(
            `SELECT 
                id_rol as idRol,
                nombreRol,
                descripcion
             FROM Roles
             ORDER BY nombreRol;`
        )
        return roles
    }

    static async getById({ id }) {
        const [roles] = await connection.query(
            `SELECT 
                id_rol as idRol,
                nombreRol,
                descripcion
             FROM Roles
             WHERE id_rol = ?;`,
            [id]
        )
        if (roles.length === 0) return null
        return roles[0]
    }

    static async create({ input }) {
        const {
            nombreRol,
            descripcion
        } = input

        try {
            await connection.query(
                `INSERT INTO Roles (id_rol, nombreRol, descripcion)
                 VALUES (UUID(), ?, ?);`,
                [nombreRol, descripcion]
            )

            const [newRol] = await connection.query(
                `SELECT id_rol as idRol 
                 FROM Roles 
                 WHERE nombreRol = ?
                 ORDER BY id_rol DESC LIMIT 1;`,
                [nombreRol]
            )

            return this.getById({ id: newRol[0].idRol })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un rol con este nombre')
            }
            throw new Error('Error al crear el rol')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Roles
                 WHERE id_rol = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            nombreRol,
            descripcion
        } = input

        try {
            await connection.query(
                `UPDATE Roles
                 SET nombreRol = ?, descripcion = ?
                 WHERE id_rol = ?;`,
                [nombreRol, descripcion, id]
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un rol con este nombre')
            }
            throw new Error('Error al actualizar el rol')
        }
    }
}