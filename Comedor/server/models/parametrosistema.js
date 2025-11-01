import { connection } from './db.js'

export class ParametroSistemaModel {
    static async getAll() {
        try {
            const [parametros] = await connection.query(
                `SELECT 
                    id_parametro,
                    nombreParametro,
                    valor,
                    tipoParametro,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Parametros
                 ORDER BY nombreParametro;`
            )
            return parametros
        } catch (error) {
            console.error('Error al obtener parámetros del sistema:', error)
            throw new Error('Error al obtener parámetros del sistema')
        }
    }

    static async getById({ id }) {
        try {
            const [parametros] = await connection.query(
                `SELECT 
                    id_parametro,
                    nombreParametro,
                    valor,
                    tipoParametro,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Parametros
                 WHERE id_parametro = ?;`,
                [id]
            )
            if (parametros.length === 0) return null
            return parametros[0]
        } catch (error) {
            console.error('Error al obtener parámetro del sistema:', error)
            throw new Error('Error al obtener parámetro del sistema')
        }
    }

    static async create({ input }) {
        const {
            nombreParametro,
            valor,
            tipoParametro,
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Parametros (
                    nombreParametro,
                    valor,
                    tipoParametro,
                    estado
                ) VALUES (?, ?, ?, ?);`,
                [nombreParametro, valor, tipoParametro, estado]
            )

            const newId = result.insertId
            return this.getById({ id: newId })
        } catch (error) {
            console.error('Error al crear el parámetro del sistema:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un parámetro con ese nombre')
            }
            throw new Error('Error al crear el parámetro del sistema')
        }
    }

    static async delete({ id }) {
        try {
            const result = await connection.query(
                `DELETE FROM Parametros WHERE id_parametro = ?;`,
                [id]
            )
            return result[0].affectedRows > 0
        } catch (error) {
            console.error('Error al eliminar parámetro del sistema:', error)
            return false
        }
    }

    static async update({ id, input }) {
        const {
            nombreParametro,
            valor,
            tipoParametro,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (nombreParametro !== undefined) {
                updates.push('nombreParametro = ?')
                values.push(nombreParametro)
            }
            if (valor !== undefined) {
                updates.push('valor = ?')
                values.push(valor)
            }
            if (tipoParametro !== undefined) {
                updates.push('tipoParametro = ?')
                values.push(tipoParametro)
            }
            if (estado !== undefined) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fechaModificacion = NOW()')
            values.push(id)

            await connection.query(
                `UPDATE Parametros
                 SET ${updates.join(', ')}
                 WHERE id_parametro = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar el parámetro del sistema:', error)
            throw new Error('Error al actualizar el parámetro del sistema')
        }
    }

    // Método para buscar por nombre del parámetro
    static async getByNombre({ nombreParametro }) {
        try {
            const [parametros] = await connection.query(
                `SELECT 
                    id_parametro,
                    nombreParametro,
                    valor,
                    tipoParametro,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Parametros
                 WHERE nombreParametro = ? AND estado = 'Activo';`,
                [nombreParametro]
            )
            if (parametros.length === 0) return null
            return parametros[0]
        } catch (error) {
            console.error('Error al obtener parámetro por nombre:', error)
            throw new Error('Error al obtener parámetro por nombre')
        }
    }

    // Método para obtener solo el valor de un parámetro por nombre
    static async getValorByNombre({ nombreParametro }) {
        try {
            const parametro = await this.getByNombre({ nombreParametro })
            return parametro ? parametro.valor : null
        } catch (error) {
            console.error('Error al obtener valor del parámetro:', error)
            return null
        }
    }

    // Método para obtener parámetros por tipo
    static async getByTipo({ tipoParametro }) {
        try {
            const [parametros] = await connection.query(
                `SELECT 
                    id_parametro,
                    nombreParametro,
                    valor,
                    tipoParametro,
                    fechaAlta,  
                    fechaModificacion,
                    estado
                 FROM Parametros
                 WHERE tipoParametro = ? AND estado = 'Activo'
                 ORDER BY nombreParametro;`,
                [tipoParametro]
            )
            return parametros
        } catch (error) {
            console.error('Error al obtener parámetros por tipo:', error)
            throw new Error('Error al obtener parámetros por tipo')
        }
    }

    // Método para obtener solo parámetros activos
    static async getActivos() {
        try {
            const [parametros] = await connection.query(
                `SELECT 
                    id_parametro,
                    nombreParametro,
                    valor,
                    tipoParametro,
                    fechaAlta,
                    fechaModificacion,
                    estado
                 FROM Parametros
                 WHERE estado = 'Activo'
                 ORDER BY nombreParametro;`
            )
            return parametros
        } catch (error) {
            console.error('Error al obtener parámetros activos:', error)
            throw new Error('Error al obtener parámetros activos')
        }
    }

    // Método para activar/desactivar un parámetro
    static async cambiarEstado({ id, estado }) {
        try {
            await connection.query(
                `UPDATE Parametros
                 SET estado = ?, fechaModificacion = NOW()
                 WHERE id_parametro = ?;`,
                [estado, id]
            )
            return this.getById({ id })
        } catch (error) {
            console.error('Error al cambiar estado del parámetro:', error)
            throw new Error('Error al cambiar estado del parámetro')
        }
    }

    // Método para obtener configuración completa del sistema
    static async getConfiguracionSistema() {
        try {
            const [config] = await connection.query(
                `SELECT 
                    nombreParametro,
                    valor,
                    tipoParametro
                 FROM Parametros
                 WHERE estado = 'Activo'
                 ORDER BY tipoParametro, nombreParametro;`
            )

            // Agrupar por tipo de parámetro
            const configuracion = {}
            config.forEach(param => {
                if (!configuracion[param.tipoParametro]) {
                    configuracion[param.tipoParametro] = {}
                }
                configuracion[param.tipoParametro][param.nombreParametro] = param.valor
            })

            return configuracion
        } catch (error) {
            console.error('Error al obtener configuración del sistema:', error)
            throw new Error('Error al obtener configuración del sistema')
        }
    }
}