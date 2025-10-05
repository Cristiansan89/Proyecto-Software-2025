import { connection } from './db.js'

export class ItemRecetaModel {
    static async getAll() {
        const [items] = await connection.query(
            `SELECT 
                ir.id_item as idItem,
                ir.id_receta as idReceta,
                ir.id_insumo as idInsumo,
                r.nombrePlato,
                i.nombreInsumo,
                i.unidadDeMedida,
                ir.cantidadPorPorcion
             FROM Items_Receta ir
             JOIN Recetas r ON ir.id_receta = r.id_receta
             JOIN Insumos i ON ir.id_insumo = i.id_insumo
             ORDER BY r.nombrePlato, i.nombreInsumo;`
        )
        return items
    }

    static async getById({ id }) {
        const [items] = await connection.query(
            `SELECT 
                ir.id_item as idItem,
                ir.id_receta as idReceta,
                ir.id_insumo as idInsumo,
                r.nombrePlato,
                i.nombreInsumo,
                i.unidadDeMedida,
                ir.cantidadPorPorcion
             FROM Items_Receta ir
             JOIN Recetas r ON ir.id_receta = r.id_receta
             JOIN Insumos i ON ir.id_insumo = i.id_insumo
             WHERE ir.id_item = ?;`,
            [id]
        )
        if (items.length === 0) return null
        return items[0]
    }

    static async create({ input }) {
        const {
            idReceta,
            idInsumo,
            cantidadPorPorcion
        } = input

        try {
            await connection.query(
                `INSERT INTO Items_Receta (
                    id_item, 
                    id_receta, 
                    id_insumo, 
                    cantidadPorPorcion
                ) VALUES (UUID(), ?, ?, ?);`,
                [idReceta, idInsumo, cantidadPorPorcion]
            )

            const [newItem] = await connection.query(
                `SELECT id_item as idItem 
                 FROM Items_Receta 
                 WHERE id_receta = ? AND id_insumo = ? 
                 ORDER BY id_item DESC LIMIT 1;`,
                [idReceta, idInsumo]
            )

            return this.getById({ id: newItem[0].idItem })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Este insumo ya existe en la receta')
            }
            throw new Error('Error al crear el item de receta')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Items_Receta
                 WHERE id_item = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadPorPorcion
        } = input

        try {
            await connection.query(
                `UPDATE Items_Receta
                 SET cantidadPorPorcion = ?
                 WHERE id_item = ?;`,
                [cantidadPorPorcion, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el item de receta')
        }
    }

    static async getByReceta({ idReceta }) {
        const [items] = await connection.query(
            `SELECT 
                ir.id_item as idItem,
                ir.id_receta as idReceta,
                ir.id_insumo as idInsumo,
                r.nombrePlato,
                i.nombreInsumo,
                i.unidadDeMedida,
                ir.cantidadPorPorcion
             FROM Items_Receta ir
             JOIN Recetas r ON ir.id_receta = r.id_receta
             JOIN Insumos i ON ir.id_insumo = i.id_insumo
             WHERE ir.id_receta = ?
             ORDER BY i.nombreInsumo;`,
            [idReceta]
        )
        return items
    }
}