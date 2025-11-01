import { connection } from './db.js'

export class ProveedorInsumoModel {
    static async getAll() {
        try {
            const [relaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pi.id_insumo,
                    pi.calificacion,
                    pi.estado,
                    pr.razonSocial as nombreProveedor,
                    i.nombre as nombreInsumo,
                    i.unidadMedida
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 JOIN Insumos i ON pi.id_insumo = i.id_insumo
                 ORDER BY pr.razonSocial, i.nombre;`
            )
            return relaciones
        } catch (error) {
            console.error('Error al obtener relaciones proveedor-insumo:', error)
            throw new Error('Error al obtener relaciones proveedor-insumo')
        }
    }

    static async getById({ id_proveedor, id_insumo }) {
        try {
            const [relaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pi.id_insumo,
                    pi.calificacion,
                    pi.estado,
                    pr.razonSocial as nombreProveedor,
                    i.nombre as nombreInsumo,
                    i.unidadMedida
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 JOIN Insumos i ON pi.id_insumo = i.id_insumo
                 WHERE pi.id_proveedor = UUID_TO_BIN(?) AND pi.id_insumo = ?;`,
                [id_proveedor, id_insumo]
            )
            if (relaciones.length === 0) return null
            return relaciones[0]
        } catch (error) {
            console.error('Error al obtener relación proveedor-insumo:', error)
            throw new Error('Error al obtener relación proveedor-insumo')
        }
    }

