import { connection } from './db.js'

export class ParametroSistemaModel {
    static async getAll() {
        const [parametros] = await connection.query(
            `SELECT 
                clave,
                valor,
                descripcion,
                fechaModificacion
             FROM Parametros_Sistema
             ORDER BY clave;`
        )
        return parametros
    }

    static async getById({ id }) {
        const [parametros] = await connection.query(
            `SELECT 
                clave,
                valor,
                descripcion,
                fechaModificacion
             FROM Parametros_Sistema
             WHERE clave = ?;`,
            [id]
        )
        if (parametros.length === 0) return null
        return parametros[0]
    }

    static async create({ input }) {
        const {
            clave,
            valor,
            descripcion
        } = input

        try {
            await connection.query(
                `INSERT INTO Parametros_Sistema (
                    clave,
                    valor,
                    descripcion,
                    fechaModificacion
                ) VALUES (?, ?, ?, NOW());`,
                [clave, valor, descripcion]
            )

            return this.getById({ id: clave })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un parámetro con esta clave')
            }
            throw new Error('Error al crear el parámetro del sistema')
        }
    }

    static async delete({ id }) {
        try {
            const result = await connection.query(
                `DELETE FROM Parametros_Sistema
                 WHERE clave = ?;`,
                [id]
            )
            return result[0].affectedRows > 0
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            valor,
            descripcion
        } = input

        try {
            const updates = []
            const values = []

            if (valor !== undefined) {
                updates.push('valor = ?')
                values.push(valor)
            }
            if (descripcion !== undefined) {
                updates.push('descripcion = ?')
                values.push(descripcion)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fechaModificacion = NOW()')
            values.push(id)

            await connection.query(
                `UPDATE Parametros_Sistema
                 SET ${updates.join(', ')}
                 WHERE clave = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el parámetro del sistema')
        }
    }

    static async getByKey(clave) {
        const parametro = await this.getById({ id: clave })
        return parametro ? parametro.valor : null
    }
}