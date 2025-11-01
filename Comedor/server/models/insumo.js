import { connection } from './db.js'

export class InsumoModel {
    static async getAll() {
        const [insumos] = await connection.query(
            `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.descripcion,
                i.unidadMedida,
                i.categoria,
                i.stockMinimo,
                i.fecha,
                i.estado,
                COALESCE(inv.cantidadActual, 0) as stockActual,
                inv.nivelMinimoAlerta,
                inv.stockMaximo,
                inv.fechaUltimaActualizacion,
                inv.estado as estadoInventario
             FROM Insumos i
             LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             ORDER BY i.nombreInsumo;`
        )
        return insumos
    }

    static async getById({ id }) {
        const [insumos] = await connection.query(
            `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.descripcion,
                i.unidadMedida,
                i.categoria,
                i.stockMinimo,
                i.fecha,
                i.estado,
                COALESCE(inv.cantidadActual, 0) as stockActual,
                inv.nivelMinimoAlerta,
                inv.stockMaximo,
                inv.fechaUltimaActualizacion,
                inv.estado as estadoInventario
             FROM Insumos i
             LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             WHERE i.id_insumo = ?;`,
            [id]
        )
        if (insumos.length === 0) return null
        return insumos[0]
    }

    static async create({ input }) {
        const {
            nombreInsumo,
            descripcion,
            unidadMedida,
            categoria = 'Otros',
            stockMinimo = 0.00,
            estado = 'Activo',
            // Campos para inventario inicial
            cantidadActual = 0.000,
            nivelMinimoAlerta = 0.000,
            stockMaximo = 999.999
        } = input

        try {
            // Crear el insumo
            const [result] = await connection.query(
                `INSERT INTO Insumos (
                    nombreInsumo, 
                    descripcion,
                    unidadMedida, 
                    categoria,
                    stockMinimo,
                    estado
                ) VALUES (?, ?, ?, ?, ?, ?);`,
                [nombreInsumo, descripcion, unidadMedida, categoria, stockMinimo, estado]
            )

            const insumoId = result.insertId

            // Crear el registro en inventario
            await connection.query(
                `INSERT INTO Inventarios (
                    id_insumo,
                    cantidadActual,
                    nivelMinimoAlerta,
                    stockMaximo
                ) VALUES (?, ?, ?, ?);`,
                [insumoId, cantidadActual, nivelMinimoAlerta, stockMaximo]
            )

            return this.getById({ id: insumoId })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un insumo con ese nombre')
            }
            throw new Error('Error al crear el insumo')
        }
    }

    static async delete({ id }) {
        try {
            // Eliminar primero del inventario (por la restricción de FK)
            await connection.query(
                `DELETE FROM Inventarios
                 WHERE id_insumo = ?;`,
                [id]
            )

            // Luego eliminar el insumo
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
            descripcion,
            unidadMedida,
            categoria,
            stockMinimo,
            estado,
            // Campos para inventario
            cantidadActual,
            nivelMinimoAlerta,
            stockMaximo
        } = input

        try {
            // Actualizar datos del insumo
            const insumoUpdates = []
            const insumoValues = []

            if (nombreInsumo) {
                insumoUpdates.push('nombreInsumo = ?')
                insumoValues.push(nombreInsumo)
            }
            if (descripcion !== undefined) {
                insumoUpdates.push('descripcion = ?')
                insumoValues.push(descripcion)
            }
            if (unidadMedida) {
                insumoUpdates.push('unidadMedida = ?')
                insumoValues.push(unidadMedida)
            }
            if (categoria) {
                insumoUpdates.push('categoria = ?')
                insumoValues.push(categoria)
            }
            if (stockMinimo !== undefined) {
                insumoUpdates.push('stockMinimo = ?')
                insumoValues.push(stockMinimo)
            }
            if (estado) {
                insumoUpdates.push('estado = ?')
                insumoValues.push(estado)
            }

            if (insumoUpdates.length > 0) {
                insumoValues.push(id)
                await connection.query(
                    `UPDATE Insumos
                     SET ${insumoUpdates.join(', ')}
                     WHERE id_insumo = ?;`,
                    insumoValues
                )
            }

            // Actualizar datos del inventario
            const inventarioUpdates = []
            const inventarioValues = []

            if (cantidadActual !== undefined) {
                inventarioUpdates.push('cantidadActual = ?')
                inventarioValues.push(cantidadActual)
            }
            if (nivelMinimoAlerta !== undefined) {
                inventarioUpdates.push('nivelMinimoAlerta = ?')
                inventarioValues.push(nivelMinimoAlerta)
            }
            if (stockMaximo !== undefined) {
                inventarioUpdates.push('stockMaximo = ?')
                inventarioValues.push(stockMaximo)
            }

            if (inventarioUpdates.length > 0) {
                inventarioUpdates.push('fechaUltimaActualizacion = NOW()')
                inventarioValues.push(id)

                await connection.query(
                    `UPDATE Inventarios
                     SET ${inventarioUpdates.join(', ')}
                     WHERE id_insumo = ?;`,
                    inventarioValues
                )
            }

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
                `UPDATE Inventarios
                 SET cantidadActual = cantidadActual + ?,
                     fechaUltimaActualizacion = NOW()
                 WHERE id_insumo = ?;`,
                [cantidad, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el stock')
        }
    }

    static async getByCategoria({ categoria }) {
        const [insumos] = await connection.query(
            `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.descripcion,
                i.unidadMedida,
                i.categoria,
                i.stockMinimo,
                i.estado,
                COALESCE(inv.cantidadActual, 0) as stockActual
             FROM Insumos i
             LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             WHERE i.categoria = ? AND i.estado = 'Activo'
             ORDER BY i.nombreInsumo;`,
            [categoria]
        )
        return insumos
    }

    static async getBajoStock() {
        const [insumos] = await connection.query(
            `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.categoria,
                i.unidadMedida,
                inv.cantidadActual as stockActual,
                inv.nivelMinimoAlerta
             FROM Insumos i
             JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             WHERE inv.cantidadActual <= inv.nivelMinimoAlerta 
                AND i.estado = 'Activo'
             ORDER BY (inv.cantidadActual / inv.nivelMinimoAlerta) ASC;`
        )
        return insumos
    }
}