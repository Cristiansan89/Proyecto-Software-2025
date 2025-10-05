import { connection } from './db.js'

export class PermisoModel {
    static async getAll() {
        const [permisos] = await connection.query(
            `SELECT 
                id_permiso as idPermiso,
                nombrePermiso
             FROM Permisos
             ORDER BY nombrePermiso;`
        )
        return permisos
    }

    static async getById({ id }) {
        const [permisos] = await connection.query(
            `SELECT 
                id_permiso as idPermiso,
                nombrePermiso
             FROM Permisos
             WHERE id_permiso = ?;`,
            [id]
        )
        if (permisos.length === 0) return null
        return permisos[0]
    }

    static async create({ input }) {
        const {
            nombrePermiso
        } = input

        try {
            await connection.query(
                `INSERT INTO Permisos (id_permiso, nombrePermiso)
                 VALUES (UUID(), ?);`,
                [nombrePermiso]
            )

            const [newPermiso] = await connection.query(
                `SELECT id_permiso as idPermiso 
                 FROM Permisos 
                 WHERE nombrePermiso = ?
                 ORDER BY id_permiso DESC LIMIT 1;`,
                [nombrePermiso]
            )

            return this.getById({ id: newPermiso[0].idPermiso })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un permiso con este nombre')
            }
            throw new Error('Error al crear el permiso')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Permisos
                 WHERE id_permiso = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            nombrePermiso
        } = input

        try {
            await connection.query(
                `UPDATE Permisos
                 SET nombrePermiso = ?
                 WHERE id_permiso = ?;`,
                [nombrePermiso, id]
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un permiso con este nombre')
            }
            throw new Error('Error al actualizar el permiso')
        }
    }
}