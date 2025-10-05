import { connection } from './db.js'

export class RecetaModel {
    static async getAll() {
        const [recetas] = await connection.query(
            `SELECT 
                id_receta as idReceta,
                nombrePlato,
                descripcion,
                tiempoPreparacion,
                porciones,
                instrucciones,
                categoriaComida
             FROM Recetas
             ORDER BY nombrePlato;`
        )
        return recetas
    }

    static async getById({ id }) {
        const [recetas] = await connection.query(
            `SELECT 
                id_receta as idReceta,
                nombrePlato,
                descripcion,
                tiempoPreparacion,
                porciones,
                instrucciones,
                categoriaComida
             FROM Recetas
             WHERE id_receta = ?;`,
            [id]
        )
        if (recetas.length === 0) return null
        return recetas[0]
    }

    static async create({ input }) {
        const {
            nombrePlato,
            descripcion,
            tiempoPreparacion,
            porciones,
            instrucciones,
            categoriaComida
        } = input

        try {
            await connection.query(
                `INSERT INTO Recetas (
                    id_receta,
                    nombrePlato,
                    descripcion,
                    tiempoPreparacion,
                    porciones,
                    instrucciones,
                    categoriaComida
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?);`,
                [nombrePlato, descripcion, tiempoPreparacion, porciones, instrucciones, categoriaComida]
            )

            const [newReceta] = await connection.query(
                `SELECT id_receta as idReceta 
                 FROM Recetas 
                 WHERE nombrePlato = ? 
                 ORDER BY id_receta DESC LIMIT 1;`,
                [nombrePlato]
            )

            return this.getById({ id: newReceta[0].idReceta })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una receta con este nombre')
            }
            throw new Error('Error al crear la receta')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Recetas
                 WHERE id_receta = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            nombrePlato,
            descripcion,
            tiempoPreparacion,
            porciones,
            instrucciones,
            categoriaComida
        } = input

        try {
            const updates = []
            const values = []

            if (nombrePlato) {
                updates.push('nombrePlato = ?')
                values.push(nombrePlato)
            }
            if (descripcion !== undefined) {
                updates.push('descripcion = ?')
                values.push(descripcion)
            }
            if (tiempoPreparacion) {
                updates.push('tiempoPreparacion = ?')
                values.push(tiempoPreparacion)
            }
            if (porciones) {
                updates.push('porciones = ?')
                values.push(porciones)
            }
            if (instrucciones !== undefined) {
                updates.push('instrucciones = ?')
                values.push(instrucciones)
            }
            if (categoriaComida) {
                updates.push('categoriaComida = ?')
                values.push(categoriaComida)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Recetas
                 SET ${updates.join(', ')}
                 WHERE id_receta = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una receta con este nombre')
            }
            throw new Error('Error al actualizar la receta')
        }
    }
}