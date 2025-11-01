import { connection } from './db.js'

export class ItemRecetaModel {
    static async getAll() {
        try {
            const [items] = await connection.query(
                `SELECT 
                    ir.idItemReceta,
                    BIN_TO_UUID(ir.id_receta) as id_receta,
                    ir.id_insumo,
                    r.nombrePlato,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    ir.cantidadPorPorcion
                 FROM ItemsRecetas ir
                 JOIN Recetas r ON ir.id_receta = r.id_receta
                 JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 ORDER BY r.nombrePlato, i.nombre;`
            )
            return items
        } catch (error) {
            console.error('Error al obtener items de recetas:', error)
            throw new Error('Error al obtener items de recetas')
        }
    }

    static async getById({ id }) {
        try {
            const [items] = await connection.query(
                `SELECT 
                    ir.idItemReceta,
                    BIN_TO_UUID(ir.id_receta) as id_receta,
                    ir.id_insumo,
                    r.nombrePlato,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    ir.cantidadPorPorcion
                 FROM ItemsRecetas ir
                 JOIN Recetas r ON ir.id_receta = r.id_receta
                 JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 WHERE ir.idItemReceta = ?;`,
                [id]
            )
            if (items.length === 0) return null
            return items[0]
        } catch (error) {
            console.error('Error al obtener item de receta:', error)
            throw new Error('Error al obtener item de receta')
        }
    }

    static async create({ input }) {
        const {
            id_receta,
            id_insumo,
            cantidadPorPorcion
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO ItemsRecetas (
                    id_receta, 
                    id_insumo, 
                    cantidadPorPorcion
                ) VALUES (UUID_TO_BIN(?), ?, ?);`,
                [id_receta, id_insumo, cantidadPorPorcion]
            )

            const newId = result.insertId

            return this.getById({ id: newId })
        } catch (error) {
            console.error('Error al crear el item de receta:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Este insumo ya existe en la receta')
            }
            throw new Error('Error al crear el item de receta')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM ItemsRecetas WHERE idItemReceta = ?;`,
                [id]
            )
            return true
        } catch (error) {
            console.error('Error al eliminar item de receta:', error)
            return false
        }
    }

    static async update({ id, input }) {
        const {
            cantidadPorPorcion
        } = input

        try {
            await connection.query(
                `UPDATE ItemsRecetas
                 SET cantidadPorPorcion = ?
                 WHERE idItemReceta = ?;`,
                [cantidadPorPorcion, id]
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar el item de receta:', error)
            throw new Error('Error al actualizar el item de receta')
        }
    }

    static async getByReceta({ id_receta }) {
        try {
            const [items] = await connection.query(
                `SELECT 
                    ir.idItemReceta,
                    BIN_TO_UUID(ir.id_receta) as id_receta,
                    ir.id_insumo,
                    r.nombrePlato,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    ir.cantidadPorPorcion
                 FROM ItemsRecetas ir
                 JOIN Recetas r ON ir.id_receta = r.id_receta
                 JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 WHERE ir.id_receta = UUID_TO_BIN(?)
                 ORDER BY i.nombre;`,
                [id_receta]
            )
            return items
        } catch (error) {
            console.error('Error al obtener items por receta:', error)
            throw new Error('Error al obtener items por receta')
        }
    }

    // Método para calcular el costo total de una receta
    static async getCostoReceta({ id_receta }) {
        try {
            const [costo] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(ir.id_receta) as id_receta,
                    r.nombrePlato,
                    SUM(ir.cantidadPorPorcion * COALESCE(pi.precio, 0)) as costoTotal,
                    COUNT(ir.idItemReceta) as totalInsumos
                 FROM ItemsRecetas ir
                 JOIN Recetas r ON ir.id_receta = r.id_receta
                 JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 LEFT JOIN ProveedorInsumo pi ON i.id_insumo = pi.id_insumo
                 WHERE ir.id_receta = UUID_TO_BIN(?)
                 GROUP BY ir.id_receta, r.nombrePlato;`,
                [id_receta]
            )

            if (costo.length === 0) return null
            return costo[0]
        } catch (error) {
            console.error('Error al calcular costo de receta:', error)
            throw new Error('Error al calcular costo de receta')
        }
    }

    // Método para verificar disponibilidad de insumos para una receta
    static async verificarDisponibilidadInsumos({ id_receta, porciones = 1 }) {
        try {
            const [disponibilidad] = await connection.query(
                `SELECT 
                    ir.idItemReceta,
                    ir.id_insumo,
                    i.nombre as nombreInsumo,
                    ir.cantidadPorPorcion,
                    (ir.cantidadPorPorcion * ?) as cantidadRequerida,
                    inv.cantidadActual,
                    inv.estado as estadoInventario,
                    CASE 
                        WHEN inv.cantidadActual >= (ir.cantidadPorPorcion * ?) THEN 'Disponible'
                        WHEN inv.cantidadActual > 0 THEN 'Insuficiente'
                        ELSE 'No disponible'
                    END as disponibilidad
                 FROM ItemsRecetas ir
                 JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
                 WHERE ir.id_receta = UUID_TO_BIN(?)
                 ORDER BY disponibilidad DESC, i.nombre;`,
                [porciones, porciones, id_receta]
            )
            return disponibilidad
        } catch (error) {
            console.error('Error al verificar disponibilidad de insumos:', error)
            throw new Error('Error al verificar disponibilidad de insumos')
        }
    }
}