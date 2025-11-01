import { connection } from './db.js'

export class PlanificacionMenuModel {
    static async getAll() {
        try {
            const [planificaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 ORDER BY pm.fechaInicio DESC;`
            )
            return planificaciones
        } catch (error) {
            console.error('Error al obtener planificaciones de menú:', error)
            throw new Error('Error al obtener planificaciones de menú')
        }
    }

    static async getById({ id }) {
        try {
            const [planificaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE pm.id_planificacion = UUID_TO_BIN(?);`,
                [id]
            )
            if (planificaciones.length === 0) return null
            return planificaciones[0]
        } catch (error) {
            console.error('Error al obtener planificación de menú:', error)
            throw new Error('Error al obtener planificación de menú')
        }
    }

    static async create({ input }) {
        const {
            id_usuario,
            fechaInicio,
            fechaFin,
            comensalesEstimados = 0,
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO PlanificacionMenus (
                    id_usuario,
                    fechaInicio,
                    fechaFin,
                    comensalesEstimados,
                    estado
                ) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?);`,
                [id_usuario, fechaInicio, fechaFin, comensalesEstimados, estado]
            )

            // Obtener el ID de la planificación creada
            const [newPlan] = await connection.query(
                `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion 
                 FROM PlanificacionMenus 
                 WHERE id_usuario = UUID_TO_BIN(?) AND fechaInicio = ?
                 ORDER BY id_planificacion DESC LIMIT 1;`,
                [id_usuario, fechaInicio]
            )

            return this.getById({ id: newPlan[0].id_planificacion })
        } catch (error) {
            console.error('Error al crear la planificación del menú:', error)
            throw new Error('Error al crear la planificación del menú')
        }
    }

    static async delete({ id }) {
        const conn = await connection.getConnection()

        try {
            await conn.beginTransaction()

            // Eliminar primero las asignaciones de recetas
            await conn.query(
                `DELETE psr FROM PlanificacionServicioReceta psr
                 JOIN JornadaPlanificada jp ON psr.id_jornada = jp.id_jornada
                 WHERE jp.id_planificacion = UUID_TO_BIN(?);`,
                [id]
            )

            // Eliminar jornadas planificadas
            await conn.query(
                `DELETE FROM JornadaPlanificada WHERE id_planificacion = UUID_TO_BIN(?);`,
                [id]
            )

            // Eliminar la planificación
            await conn.query(
                `DELETE FROM PlanificacionMenus WHERE id_planificacion = UUID_TO_BIN(?);`,
                [id]
            )

            await conn.commit()
            return true
        } catch (error) {
            await conn.rollback()
            console.error('Error al eliminar planificación:', error)
            return false
        } finally {
            conn.release()
        }
    }

    static async update({ id, input }) {
        const {
            fechaInicio,
            fechaFin,
            comensalesEstimados,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (fechaInicio !== undefined) {
                updates.push('fechaInicio = ?')
                values.push(fechaInicio)
            }
            if (fechaFin !== undefined) {
                updates.push('fechaFin = ?')
                values.push(fechaFin)
            }
            if (comensalesEstimados !== undefined) {
                updates.push('comensalesEstimados = ?')
                values.push(comensalesEstimados)
            }
            if (estado !== undefined) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE PlanificacionMenus
                 SET ${updates.join(', ')}
                 WHERE id_planificacion = UUID_TO_BIN(?);`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            console.error('Error al actualizar la planificación del menú:', error)
            throw new Error('Error al actualizar la planificación del menú')
        }
    }

    // Método para obtener planificación completa con jornadas
    static async getPlanificacionCompleta({ id }) {
        try {
            const planificacion = await this.getById({ id })
            if (!planificacion) return null

            const [jornadas] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(jp.id_jornada) as id_jornada,
                    BIN_TO_UUID(jp.id_planificacion) as id_planificacion,
                    jp.id_servicio,
                    s.nombreServicio,
                    jp.diaSemana
                 FROM JornadaPlanificada jp
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 WHERE jp.id_planificacion = UUID_TO_BIN(?)
                 ORDER BY 
                    FIELD(jp.diaSemana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'),
                    s.nombreServicio;`,
                [id]
            )

            return {
                ...planificacion,
                jornadas
            }
        } catch (error) {
            console.error('Error al obtener planificación completa:', error)
            throw new Error('Error al obtener planificación completa')
        }
    }

    // Método para crear jornada en la planificación
    static async crearJornada({ input }) {
        const {
            id_planificacion,
            id_servicio,
            diaSemana
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO JornadaPlanificada (
                    id_planificacion,
                    id_servicio,
                    diaSemana
                ) VALUES (UUID_TO_BIN(?), ?, ?);`,
                [id_planificacion, id_servicio, diaSemana]
            )

            const [jornada] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(jp.id_jornada) as id_jornada,
                    BIN_TO_UUID(jp.id_planificacion) as id_planificacion,
                    jp.id_servicio,
                    s.nombreServicio,
                    jp.diaSemana
                 FROM JornadaPlanificada jp
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 WHERE jp.id_planificacion = UUID_TO_BIN(?) 
                   AND jp.id_servicio = ? 
                   AND jp.diaSemana = ?;`,
                [id_planificacion, id_servicio, diaSemana]
            )

            return jornada[0]
        } catch (error) {
            console.error('Error al crear jornada:', error)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una jornada para este día y servicio')
            }
            throw new Error('Error al crear jornada')
        }
    }

    // Método para asignar receta a una jornada
    static async asignarRecetaAJornada({ input }) {
        const {
            id_jornada,
            id_receta
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO PlanificacionServicioReceta (
                    id_recetaAsignada,
                    id_jornada,
                    id_receta
                ) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?));`,
                [id_jornada, id_receta]
            )

            const [asignacion] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    BIN_TO_UUID(psr.id_jornada) as id_jornada,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombrePlato
                 FROM PlanificacionServicioReceta psr
                 JOIN Recetas r ON psr.id_receta = r.id_receta
                 WHERE psr.id_jornada = UUID_TO_BIN(?) AND psr.id_receta = UUID_TO_BIN(?);`,
                [id_jornada, id_receta]
            )

            return asignacion[0]
        } catch (error) {
            console.error('Error al asignar receta a jornada:', error)
            throw new Error('Error al asignar receta a jornada')
        }
    }

    // Método para obtener recetas asignadas a una jornada
    static async getRecetasPorJornada({ id_jornada }) {
        try {
            const [recetas] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    BIN_TO_UUID(psr.id_jornada) as id_jornada,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombrePlato,
                    r.descripcion
                 FROM PlanificacionServicioReceta psr
                 JOIN Recetas r ON psr.id_receta = r.id_receta
                 WHERE psr.id_jornada = UUID_TO_BIN(?)
                 ORDER BY r.nombrePlato;`,
                [id_jornada]
            )
            return recetas
        } catch (error) {
            console.error('Error al obtener recetas por jornada:', error)
            throw new Error('Error al obtener recetas por jornada')
        }
    }

    // Método para obtener planificaciones por usuario
    static async getByUsuario({ id_usuario }) {
        try {
            const [planificaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE pm.id_usuario = UUID_TO_BIN(?)
                 ORDER BY pm.fechaInicio DESC;`,
                [id_usuario]
            )
            return planificaciones
        } catch (error) {
            console.error('Error al obtener planificaciones por usuario:', error)
            throw new Error('Error al obtener planificaciones por usuario')
        }
    }

    // Método para obtener planificaciones por estado
    static async getByEstado({ estado }) {
        try {
            const [planificaciones] = await connection.query(
                `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE pm.estado = ?
                 ORDER BY pm.fechaInicio DESC;`,
                [estado]
            )
            return planificaciones
        } catch (error) {
            console.error('Error al obtener planificaciones por estado:', error)
            throw new Error('Error al obtener planificaciones por estado')
        }
    }

    // Método para finalizar una planificación
    static async finalizar({ id }) {
        try {
            await connection.query(
                `UPDATE PlanificacionMenus
                 SET estado = 'Finalizado'
                 WHERE id_planificacion = UUID_TO_BIN(?);`,
                [id]
            )
            return this.getById({ id })
        } catch (error) {
            console.error('Error al finalizar planificación:', error)
            throw new Error('Error al finalizar planificación')
        }
    }
}