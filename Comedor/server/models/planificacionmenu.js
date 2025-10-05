import { connection } from './db.js'

export class PlanificacionMenuModel {
    static async getAll() {
        const [planificaciones] = await connection.query(
            `SELECT 
                pm.id_planificacion as idPlanificacion,
                pm.fecha, 
                pm.tipoComida, 
                pm.cantidadEstimada,
                GROUP_CONCAT(pr.id_receta) as idRecetas,
                GROUP_CONCAT(r.nombrePlato) as nombresRecetas
             FROM Planificaciones_Menu pm
             LEFT JOIN Planificacion_Recetas pr ON pm.id_planificacion = pr.id_planificacion
             LEFT JOIN Recetas r ON pr.id_receta = r.id_receta
             GROUP BY pm.id_planificacion;`
        )
        return planificaciones.map(p => ({
            ...p,
            idRecetas: p.idRecetas ? p.idRecetas.split(',') : [],
            nombresRecetas: p.nombresRecetas ? p.nombresRecetas.split(',') : []
        }))
    }

    static async getById({ id }) {
        const [planificaciones] = await connection.query(
            `SELECT 
                pm.id_planificacion as idPlanificacion,
                pm.fecha, 
                pm.tipoComida, 
                pm.cantidadEstimada,
                GROUP_CONCAT(pr.id_receta) as idRecetas,
                GROUP_CONCAT(r.nombrePlato) as nombresRecetas
             FROM Planificaciones_Menu pm
             LEFT JOIN Planificacion_Recetas pr ON pm.id_planificacion = pr.id_planificacion
             LEFT JOIN Recetas r ON pr.id_receta = r.id_receta
             WHERE pm.id_planificacion = ?
             GROUP BY pm.id_planificacion;`,
            [id]
        )
        if (planificaciones.length === 0) return null

        const planificacion = planificaciones[0]
        return {
            ...planificacion,
            idRecetas: planificacion.idRecetas ? planificacion.idRecetas.split(',') : [],
            nombresRecetas: planificacion.nombresRecetas ? planificacion.nombresRecetas.split(',') : []
        }
    }

    static async create({ input }) {
        const {
            fecha,
            tipoComida,
            cantidadEstimada,
            recetas = []
        } = input

        try {
            await connection.query('START TRANSACTION;')

            // Insertar planificación
            await connection.query(
                `INSERT INTO Planificaciones_Menu (
                    id_planificacion, 
                    fecha, 
                    tipoComida, 
                    cantidadEstimada
                ) VALUES (UUID(), ?, ?, ?);`,
                [fecha, tipoComida, cantidadEstimada]
            )

            // Obtener el ID de la planificación creada
            const [newPlan] = await connection.query(
                `SELECT id_planificacion as idPlanificacion 
                 FROM Planificaciones_Menu 
                 WHERE fecha = ? AND tipoComida = ? 
                 ORDER BY id_planificacion DESC LIMIT 1;`,
                [fecha, tipoComida]
            )

            // Insertar recetas si existen
            if (recetas.length > 0) {
                const recetasValues = recetas.map(idReceta =>
                    `('${newPlan[0].idPlanificacion}', '${idReceta}')`
                ).join(',')

                await connection.query(
                    `INSERT INTO Planificacion_Recetas (id_planificacion, id_receta)
                     VALUES ${recetasValues};`
                )
            }

            await connection.query('COMMIT;')
            return this.getById({ id: newPlan[0].idPlanificacion })
        } catch (error) {
            await connection.query('ROLLBACK;')
            throw new Error('Error al crear la planificación del menú')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Planificaciones_Menu
                 WHERE id_planificacion = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            fecha,
            tipoComida,
            cantidadEstimada,
            recetas
        } = input

        try {
            await connection.query('START TRANSACTION;')

            // Actualizar datos principales si existen cambios
            if (fecha || tipoComida || cantidadEstimada) {
                const updates = []
                const values = []

                if (fecha) {
                    updates.push('fecha = ?')
                    values.push(fecha)
                }
                if (tipoComida) {
                    updates.push('tipoComida = ?')
                    values.push(tipoComida)
                }
                if (cantidadEstimada) {
                    updates.push('cantidadEstimada = ?')
                    values.push(cantidadEstimada)
                }

                await connection.query(
                    `UPDATE Planificaciones_Menu
                     SET ${updates.join(', ')}
                     WHERE id_planificacion = ?;`,
                    [...values, id]
                )
            }

            // Actualizar recetas si se proporcionan
            if (recetas) {
                await connection.query(
                    `DELETE FROM Planificacion_Recetas
                     WHERE id_planificacion = ?;`,
                    [id]
                )

                if (recetas.length > 0) {
                    const recetasValues = recetas.map(idReceta =>
                        `('${id}', '${idReceta}')`
                    ).join(',')

                    await connection.query(
                        `INSERT INTO Planificacion_Recetas (id_planificacion, id_receta)
                         VALUES ${recetasValues};`
                    )
                }
            }

            await connection.query('COMMIT;')
            return this.getById({ id })
        } catch (error) {
            await connection.query('ROLLBACK;')
            throw new Error('Error al actualizar la planificación del menú')
        }
    }
}