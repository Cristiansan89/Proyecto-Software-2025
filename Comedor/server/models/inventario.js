import { connection } from './db.js'

export class InventarioModel {
    static async getAll() {
        try {
            const [inventarios] = await connection.query(
                `SELECT 
                    i.id_insumo,
                    ins.nombre as nombreInsumo,
                    ins.unidadMedida,
                    ins.categoria,
                    i.cantidadActual,
                    i.nivelMinimoAlerta,
                    i.stockMaximo,
                    i.fechaUltimaActualizacion,
                    i.estado
                 FROM Inventarios i
                 JOIN Insumos ins ON i.id_insumo = ins.id_insumo
                 ORDER BY i.estado DESC, ins.nombre;`
            )
            return inventarios
        } catch (error) {
            console.error('Error al obtener inventarios:', error)
            throw new Error('Error al obtener inventarios')
        }
    }

    static async getById({ id }) {
        try {
            const [inventarios] = await connection.query(
                `SELECT 
                    i.id_insumo,
                    ins.nombre as nombreInsumo,
                    ins.unidadMedida,
                    ins.categoria,
                    i.cantidadActual,
                    i.nivelMinimoAlerta,
                    i.stockMaximo,
                    i.fechaUltimaActualizacion,
                    i.estado
                 FROM Inventarios i
                 JOIN Insumos ins ON i.id_insumo = ins.id_insumo
                 WHERE i.id_insumo = ?;`,
                [id]
            )
            if (inventarios.length === 0) return null
            return inventarios[0]
        } catch (error) {
            console.error('Error al obtener inventario:', error)
            throw new Error('Error al obtener inventario')
        }
    }

    static async create({ input }) {
        const {
            id_insumo,
            cantidadActual = 0,
            nivelMinimoAlerta = 0,
            stockMaximo = 999.999,
            estado = 'Normal'
        } = input

        try {
            await connection.query(
                `INSERT INTO Inventarios (
                    id_insumo,
                    cantidadActual,
                    nivelMinimoAlerta,
                    stockMaximo,
                    fechaUltimaActualizacion,
                    estado
                ) VALUES (?, ?, ?, ?, CURDATE(), ?);`,
                [id_insumo, cantidadActual, nivelMinimoAlerta, stockMaximo, estado]
            )

            return this.getById({ id: id_insumo })
        } catch (error) {
            console.error('Error al crear el registro de inventario:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un registro de inventario para este insumo')
            }
            throw new Error('Error al crear el registro de inventario')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Inventarios WHERE id_insumo = ?;`,
                [id]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar inventario:', error)
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadActual,
            nivelMinimoAlerta,
            stockMaximo,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (cantidadActual !== undefined) {
                updates.push('cantidadActual = ?')
                values.push(cantidadActual)
            }
            if (nivelMinimoAlerta !== undefined) {
                updates.push('nivelMinimoAlerta = ?')
                values.push(nivelMinimoAlerta)
            }
            if (stockMaximo !== undefined) {
                updates.push('stockMaximo = ?')
                values.push(stockMaximo)
            }
            if (estado !== undefined) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fechaUltimaActualizacion = CURDATE()')
            values.push(id)

            await connection.query(
                `UPDATE Inventarios
                 SET ${updates.join(', ')}
                 WHERE id_insumo = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar el registro de inventario:', error)
            throw new Error('Error al actualizar el registro de inventario')
        }
    }

    // Método para ajustar stock (sumar o restar cantidad)
    static async adjustStock({ id_insumo, cantidad, tipo = 'entrada' }) {
        try {
            const operador = tipo === 'entrada' ? '+' : '-'

            await connection.query(
                `UPDATE Inventarios 
                 SET cantidadActual = cantidadActual ${operador} ?,
                     fechaUltimaActualizacion = CURDATE()
                 WHERE id_insumo = ?;`,
                [Math.abs(cantidad), id_insumo]
            )

            // Actualizar estado según niveles
            await this.updateEstadoByNiveles({ id_insumo })

            return this.getById({ id: id_insumo })
        } catch (error) {
            console.error('Error al ajustar stock:', error)
            throw new Error('Error al ajustar stock')
        }
    }

    // Método para actualizar estado basado en niveles de stock
    static async updateEstadoByNiveles({ id_insumo }) {
        try {
            await connection.query(
                `UPDATE Inventarios 
                 SET estado = CASE 
                     WHEN cantidadActual <= 0 THEN 'Agotado'
                     WHEN cantidadActual <= nivelMinimoAlerta THEN 'Critico'
                     ELSE 'Normal'
                 END
                 WHERE id_insumo = ?;`,
                [id_insumo]
            )
        } catch (error) {
            console.error('Error al actualizar estado:', error)
            throw new Error('Error al actualizar estado')
        }
    }

    // Método para obtener inventarios con stock crítico o agotado
    static async getInsumosConStockBajo() {
        try {
            const [inventarios] = await connection.query(
                `SELECT 
                    i.id_insumo,
                    ins.nombre as nombreInsumo,
                    ins.unidadMedida,
                    ins.categoria,
                    i.cantidadActual,
                    i.nivelMinimoAlerta,
                    i.stockMaximo,
                    i.fechaUltimaActualizacion,
                    i.estado
                 FROM Inventarios i
                 JOIN Insumos ins ON i.id_insumo = ins.id_insumo
                 WHERE i.estado IN ('Agotado', 'Critico')
                 ORDER BY i.estado DESC, ins.nombre;`
            )
            return inventarios
        } catch (error) {
            console.error('Error al obtener insumos con stock bajo:', error)
            throw new Error('Error al obtener insumos con stock bajo')
        }
    }

    // Método para obtener resumen de inventario por categoría
    static async getResumenPorCategoria() {
        try {
            const [resumen] = await connection.query(
                `SELECT 
                    ins.categoria,
                    COUNT(*) as totalInsumos,
                    SUM(CASE WHEN i.estado = 'Normal' THEN 1 ELSE 0 END) as normales,
                    SUM(CASE WHEN i.estado = 'Critico' THEN 1 ELSE 0 END) as criticos,
                    SUM(CASE WHEN i.estado = 'Agotado' THEN 1 ELSE 0 END) as agotados
                 FROM Inventarios i
                 JOIN Insumos ins ON i.id_insumo = ins.id_insumo
                 GROUP BY ins.categoria
                 ORDER BY ins.categoria;`
            )
            return resumen
        } catch (error) {
            console.error('Error al obtener resumen por categoría:', error)
            throw new Error('Error al obtener resumen por categoría')
        }
    }
}