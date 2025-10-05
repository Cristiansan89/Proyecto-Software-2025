import { connection } from './db.js'

export class InventarioModel {
    static async getAll() {
        const [inventarios] = await connection.query(
            `SELECT 
                i.id_inventario as idInventario,
                i.id_insumo as idInsumo,
                ins.nombreInsumo,
                i.fechaVencimiento,
                i.lote,
                i.cantidad,
                i.ubicacion
             FROM Inventarios i
             JOIN Insumos ins ON i.id_insumo = ins.id_insumo
             ORDER BY i.fechaVencimiento;`
        )
        return inventarios
    }

    static async getById({ id }) {
        const [inventarios] = await connection.query(
            `SELECT 
                i.id_inventario as idInventario,
                i.id_insumo as idInsumo,
                ins.nombreInsumo,
                i.fechaVencimiento,
                i.lote,
                i.cantidad,
                i.ubicacion
             FROM Inventarios i
             JOIN Insumos ins ON i.id_insumo = ins.id_insumo
             WHERE i.id_inventario = ?;`,
            [id]
        )
        if (inventarios.length === 0) return null
        return inventarios[0]
    }

    static async create({ input }) {
        const {
            idInsumo,
            fechaVencimiento,
            lote,
            cantidad,
            ubicacion
        } = input

        try {
            await connection.query(
                `INSERT INTO Inventarios (
                    id_inventario,
                    id_insumo,
                    fechaVencimiento,
                    lote,
                    cantidad,
                    ubicacion
                ) VALUES (UUID(), ?, ?, ?, ?, ?);`,
                [idInsumo, fechaVencimiento, lote, cantidad, ubicacion]
            )

            const [newInventario] = await connection.query(
                `SELECT id_inventario as idInventario 
                 FROM Inventarios 
                 WHERE id_insumo = ? AND lote = ? 
                 ORDER BY id_inventario DESC LIMIT 1;`,
                [idInsumo, lote]
            )

            return this.getById({ id: newInventario[0].idInventario })
        } catch (error) {
            throw new Error('Error al crear el registro de inventario')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Inventarios
                 WHERE id_inventario = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            fechaVencimiento,
            lote,
            cantidad,
            ubicacion
        } = input

        try {
            const updates = []
            const values = []

            if (fechaVencimiento) {
                updates.push('fechaVencimiento = ?')
                values.push(fechaVencimiento)
            }
            if (lote) {
                updates.push('lote = ?')
                values.push(lote)
            }
            if (cantidad !== undefined) {
                updates.push('cantidad = ?')
                values.push(cantidad)
            }
            if (ubicacion) {
                updates.push('ubicacion = ?')
                values.push(ubicacion)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Inventarios
                 SET ${updates.join(', ')}
                 WHERE id_inventario = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el registro de inventario')
        }
    }

    static async getByInsumo({ idInsumo }) {
        const [inventarios] = await connection.query(
            `SELECT 
                i.id_inventario as idInventario,
                i.id_insumo as idInsumo,
                ins.nombreInsumo,
                i.fechaVencimiento,
                i.lote,
                i.cantidad,
                i.ubicacion
             FROM Inventarios i
             JOIN Insumos ins ON i.id_insumo = ins.id_insumo
             WHERE i.id_insumo = ?
             ORDER BY i.fechaVencimiento;`,
            [idInsumo]
        )
        return inventarios
    }
}