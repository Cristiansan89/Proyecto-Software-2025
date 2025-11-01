import { connection } from './db.js'

export class RecetaModel {
    static async getAll() {
        try {
            const [recetas] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.id_servicio,
                    s.nombreServicio,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.fechaAlta,
                    r.estado
                 FROM Recetas r
                 JOIN Servicios s ON r.id_servicio = s.id_servicio
                 ORDER BY r.nombreReceta;`
            )
            return recetas
        } catch (error) {
            console.error('Error al obtener recetas:', error)
            throw new Error('Error al obtener recetas')
        }
    }

    static async getById({ id }) {
        try {
            const [recetas] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    r.id_servicio,
                    s.nombreServicio,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.fechaAlta,
                    r.estado
                 FROM Recetas r
                 JOIN Servicios s ON r.id_servicio = s.id_servicio
                 WHERE r.id_receta = UUID_TO_BIN(?);`,
                [id]
            )
            if (recetas.length === 0) return null
            return recetas[0]
        } catch (error) {
            console.error('Error al obtener receta:', error)
            throw new Error('Error al obtener receta')
        }
    }

    static async create({ input }) {
        const {
            id_servicio,
            nombreReceta,
            instrucciones,
            unidadSalida = 'Porcion',
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Recetas (
                    id_servicio,
                    nombreReceta,
                    instrucciones,
                    unidadSalida,
                    estado
                ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?);`,
                [id_servicio, nombreReceta, instrucciones, unidadSalida, estado]
            )

            const [newReceta] = await connection.query(
                `SELECT BIN_TO_UUID(id_receta) as id_receta 
                 FROM Recetas 
                 WHERE nombreReceta = ? AND id_servicio = UUID_TO_BIN(?)
                 ORDER BY fecha_creacion DESC LIMIT 1;`,
                [nombreReceta, id_servicio]
            )

            return this.getById({ id: newReceta[0].id_receta })
        } catch (error) {
            console.error('Error al crear la receta:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una receta con este nombre para este servicio')
            }
            throw new Error('Error al crear la receta')
        }
    }

    static async delete({ id }) {
        const conn = await connection.getConnection()

        try {
            await conn.beginTransaction()

            // Eliminar primero los items de la receta
            await conn.query(
                `DELETE FROM ItemsRecetas WHERE id_receta = UUID_TO_BIN(?);`,
                [id]
            )

            // Eliminar asignaciones en planificaciones
            await conn.query(
                `DELETE FROM PlanificacionServicioReceta WHERE id_receta = UUID_TO_BIN(?);`,
                [id]
            )

            // Eliminar la receta
            await conn.query(
                `DELETE FROM Recetas WHERE id_receta = UUID_TO_BIN(?);`,
                [id]
            )

            await conn.commit()
            return true
        } catch (error) {
            await conn.rollback()
            console.error('Error al eliminar receta:', error)
            return false
        } finally {
            conn.release()
        }
    }

    static async update({ id, id_servicio, nombreReceta, instrucciones, unidadSalida, estado }) {
        try {
            await connection.query(
                `UPDATE Recetas
                 SET id_servicio = UUID_TO_BIN(?), nombreReceta = ?, instrucciones = ?, unidadSalida = ?, estado = ?
                 WHERE id_receta = UUID_TO_BIN(?);`,
                [id_servicio, nombreReceta, instrucciones, unidadSalida, estado, id]
            )
            return true
        } catch (error) {
            console.error('Error al actualizar receta:', error)
            return false
        }
    }

    static async updateEstado({ id, estado }) {
        try {
            await connection.query(
                `UPDATE Recetas
                 SET estado = ?
                 WHERE id_receta = UUID_TO_BIN(?);`,
                [estado, id]
            )
            return true
        } catch (error) {
            console.error('Error al actualizar estado de receta:', error)
            return false
        }
    }

    // Métodos para gestión de ingredientes de recetas
    static async getRecetaWithInsumos({ id }) {
        try {
            const [recetaRows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    BIN_TO_UUID(r.id_servicio) as id_servicio,
                    s.nombreServicio,
                    r.nombreReceta,
                    r.instrucciones,
                    r.unidadSalida,
                    r.estado,
                    r.fecha_creacion,
                    r.fecha_actualizacion
                 FROM Recetas r
                 LEFT JOIN Servicios s ON r.id_servicio = s.id_servicio
                 WHERE r.id_receta = UUID_TO_BIN(?);`,
                [id]
            )

            if (recetaRows.length === 0) return null

            const receta = recetaRows[0]

            const [insumosRows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(ir.id_item) as id_item,
                    BIN_TO_UUID(ir.id_receta) as id_receta,
                    BIN_TO_UUID(ir.id_insumo) as id_insumo,
                    i.nombreInsumo,
                    i.unidadMedida,
                    ir.cantidadUtilizar,
                    ir.observaciones
                 FROM ItemsRecetas ir
                 INNER JOIN Insumos i ON ir.id_insumo = i.id_insumo
                 WHERE ir.id_receta = UUID_TO_BIN(?);`,
                [id]
            )

            receta.insumos = insumosRows
            return receta
        } catch (error) {
            console.error('Error al obtener receta con insumos:', error)
            return null
        }
    }

    static async getRecetasByServicio({ id_servicio }) {
        try {
            const [rows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    BIN_TO_UUID(r.id_servicio) as id_servicio,
                    s.nombreServicio,
                    r.nombreReceta,
                    r.unidadSalida,
                    r.estado,
                    r.fecha_creacion
                 FROM Recetas r
                 INNER JOIN Servicios s ON r.id_servicio = s.id_servicio
                 WHERE r.id_servicio = UUID_TO_BIN(?)
                 ORDER BY r.nombreReceta;`,
                [id_servicio]
            )
            return rows
        } catch (error) {
            console.error('Error al obtener recetas por servicio:', error)
            return []
        }
    }

    static async getRecetasActivas() {
        try {
            const [rows] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(r.id_receta) as id_receta,
                    BIN_TO_UUID(r.id_servicio) as id_servicio,
                    s.nombreServicio,
                    r.nombreReceta,
                    r.unidadSalida,
                    r.estado,
                    r.fecha_creacion
                 FROM Recetas r
                 INNER JOIN Servicios s ON r.id_servicio = s.id_servicio
                 WHERE r.estado = 'Activo'
                 ORDER BY s.nombreServicio, r.nombreReceta;`
            )
            return rows
        } catch (error) {
            console.error('Error al obtener recetas activas:', error)
            return []
        }
    }
}