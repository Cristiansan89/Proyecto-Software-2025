import { connection } from './db.js'

export class PedidoModel {
    static async getAll() {
        const [pedidos] = await connection.query(
            `SELECT 
                p.id_pedido as idPedido,
                p.id_proveedor as idProveedor,
                p.id_usuario_creador as idUsuarioCreador,
                pr.razonSocial as proveedor,
                u.nombreUsuario as creador,
                p.fechaEmision,
                p.estado
             FROM Pedidos p
             JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
             JOIN Usuarios u ON p.id_usuario_creador = u.id_usuario
             ORDER BY p.fechaEmision DESC;`
        )
        return pedidos
    }

    static async getById({ id }) {
        const [pedidos] = await connection.query(
            `SELECT 
                p.id_pedido as idPedido,
                p.id_proveedor as idProveedor,
                p.id_usuario_creador as idUsuarioCreador,
                pr.razonSocial as proveedor,
                u.nombreUsuario as creador,
                p.fechaEmision,
                p.estado
             FROM Pedidos p
             JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
             JOIN Usuarios u ON p.id_usuario_creador = u.id_usuario
             WHERE p.id_pedido = ?;`,
            [id]
        )
        if (pedidos.length === 0) return null
        return pedidos[0]
    }

    static async create({ input }) {
        const {
            idProveedor,
            idUsuarioCreador,
            fechaEmision,
            estado = 'Pendiente'
        } = input

        try {
            await connection.query(
                `INSERT INTO Pedidos (
                    id_pedido, 
                    id_proveedor, 
                    id_usuario_creador, 
                    fechaEmision, 
                    estado
                ) VALUES (UUID(), ?, ?, ?, ?);`,
                [idProveedor, idUsuarioCreador, fechaEmision, estado]
            )

            const [newPedido] = await connection.query(
                `SELECT id_pedido as idPedido 
                 FROM Pedidos 
                 WHERE id_proveedor = ? AND fechaEmision = ? 
                 ORDER BY id_pedido DESC LIMIT 1;`,
                [idProveedor, fechaEmision]
            )

            return this.getById({ id: newPedido[0].idPedido })
        } catch (error) {
            throw new Error('Error al crear el pedido')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Pedidos
                 WHERE id_pedido = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            estado
        } = input

        try {
            await connection.query(
                `UPDATE Pedidos
                 SET estado = ?
                 WHERE id_pedido = ?;`,
                [estado, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el pedido')
        }
    }
}