import { connection } from './db.js'

export class RolPermisoModel {
    static async getAll() {
        try {
            const [rolesPermisos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(rp.id_rol) as id_rol,
                    r.nombreRol,
                    BIN_TO_UUID(rp.id_permiso) as id_permiso,
                    p.nombrePermiso,
                    rp.fecha_creacion
                 FROM RolesPermisos rp
                 INNER JOIN Roles r ON rp.id_rol = r.id_rol
                 INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                 ORDER BY r.nombreRol, p.nombrePermiso;`
            )
            return rolesPermisos
        } catch (error) {
            console.error('Error al obtener roles-permisos:', error)
            return []
        }
    }

    static async getById({ id_rol, id_permiso }) {
        try {
            const [rolesPermisos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(rp.id_rol) as id_rol,
                    r.nombreRol,
                    BIN_TO_UUID(rp.id_permiso) as id_permiso,
                    p.nombrePermiso,
                    rp.fecha_creacion
                 FROM RolesPermisos rp
                 INNER JOIN Roles r ON rp.id_rol = r.id_rol
                 INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                 WHERE rp.id_rol = UUID_TO_BIN(?) AND rp.id_permiso = UUID_TO_BIN(?);`,
                [id_rol, id_permiso]
            )
            if (rolesPermisos.length === 0) return null
            return rolesPermisos[0]
        } catch (error) {
            console.error('Error al obtener rol-permiso:', error)
            throw new Error('Error al obtener rol-permiso')
        }
    }

    static async create({ input }) {
        const {
            id_rol,
            id_permiso
        } = input

        try {
            await connection.query(
                `INSERT INTO RolesPermisos (id_rol, id_permiso)
                 VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?));`,
                [id_rol, id_permiso]
            )

            return this.getById({ id_rol, id_permiso })
        } catch (error) {
            console.error('Error al crear la relación rol-permiso:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Esta relación rol-permiso ya existe')
            }
            throw new Error('Error al crear la relación rol-permiso')
        }
    }

    static async delete({ id_rol, id_permiso }) {
        try {
            await connection.query(
                `DELETE FROM RolesPermisos
                 WHERE id_rol = UUID_TO_BIN(?) AND id_permiso = UUID_TO_BIN(?);`,
                [id_rol, id_permiso]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar relación rol-permiso:', error)
            return false
        }
    }

    static async getByRol({ id_rol }) {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(p.id_permiso) as id_permiso,
                    p.nombrePermiso,
                    p.descripcion
                 FROM RolesPermisos rp
                 INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                 WHERE rp.id_rol = UUID_TO_BIN(?)
                 ORDER BY p.nombrePermiso;`,
                [id_rol]
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener permisos por rol:', error)
            return []
        }
    }

    static async asignarPermisos({ id_rol, permisos }) {
        const conn = await connection.getConnection()

        try {
            await conn.beginTransaction()

            // Eliminar permisos existentes
            await conn.query(
                `DELETE FROM RolesPermisos WHERE id_rol = UUID_TO_BIN(?);`,
                [id_rol]
            )

            // Insertar nuevos permisos
            if (permisos && permisos.length > 0) {
                for (const id_permiso of permisos) {
                    await conn.query(
                        `INSERT INTO RolesPermisos (id_rol, id_permiso)
                         VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?));`,
                        [id_rol, id_permiso]
                    )
                }
            }

            await conn.commit()
            return this.getByRol({ id_rol })
        } catch (error) {
            await conn.rollback()
            console.error('Error al asignar permisos al rol:', error)
            throw new Error('Error al asignar permisos al rol')
        } finally {
            conn.release()
        }
    }

    // Métodos adicionales para gestión de permisos
    static async getPermisosByUsuario({ id_usuario }) {
        try {
            const [permisos] = await connection.query(
                `SELECT DISTINCT
                    BIN_TO_UUID(p.id_permiso) as id_permiso,
                    p.nombrePermiso,
                    p.descripcion
                 FROM Usuarios u
                 INNER JOIN Roles r ON u.id_rol = r.id_rol
                 INNER JOIN RolesPermisos rp ON r.id_rol = rp.id_rol
                 INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                 WHERE u.id_usuario = UUID_TO_BIN(?)
                 ORDER BY p.nombrePermiso;`,
                [id_usuario]
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener permisos por usuario:', error)
            return []
        }
    }

    static async hasPermiso({ id_usuario, nombrePermiso }) {
        try {
            const [result] = await connection.query(
                `SELECT COUNT(*) as count
                 FROM Usuarios u
                 INNER JOIN Roles r ON u.id_rol = r.id_rol
                 INNER JOIN RolesPermisos rp ON r.id_rol = rp.id_rol
                 INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                 WHERE u.id_usuario = UUID_TO_BIN(?) AND p.nombrePermiso = ?;`,
                [id_usuario, nombrePermiso]
            )
            return result[0].count > 0
        } catch (error) {
            console.error('Error al verificar permiso:', error)
            return false
        }
    }

    static async getRolesWithPermisos() {
        try {
            const [roles] = await connection.query(
                `SELECT DISTINCT
                    BIN_TO_UUID(r.id_rol) as id_rol,
                    r.nombreRol,
                    r.descripcion
                 FROM Roles r
                 ORDER BY r.nombreRol;`
            )

            for (const rol of roles) {
                rol.permisos = await this.getByRol({ id_rol: rol.id_rol })
            }

            return roles
        } catch (error) {
            console.error('Error al obtener roles con permisos:', error)
            return []
        }
    }
}