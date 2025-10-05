import { connection } from './db.js'

export class ConsumoModel {
    static async getAll() {
        const [consumos] = await connection.query(
            `SELECT 
                c.id_consumo as idConsumo,
                c.id_receta as idReceta,
                r.nombrePlato,
                c.fecha,
                c.cantidadRaciones
             FROM Consumos c
             JOIN Recetas r ON c.id_receta = r.id_receta
             ORDER BY c.fecha DESC;`
        )
        return consumos
    }

    static async getById({ id }) {
        const [consumos] = await connection.query(
            `SELECT 
                c.id_consumo as idConsumo,
                c.id_receta as idReceta,
                r.nombrePlato,
                c.fecha,
                c.cantidadRaciones
             FROM Consumos c
             JOIN Recetas r ON c.id_receta = r.id_receta
             WHERE c.id_consumo = ?;`,
            [id]
        )
        if (consumos.length === 0) return null
        return consumos[0]
    }

    static async create({ input }) {
        const {
            idReceta,
            fecha,
            cantidadRaciones
        } = input

        try {
            await connection.query(
                `INSERT INTO Consumos (id_consumo, id_receta, fecha, cantidadRaciones)
                 VALUES (UUID(), ?, ?, ?);`,
                [idReceta, fecha, cantidadRaciones]
            )

            const [newConsumo] = await connection.query(
                `SELECT id_consumo as idConsumo 
                 FROM Consumos 
                 WHERE id_receta = ? AND fecha = ? 
                 ORDER BY id_consumo DESC LIMIT 1;`,
                [idReceta, fecha]
            )

            return this.getById({ id: newConsumo[0].idConsumo })
        } catch (error) {
            throw new Error('Error al crear el consumo')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Consumos
                 WHERE id_consumo = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadRaciones
        } = input

        try {
            await connection.query(
                `UPDATE Consumos
                 SET cantidadRaciones = ?
                 WHERE id_consumo = ?;`,
                [cantidadRaciones, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el consumo')
        }
    }
}