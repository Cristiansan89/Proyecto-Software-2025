import { connection } from './db.js'

export class PedidoModel {
    static async getAll() {
        try {
            const [pedidos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(pe.nombres, ' ', pe.apellidos) as nombreUsuario,
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 ORDER BY p.fechaEmision DESC;`
            )
            return pedidos
        } catch (error) {
            console.error('Error al obtener pedidos:', error)
            throw new Error('Error al obtener pedidos')
        }
    }

    static async getById({ id }) {
        try {
            const [pedidos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(pe.nombres, ' ', pe.apellidos) as nombreUsuario,
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_pedido = UUID_TO_BIN(?);`,
                [id]
            )
            if (pedidos.length === 0) return null
            return pedidos[0]
        } catch (error) {
            console.error('Error al obtener pedido:', error)
            throw new Error('Error al obtener pedido')
        }
    }

    static async create({ input }) {
        const {
            id_planificacion,
            id_usuario,
            id_estadoPedido,
            id_proveedor,
            fechaEmision,
            origen = 'Manual',
            fechaAprobacion = null,
            motivoCancelacion = null
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Pedidos (
                    id_planificacion,
                    id_usuario, 
                    id_estadoPedido,
                    id_proveedor, 
                    fechaEmision, 
                    origen,
                    fechaAprobacion,
                    motivoCancelacion
                ) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, UUID_TO_BIN(?), ?, ?, ?, ?);`,
                [id_planificacion, id_usuario, id_estadoPedido, id_proveedor, fechaEmision, origen, fechaAprobacion, motivoCancelacion]
            )

            // Obtener el ID del pedido recién creado
            const [newPedido] = await connection.query(
                `SELECT BIN_TO_UUID(id_pedido) as id_pedido 
                 FROM Pedidos 
                 WHERE id_proveedor = UUID_TO_BIN(?) AND fechaEmision = ?
                 ORDER BY fechaEmision DESC LIMIT 1;`,
                [id_proveedor, fechaEmision]
            )

            return this.getById({ id: newPedido[0].id_pedido })
        } catch (error) {
            console.error('Error al crear el pedido:', error)
            throw new Error('Error al crear el pedido')
        }
    }

    static async delete({ id }) {
        try {
            // Primero eliminar los detalles del pedido
            await connection.query(
                `DELETE FROM DetallePedido WHERE id_pedido = UUID_TO_BIN(?);`,
                [id]
            )

            // Luego eliminar el pedido
            await connection.query(
                `DELETE FROM Pedidos WHERE id_pedido = UUID_TO_BIN(?);`,
                [id]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar pedido:', error)
            return false
        }
    }

    static async update({ id, input }) {
        const {
            id_estadoPedido,
            fechaAprobacion,
            motivoCancelacion
        } = input

        try {
            const updates = []
            const values = []

            if (id_estadoPedido !== undefined) {
                updates.push('id_estadoPedido = ?')
                values.push(id_estadoPedido)
            }
            if (fechaAprobacion !== undefined) {
                updates.push('fechaAprobacion = ?')
                values.push(fechaAprobacion)
            }
            if (motivoCancelacion !== undefined) {
                updates.push('motivoCancelacion = ?')
                values.push(motivoCancelacion)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Pedidos
                 SET ${updates.join(', ')}
                 WHERE id_pedido = UUID_TO_BIN(?);`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar el pedido:', error)
            throw new Error('Error al actualizar el pedido')
        }
    }

    // Método para obtener pedidos por proveedor
    static async getByProveedor({ id_proveedor }) {
        try {
            const [pedidos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(pe.nombres, ' ', pe.apellidos) as nombreUsuario,
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_proveedor = UUID_TO_BIN(?)
                 ORDER BY p.fechaEmision DESC;`,
                [id_proveedor]
            )
            return pedidos
        } catch (error) {
            console.error('Error al obtener pedidos por proveedor:', error)
            throw new Error('Error al obtener pedidos por proveedor')
        }
    }

    // Método para obtener pedidos por planificación
    static async getByPlanificacion({ id_planificacion }) {
        try {
            const [pedidos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(pe.nombres, ' ', pe.apellidos) as nombreUsuario,
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_planificacion = UUID_TO_BIN(?)
                 ORDER BY p.fechaEmision DESC;`,
                [id_planificacion]
            )
            return pedidos
        } catch (error) {
            console.error('Error al obtener pedidos por planificación:', error)
            throw new Error('Error al obtener pedidos por planificación')
        }
    }

    // Método para obtener pedidos por estado
    static async getByEstado({ id_estadoPedido }) {
        try {
            const [pedidos] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(p.id_pedido) as id_pedido,
                    BIN_TO_UUID(p.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(p.id_usuario) as id_usuario,
                    p.id_estadoPedido,
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    pr.razonSocial as nombreProveedor,
                    CONCAT(pe.nombres, ' ', pe.apellidos) as nombreUsuario,
                    p.fechaEmision,
                    p.origen,
                    p.fechaAprobacion,
                    p.motivoCancelacion
                 FROM Pedidos p
                 JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
                 JOIN Usuarios u ON p.id_usuario = u.id_usuario
                 JOIN Personas pe ON u.id_persona = pe.id_persona
                 WHERE p.id_estadoPedido = ?
                 ORDER BY p.fechaEmision DESC;`,
                [id_estadoPedido]
            )
            return pedidos
        } catch (error) {
            console.error('Error al obtener pedidos por estado:', error)
            throw new Error('Error al obtener pedidos por estado')
        }
    }

    // Método para obtener pedido completo con sus detalles
    static async getPedidoCompleto({ id }) {
        try {
            const pedido = await this.getById({ id })
            if (!pedido) return null

            const [detalles] = await connection.query(
                `SELECT 
                    dp.id_detallePedido,
                    BIN_TO_UUID(dp.id_pedido) as id_pedido,
                    BIN_TO_UUID(dp.id_proveedor) as id_proveedor,
                    dp.id_insumo,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    dp.cantidadSolicitada,
                    pr.razonSocial as nombreProveedor
                 FROM DetallePedido dp
                 JOIN Insumos i ON dp.id_insumo = i.id_insumo
                 JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
                 WHERE dp.id_pedido = UUID_TO_BIN(?)
                 ORDER BY pr.razonSocial, i.nombre;`,
                [id]
            )

            return {
                ...pedido,
                detalles
            }
        } catch (error) {
            console.error('Error al obtener pedido completo:', error)
            throw new Error('Error al obtener pedido completo')
        }
    }

    // Método para aprobar un pedido
    static async aprobar({ id, id_usuario_aprobador }) {
        try {
            await connection.query(
                `UPDATE Pedidos
                 SET id_estadoPedido = 2, fechaAprobacion = CURDATE()
                 WHERE id_pedido = UUID_TO_BIN(?);`,
                [id]
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al aprobar pedido:', error)
            throw new Error('Error al aprobar pedido')
        }
    }

    // Método para cancelar un pedido
    static async cancelar({ id, motivoCancelacion }) {
        try {
            await connection.query(
                `UPDATE Pedidos
                 SET id_estadoPedido = 3, motivoCancelacion = ?
                 WHERE id_pedido = UUID_TO_BIN(?);`,
                [motivoCancelacion, id]
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al cancelar pedido:', error)
            throw new Error('Error al cancelar pedido')
        }
    }

    // Método para obtener resumen de pedidos por período
    static async getResumenPorPeriodo({ fechaInicio, fechaFin }) {
        try {
            const [resumen] = await connection.query(
                `SELECT 
                    p.origen,
                    p.id_estadoPedido,
                    COUNT(*) as totalPedidos,
                    COUNT(DISTINCT p.id_proveedor) as proveedoresInvolucrados
                 FROM Pedidos p
                 WHERE p.fechaEmision BETWEEN ? AND ?
                 GROUP BY p.origen, p.id_estadoPedido
                 ORDER BY p.origen, p.id_estadoPedido;`,
                [fechaInicio, fechaFin]
            )
            return resumen
        } catch (error) {
            console.error('Error al obtener resumen por período:', error)
            throw new Error('Error al obtener resumen por período')
        }
    }
}