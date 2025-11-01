import { connection } from './db.js'

export class RolModel {
    static async getAll() {
        const [roles] = await connection.query(
            `SELECT 
                id_rol as idRol,
                nombreRol,
                descripcionRol,
                habilitaCuentaUsuario,
                estado
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
                descripcionRol,
                habilitaCuentaUsuario,
                estado
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
            descripcionRol,
            habilitaCuentaUsuario = 'No',
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Roles (nombreRol, descripcionRol, habilitaCuentaUsuario, estado)
                 VALUES (?, ?, ?, ?);`,
                [nombreRol, descripcionRol, habilitaCuentaUsuario, estado]
            )

            return this.getById({ id: result.insertId })
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
            descripcionRol,
            habilitaCuentaUsuario,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (nombreRol) {
                updates.push('nombreRol = ?')
                values.push(nombreRol)
            }
            if (descripcionRol) {
                updates.push('descripcionRol = ?')
                values.push(descripcionRol)
            }
            if (habilitaCuentaUsuario) {
                updates.push('habilitaCuentaUsuario = ?')
                values.push(habilitaCuentaUsuario)
            }
            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Roles
                 SET ${updates.join(', ')}
                 WHERE id_rol = ?;`,
                values
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