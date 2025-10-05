import { connection } from './db.js'

export class MovimientoInventarioModel {
    static async getAll() {
        const [movimientos] = await connection.query(
            `SELECT 
                m.id_movimiento as idMovimiento,
                m.id_insumo as idInsumo,
                m.id_usuario as idUsuario,
                m.id_consumo as idConsumo,
                i.nombreInsumo,
                u.nombreUsuario,
                m.tipoMovimiento,
                m.cantidad,
                m.fechaHora,
                m.comentario
             FROM Movimientos_Inventario m
             JOIN Insumos i ON m.id_insumo = i.id_insumo
             JOIN Usuarios u ON m.id_usuario = u.id_usuario
             LEFT JOIN Consumos c ON m.id_consumo = c.id_consumo
             ORDER BY m.fechaHora DESC;`
        )
        return movimientos
    }

    static async getById({ id }) {
        const [movimientos] = await connection.query(
            `SELECT 
                m.id_movimiento as idMovimiento,
                m.id_insumo as idInsumo,
                m.id_usuario as idUsuario,
                m.id_consumo as idConsumo,
                i.nombreInsumo,
                u.nombreUsuario,
                m.tipoMovimiento,
                m.cantidad,
                m.fechaHora,
                m.comentario
             FROM Movimientos_Inventario m
             JOIN Insumos i ON m.id_insumo = i.id_insumo
             JOIN Usuarios u ON m.id_usuario = u.id_usuario
             LEFT JOIN Consumos c ON m.id_consumo = c.id_consumo
             WHERE m.id_movimiento = ?;`,
            [id]
        )
        if (movimientos.length === 0) return null
        return movimientos[0]
    }

    static async create({ input }) {
        const {
            idInsumo,
            idUsuario,
            idConsumo,
            tipoMovimiento,
            cantidad,
            comentario
        } = input

        try {
            await connection.query(
                `INSERT INTO Movimientos_Inventario (
                    id_movimiento, 
                    id_insumo, 
                    id_usuario,
                    id_consumo, 
                    tipoMovimiento, 
                    cantidad, 
                    fechaHora, 
                    comentario
                ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), ?);`,
                [idInsumo, idUsuario, idConsumo, tipoMovimiento, cantidad, comentario]
            )

            const [newMovimiento] = await connection.query(
                `SELECT id_movimiento as idMovimiento 
                 FROM Movimientos_Inventario 
                 WHERE id_insumo = ? AND fechaHora = NOW()
                 ORDER BY id_movimiento DESC LIMIT 1;`,
                [idInsumo]
            )

            return this.getById({ id: newMovimiento[0].idMovimiento })
        } catch (error) {
            throw new Error('Error al crear el movimiento de inventario')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Movimientos_Inventario
                 WHERE id_movimiento = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            comentario
        } = input

        try {
            await connection.query(
                `UPDATE Movimientos_Inventario
                 SET comentario = ?
                 WHERE id_movimiento = ?;`,
                [comentario, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el movimiento de inventario')
        }
    }
}