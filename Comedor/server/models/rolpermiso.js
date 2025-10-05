import { connection } from './db.js'

export class RolPermisoModel {
    static async getAll() {
        const [rolesPermisos] = await connection.query(
            `SELECT 
                rp.id_rol as idRol,
                r.nombreRol,
                rp.id_permiso as idPermiso,
                p.nombrePermiso
             FROM Roles_Permisos rp
             JOIN Roles r ON rp.id_rol = r.id_rol
             JOIN Permisos p ON rp.id_permiso = p.id_permiso
             ORDER BY r.nombreRol, p.nombrePermiso;`
        )
        return rolesPermisos
    }

    static async getById({ idRol, idPermiso }) {
        const [rolesPermisos] = await connection.query(
            `SELECT 
                rp.id_rol as idRol,
                r.nombreRol,
                rp.id_permiso as idPermiso,
                p.nombrePermiso
             FROM Roles_Permisos rp
             JOIN Roles r ON rp.id_rol = r.id_rol
             JOIN Permisos p ON rp.id_permiso = p.id_permiso
             WHERE rp.id_rol = ? AND rp.id_permiso = ?;`,
            [idRol, idPermiso]
        )
        if (rolesPermisos.length === 0) return null
        return rolesPermisos[0]
    }

    static async create({ input }) {
        const {
            idRol,
            idPermiso
        } = input

        try {
            await connection.query(
                `INSERT INTO Roles_Permisos (id_rol, id_permiso)
                 VALUES (?, ?);`,
                [idRol, idPermiso]
            )

            return this.getById({ idRol, idPermiso })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Esta relación rol-permiso ya existe')
            }
            throw new Error('Error al crear la relación rol-permiso')
        }
    }

    static async delete({ idRol, idPermiso }) {
        try {
            await connection.query(
                `DELETE FROM Roles_Permisos
                 WHERE id_rol = ? AND id_permiso = ?;`,
                [idRol, idPermiso]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async getByRol({ idRol }) {
        const [permisos] = await connection.query(
            `SELECT 
                p.id_permiso as idPermiso,
                p.nombrePermiso
             FROM Roles_Permisos rp
             JOIN Permisos p ON rp.id_permiso = p.id_permiso
             WHERE rp.id_rol = ?
             ORDER BY p.nombrePermiso;`,
            [idRol]
        )
        return permisos
    }

    static async asignarPermisos({ idRol, permisos }) {
        try {
            await connection.query('START TRANSACTION;')

            // Eliminar permisos existentes
            await connection.query(
                `DELETE FROM Roles_Permisos WHERE id_rol = ?;`,
                [idRol]
            )

            // Insertar nuevos permisos
            if (permisos.length > 0) {
                const values = permisos.map(idPermiso =>
                    `('${idRol}', '${idPermiso}')`
                ).join(',')

                await connection.query(
                    `INSERT INTO Roles_Permisos (id_rol, id_permiso)
                     VALUES ${values};`
                )
            }

            await connection.query('COMMIT;')
            return this.getByRol({ idRol })
        } catch (error) {
            await connection.query('ROLLBACK;')
            throw new Error('Error al asignar permisos al rol')
        }
    }
}