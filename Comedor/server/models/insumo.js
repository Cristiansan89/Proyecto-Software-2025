import { connection } from './db.js'

export class InsumoModel {
    static async getAll() {
        const [insumos] = await connection.query(
            `SELECT 
                id_insumo as idInsumo,
                nombreInsumo,
                unidadDeMedida,
                descripcion,
                stockMinimo,
                stockActual
             FROM Insumos
             ORDER BY nombreInsumo;`
        )
        return insumos
    }

    static async getById({ id }) {
        const [insumos] = await connection.query(
            `SELECT 
                id_insumo as idInsumo,
                nombreInsumo,
                unidadDeMedida,
                descripcion,
                stockMinimo,
                stockActual
             FROM Insumos
             WHERE id_insumo = ?;`,
            [id]
        )
        if (insumos.length === 0) return null
        return insumos[0]
    }

    static async create({ input }) {
        const {
            nombreInsumo,
            unidadDeMedida,
            descripcion,
            stockMinimo = 0,
            stockActual = 0
        } = input

        try {
            await connection.query(
                `INSERT INTO Insumos (
                    id_insumo, 
                    nombreInsumo, 
                    unidadDeMedida, 
                    descripcion,
                    stockMinimo,
                    stockActual
                ) VALUES (UUID(), ?, ?, ?, ?, ?);`,
                [nombreInsumo, unidadDeMedida, descripcion, stockMinimo, stockActual]
            )

            const [newInsumo] = await connection.query(
                `SELECT id_insumo as idInsumo 
                 FROM Insumos 
                 WHERE nombreInsumo = ? 
                 ORDER BY id_insumo DESC LIMIT 1;`,
                [nombreInsumo]
            )

            return this.getById({ id: newInsumo[0].idInsumo })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un insumo con ese nombre')
            }
            throw new Error('Error al crear el insumo')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Insumos
                 WHERE id_insumo = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            nombreInsumo,
            unidadDeMedida,
            descripcion,
            stockMinimo,
            stockActual
        } = input

        try {
            const updates = []
            const values = []

            if (nombreInsumo) {
                updates.push('nombreInsumo = ?')
                values.push(nombreInsumo)
            }
            if (unidadDeMedida) {
                updates.push('unidadDeMedida = ?')
                values.push(unidadDeMedida)
            }
            if (descripcion !== undefined) {
                updates.push('descripcion = ?')
                values.push(descripcion)
            }
            if (stockMinimo !== undefined) {
                updates.push('stockMinimo = ?')
                values.push(stockMinimo)
            }
            if (stockActual !== undefined) {
                updates.push('stockActual = ?')
                values.push(stockActual)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Insumos
                 SET ${updates.join(', ')}
                 WHERE id_insumo = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un insumo con ese nombre')
            }
            throw new Error('Error al actualizar el insumo')
        }
    }

    static async updateStock({ id, cantidad }) {
        try {
            await connection.query(
                `UPDATE Insumos
                 SET stockActual = stockActual + ?
                 WHERE id_insumo = ?;`,
                [cantidad, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el stock')
        }
    }
}