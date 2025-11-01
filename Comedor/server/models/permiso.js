import { connection } from './db.js'

export class PermisoModel {
    static async getAll() {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 ORDER BY modulo, descripcion;`
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener permisos:', error)
            throw new Error('Error al obtener permisos')
        }
    }

    static async getById({ id }) {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 WHERE id_permiso = ?;`,
                [id]
            )
            if (permisos.length === 0) return null
            return permisos[0]
        } catch (error) {
            console.error('Error al obtener permiso:', error)
            throw new Error('Error al obtener permiso')
        }
    }

    static async create({ input }) {
        const {
            descripcion,
            descripcionPermiso,
            modulo,
            accion = '---',
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Permisos (
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    estado
                ) VALUES (?, ?, ?, ?, ?);`,
                [descripcion, descripcionPermiso, modulo, accion, estado]
            )

            const newId = result.insertId
            return this.getById({ id: newId })
        } catch (error) {
            console.error('Error al crear el permiso:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un permiso con esta descripción')
            }
            throw new Error('Error al crear el permiso')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Permisos WHERE id_permiso = ?;`,
                [id]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar permiso:', error)
            return false
        }
    }

    static async update({ id, input }) {
        const {
            descripcion,
            descripcionPermiso,
            modulo,
            accion,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (descripcion !== undefined) {
                updates.push('descripcion = ?')
                values.push(descripcion)
            }
            if (descripcionPermiso !== undefined) {
                updates.push('descripcionPermiso = ?')
                values.push(descripcionPermiso)
            }
            if (modulo !== undefined) {
                updates.push('modulo = ?')
                values.push(modulo)
            }
            if (accion !== undefined) {
                updates.push('accion = ?')
                values.push(accion)
            }
            if (estado !== undefined) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fechaModificacion = NOW()')
            values.push(id)

            await connection.query(
                `UPDATE Permisos
                 SET ${updates.join(', ')}
                 WHERE id_permiso = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar el permiso:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un permiso con esta descripción')
            }
            throw new Error('Error al actualizar el permiso')
        }
    }

    // Método para obtener permisos por módulo
    static async getByModulo({ modulo }) {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 WHERE modulo = ? AND estado = 'Activo'
                 ORDER BY descripcion;`,
                [modulo]
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener permisos por módulo:', error)
            throw new Error('Error al obtener permisos por módulo')
        }
    }

    // Método para obtener permisos por acción
    static async getByAccion({ accion }) {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 WHERE accion = ? AND estado = 'Activo'
                 ORDER BY modulo, descripcion;`,
                [accion]
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener permisos por acción:', error)
            throw new Error('Error al obtener permisos por acción')
        }
    }

    // Método para obtener solo permisos activos
    static async getActivos() {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 WHERE estado = 'Activo'
                 ORDER BY modulo, descripcion;`
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener permisos activos:', error)
            throw new Error('Error al obtener permisos activos')
        }
    }

    // Método para activar/desactivar un permiso
    static async cambiarEstado({ id, estado }) {
        try {
            await connection.query(
                `UPDATE Permisos
                 SET estado = ?, fechaModificacion = NOW()
                 WHERE id_permiso = ?;`,
                [estado, id]
            )
            return this.getById({ id })
        } catch (error) {
            console.error('Error al cambiar estado del permiso:', error)
            throw new Error('Error al cambiar estado del permiso')
        }
    }

    // Método para obtener estructura de permisos agrupada por módulo
    static async getEstructuraPermisos() {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    modulo,
                    COUNT(*) as totalPermisos,
                    COUNT(CASE WHEN estado = 'Activo' THEN 1 END) as permisosActivos,
                    GROUP_CONCAT(DISTINCT accion ORDER BY accion) as acciones
                 FROM Permisos
                 GROUP BY modulo
                 ORDER BY modulo;`
            )
            return permisos
        } catch (error) {
            console.error('Error al obtener estructura de permisos:', error)
            throw new Error('Error al obtener estructura de permisos')
        }
    }

    // Método para obtener permisos completos organizados por módulo
    static async getPermisosAgrupados() {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 WHERE estado = 'Activo'
                 ORDER BY modulo, accion, descripcion;`
            )

            // Agrupar por módulo
            const permisosAgrupados = {}
            permisos.forEach(permiso => {
                if (!permisosAgrupados[permiso.modulo]) {
                    permisosAgrupados[permiso.modulo] = {}
                }
                if (!permisosAgrupados[permiso.modulo][permiso.accion]) {
                    permisosAgrupados[permiso.modulo][permiso.accion] = []
                }
                permisosAgrupados[permiso.modulo][permiso.accion].push(permiso)
            })

            return permisosAgrupados
        } catch (error) {
            console.error('Error al obtener permisos agrupados:', error)
            throw new Error('Error al obtener permisos agrupados')
        }
    }

    // Método para buscar permisos por descripción
    static async buscarPorDescripcion({ descripcion }) {
        try {
            const [permisos] = await connection.query(
                `SELECT 
                    id_permiso,
                    descripcion,
                    descripcionPermiso,
                    modulo,
                    accion,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Permisos
                 WHERE descripcion LIKE ? OR descripcionPermiso LIKE ?
                 ORDER BY modulo, descripcion;`,
                [`%${descripcion}%`, `%${descripcion}%`]
            )
            return permisos
        } catch (error) {
            console.error('Error al buscar permisos por descripción:', error)
            throw new Error('Error al buscar permisos por descripción')
        }
    }
}