import { connection } from './db.js'

export class LineaPedidoModel {
    static async getAll() {
        const [lineas] = await connection.query(
            `SELECT 
                lp.id_linea as idLinea,
                lp.id_pedido as idPedido,
                lp.id_insumo as idInsumo,
                i.nombreInsumo,
                i.unidadDeMedida,
                lp.cantidadSolicitada,
                lp.cantidadRecibida
             FROM Lineas_Pedido lp
             JOIN Insumos i ON lp.id_insumo = i.id_insumo
             ORDER BY lp.id_pedido;`
        )
        return lineas
    }

    static async getById({ id }) {
        const [lineas] = await connection.query(
            `SELECT 
                lp.id_linea as idLinea,
                lp.id_pedido as idPedido,
                lp.id_insumo as idInsumo,
                i.nombreInsumo,
                i.unidadDeMedida,
                lp.cantidadSolicitada,
                lp.cantidadRecibida
             FROM Lineas_Pedido lp
             JOIN Insumos i ON lp.id_insumo = i.id_insumo
             WHERE lp.id_linea = ?;`,
            [id]
        )
        if (lineas.length === 0) return null
        return lineas[0]
    }

    static async create({ input }) {
        const {
            idPedido,
            idInsumo,
            cantidadSolicitada,
            cantidadRecibida = null
        } = input

        try {
            await connection.query(
                `INSERT INTO Lineas_Pedido (
                    id_linea, 
                    id_pedido, 
                    id_insumo, 
                    cantidadSolicitada, 
                    cantidadRecibida
                ) VALUES (UUID(), ?, ?, ?, ?);`,
                [idPedido, idInsumo, cantidadSolicitada, cantidadRecibida]
            )

            const [newLinea] = await connection.query(
                `SELECT id_linea as idLinea 
                 FROM Lineas_Pedido 
                 WHERE id_pedido = ? AND id_insumo = ? 
                 ORDER BY id_linea DESC LIMIT 1;`,
                [idPedido, idInsumo]
            )

            return this.getById({ id: newLinea[0].idLinea })
        } catch (error) {
            throw new Error('Error al crear la línea de pedido')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Lineas_Pedido
                 WHERE id_linea = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadSolicitada,
            cantidadRecibida
        } = input

        try {
            const updates = []
            const values = []

            if (cantidadSolicitada !== undefined) {
                updates.push('cantidadSolicitada = ?')
                values.push(cantidadSolicitada)
            }
            if (cantidadRecibida !== undefined) {
                updates.push('cantidadRecibida = ?')
                values.push(cantidadRecibida)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Lineas_Pedido
                 SET ${updates.join(', ')}
                 WHERE id_linea = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar la línea de pedido')
        }
    }

    static async getByPedido({ idPedido }) {
        const [lineas] = await connection.query(
            `SELECT 
                lp.id_linea as idLinea,
                lp.id_pedido as idPedido,
                lp.id_insumo as idInsumo,
                i.nombreInsumo,
                i.unidadDeMedida,
                lp.cantidadSolicitada,
                lp.cantidadRecibida
             FROM Lineas_Pedido lp
             JOIN Insumos i ON lp.id_insumo = i.id_insumo
             WHERE lp.id_pedido = ?
             ORDER BY i.nombreInsumo;`,
            [idPedido]
        )
        return lineas
    }
}