    static async create({ input }) {
        const {
            id_proveedor,
            id_insumo,
            calificacion = 'Bueno',
            estado = 'Activo'
        } = input

        try {
            await connection.query(
                `INSERT INTO ProveedorInsumo (
                    id_proveedor, 
                    id_insumo, 
                    calificacion,
                    estado
                ) VALUES (UUID_TO_BIN(?), ?, ?, ?);`,
                [id_proveedor, id_insumo, calificacion, estado]
            )

            return this.getById({ id_proveedor, id_insumo })
        } catch (error) {
            console.error('Error al crear la relación proveedor-insumo:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Esta relación proveedor-insumo ya existe')
            }
            throw new Error('Error al crear la relación proveedor-insumo')
        }
    }

    static async delete({ id_proveedor, id_insumo }) {
        try {
            await connection.query(
                `DELETE FROM ProveedorInsumo
                 WHERE id_proveedor = UUID_TO_BIN(?) AND id_insumo = ?;`,
                [id_proveedor, id_insumo]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar relación proveedor-insumo:', error)
            return false
        }
    }

    static async update({ id_proveedor, id_insumo, input }) {
        const {
            calificacion,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (calificacion !== undefined) {
                updates.push('calificacion = ?')
                values.push(calificacion)
            }
            if (estado !== undefined) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id_proveedor, id_insumo })

            values.push(id_proveedor, id_insumo)
            await connection.query(
                `UPDATE ProveedorInsumo
                 SET ${updates.join(', ')}
                 WHERE id_proveedor = UUID_TO_BIN(?) AND id_insumo = ?;`,
                values
            )

            return this.getById({ id_proveedor, id_insumo })
        } catch (error) {
            console.error('Error al actualizar la relación proveedor-insumo:', error)
            throw new Error('Error al actualizar la relación proveedor-insumo')
        }
    }

    static async getByProveedor({ id_proveedor }) {
        try {
            const [insumos] = await connection.query(
                `SELECT 
                    pi.id_insumo,
                    pi.calificacion,
                    pi.estado,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    i.categoria
                 FROM ProveedorInsumo pi
                 JOIN Insumos i ON pi.id_insumo = i.id_insumo
                 WHERE pi.id_proveedor = UUID_TO_BIN(?)
                 ORDER BY i.nombre;`,
                [id_proveedor]
            )
            return insumos
        } catch (error) {
            console.error('Error al obtener insumos por proveedor:', error)
            throw new Error('Error al obtener insumos por proveedor')
        }
    }

    static async getByInsumo({ id_insumo }) {
        try {
            const [proveedores] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pi.calificacion,
                    pi.estado as estadoRelacion,
                    pr.razonSocial,
                    pr.CUIT,
                    pr.telefono,
                    pr.direccion,
                    pr.mail,
                    pr.estado as estadoProveedor
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 WHERE pi.id_insumo = ?
                 ORDER BY 
                    FIELD(pi.calificacion, 'Excelente', 'Bueno', 'Regular', 'Malo'),
                    pr.razonSocial;`,
                [id_insumo]
            )
            return proveedores
        } catch (error) {
            console.error('Error al obtener proveedores por insumo:', error)
            throw new Error('Error al obtener proveedores por insumo')
        }
    }

    static async getBestProviders({ id_insumo }) {
        try {
            const [proveedores] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pi.calificacion,
                    pi.estado as estadoRelacion,
                    pr.razonSocial,
                    pr.CUIT,
                    pr.telefono,
                    pr.mail,
                    pr.estado as estadoProveedor
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 WHERE pi.id_insumo = ? 
                   AND pr.estado = 'activo' 
                   AND pi.estado = 'Activo'
                 ORDER BY 
                    FIELD(pi.calificacion, 'Excelente', 'Bueno', 'Regular', 'Malo'),
                    pr.razonSocial;`,
                [id_insumo]
            )
            return proveedores
        } catch (error) {
            console.error('Error al obtener mejores proveedores:', error)
            throw new Error('Error al obtener mejores proveedores')
        }
    }

    // Método para obtener relaciones activas solamente
    static async getActivos() {
        try {
            const [relaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pi.id_insumo,
                    pi.calificacion,
                    pi.estado,
                    pr.razonSocial as nombreProveedor,
                    i.nombre as nombreInsumo,
                    i.unidadMedida
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 JOIN Insumos i ON pi.id_insumo = i.id_insumo
                 WHERE pi.estado = 'Activo' AND pr.estado = 'activo'
                 ORDER BY pr.razonSocial, i.nombre;`
            )
            return relaciones
        } catch (error) {
            console.error('Error al obtener relaciones activas:', error)
            throw new Error('Error al obtener relaciones activas')
        }
    }

    // Método para cambiar estado de la relación
    static async cambiarEstado({ id_proveedor, id_insumo, estado }) {
        try {
            await connection.query(
                `UPDATE ProveedorInsumo
                 SET estado = ?
                 WHERE id_proveedor = UUID_TO_BIN(?) AND id_insumo = ?;`,
                [estado, id_proveedor, id_insumo]
            )
            return this.getById({ id_proveedor, id_insumo })
        } catch (error) {
            console.error('Error al cambiar estado de la relación:', error)
            throw new Error('Error al cambiar estado de la relación')
        }
    }

    // Método para obtener estadísticas de proveedores por calificación
    static async getEstadisticasCalificacion() {
        try {
            const [estadisticas] = await connection.query(
                `SELECT 
                    pi.calificacion,
                    COUNT(*) as totalRelaciones,
                    COUNT(DISTINCT pi.id_proveedor) as totalProveedores,
                    COUNT(DISTINCT pi.id_insumo) as totalInsumos
                 FROM ProveedorInsumo pi
                 WHERE pi.estado = 'Activo'
                 GROUP BY pi.calificacion
                 ORDER BY FIELD(pi.calificacion, 'Excelente', 'Bueno', 'Regular', 'Malo');`
            )
            return estadisticas
        } catch (error) {
            console.error('Error al obtener estadísticas de calificación:', error)
            throw new Error('Error al obtener estadísticas de calificación')
        }
    }

    // Método para obtener proveedores que pueden suministrar múltiples insumos
    static async getProveedoresMultiples({ insumos }) {
        try {
            const placeholders = insumos.map(() => '?').join(',')
            const [proveedores] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pr.razonSocial,
                    pr.CUIT,
                    pr.telefono,
                    pr.mail,
                    COUNT(pi.id_insumo) as insumosDisponibles,
                    GROUP_CONCAT(i.nombre ORDER BY i.nombre) as listaInsumos,
                    AVG(FIELD(pi.calificacion, 'Malo', 'Regular', 'Bueno', 'Excelente')) as calificacionPromedio
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 JOIN Insumos i ON pi.id_insumo = i.id_insumo
                 WHERE pi.id_insumo IN (${placeholders})
                   AND pi.estado = 'Activo' 
                   AND pr.estado = 'activo'
                 GROUP BY pi.id_proveedor, pr.razonSocial, pr.CUIT, pr.telefono, pr.mail
                 ORDER BY insumosDisponibles DESC, calificacionPromedio DESC;`,
                insumos
            )
            return proveedores
        } catch (error) {
            console.error('Error al obtener proveedores múltiples:', error)
            throw new Error('Error al obtener proveedores múltiples')
        }
    }

    // Método para obtener insumos sin proveedores asignados
    static async getInsumosSinProveedores() {
        try {
            const [insumos] = await connection.query(
                `SELECT 
                    i.id_insumo,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    i.categoria
                 FROM Insumos i
                 LEFT JOIN ProveedorInsumo pi ON i.id_insumo = pi.id_insumo AND pi.estado = 'Activo'
                 WHERE pi.id_insumo IS NULL
                 ORDER BY i.categoria, i.nombre;`
            )
            return insumos
        } catch (error) {
            console.error('Error al obtener insumos sin proveedores:', error)
            throw new Error('Error al obtener insumos sin proveedores')
        }
    }

    // Método para obtener resumen de relaciones por proveedor
    static async getResumenPorProveedor({ id_proveedor }) {
        try {
            const [resumen] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pi.id_proveedor) as id_proveedor,
                    pr.razonSocial,
                    COUNT(*) as totalInsumos,
                    COUNT(CASE WHEN pi.calificacion = 'Excelente' THEN 1 END) as excelentes,
                    COUNT(CASE WHEN pi.calificacion = 'Bueno' THEN 1 END) as buenos,
                    COUNT(CASE WHEN pi.calificacion = 'Regular' THEN 1 END) as regulares,
                    COUNT(CASE WHEN pi.calificacion = 'Malo' THEN 1 END) as malos,
                    COUNT(CASE WHEN pi.estado = 'Activo' THEN 1 END) as activos,
                    COUNT(CASE WHEN pi.estado = 'Inactivo' THEN 1 END) as inactivos
                 FROM ProveedorInsumo pi
                 JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
                 WHERE pi.id_proveedor = UUID_TO_BIN(?)
                 GROUP BY pi.id_proveedor, pr.razonSocial;`,
                [id_proveedor]
            )
            return resumen.length > 0 ? resumen[0] : null
        } catch (error) {
            console.error('Error al obtener resumen por proveedor:', error)
            throw new Error('Error al obtener resumen por proveedor')
        }
    }
}