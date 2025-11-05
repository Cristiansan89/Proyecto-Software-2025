import { connection } from './db.js'

export class ServicioTurnoModel {
    // Obtener todas las relaciones servicio-turno
    static async getAll() {
        const [relaciones] = await connection.query(
            `SELECT 
                st.id_servicio as idServicio,
                st.id_turno as idTurno,
                st.fechaAsociacion,
                s.nombre as nombreServicio,
                s.descripcion as descripcionServicio,
                s.estado as estadoServicio,
                t.nombre as nombreTurno,
                t.horaInicio,
                t.horaFin,
                t.estado as estadoTurno
             FROM ServicioTurno st
             JOIN Servicios s ON st.id_servicio = s.id_servicio
             JOIN Turnos t ON st.id_turno = t.id_turno
             ORDER BY s.nombre, t.nombre;`
        )
        return relaciones
    }

    // Obtener turnos asociados a un servicio específico
    static async getTurnosByServicio({ idServicio }) {
        const [turnos] = await connection.query(
            `SELECT 
                st.id_turno as idTurno,
                st.fechaAsociacion,
                t.nombre as nombreTurno,
                t.horaInicio,
                t.horaFin,
                t.estado as estadoTurno
             FROM ServicioTurno st
             JOIN Turnos t ON st.id_turno = t.id_turno
             WHERE st.id_servicio = ?
             ORDER BY t.nombre;`,
            [idServicio]
        )
        return turnos
    }

    // Obtener servicios asociados a un turno específico
    static async getServiciosByTurno({ idTurno }) {
        const [servicios] = await connection.query(
            `SELECT 
                st.id_servicio as idServicio,
                st.fechaAsociacion,
                s.nombre as nombreServicio,
                s.descripcion as descripcionServicio,
                s.estado as estadoServicio
             FROM ServicioTurno st
             JOIN Servicios s ON st.id_servicio = s.id_servicio
             WHERE st.id_turno = ?
             ORDER BY s.nombre;`,
            [idTurno]
        )
        return servicios
    }

    // Crear una relación servicio-turno
    static async create({ input }) {
        const {
            idServicio,
            idTurno,
            fechaAsociacion = new Date().toISOString().split('T')[0]
        } = input

        try {
            // Verificar que el servicio existe
            const [servicio] = await connection.query(
                `SELECT id_servicio, nombre FROM Servicios WHERE id_servicio = ? AND estado = 'Activo';`,
                [idServicio]
            )

            if (servicio.length === 0) {
                throw new Error('El servicio seleccionado no existe o está inactivo')
            }

            // Verificar que el turno existe
            const [turno] = await connection.query(
                `SELECT id_turno, nombre FROM Turnos WHERE id_turno = ? AND estado = 'Activo';`,
                [idTurno]
            )

            if (turno.length === 0) {
                throw new Error('El turno seleccionado no existe o está inactivo')
            }

            // Verificar que la relación no existe ya
            const [existing] = await connection.query(
                `SELECT id_servicio, id_turno FROM ServicioTurno 
                 WHERE id_servicio = ? AND id_turno = ?;`,
                [idServicio, idTurno]
            )

            if (existing.length > 0) {
                throw new Error('Esta relación servicio-turno ya existe')
            }

            // Crear la relación
            await connection.query(
                `INSERT INTO ServicioTurno (id_servicio, id_turno, fechaAsociacion)
                 VALUES (?, ?, ?);`,
                [idServicio, idTurno, fechaAsociacion]
            )

            return this.getRelacion({ idServicio, idTurno })
        } catch (error) {
            console.error('ServicioTurnoModel: Error al crear relación:', error);
            throw new Error('Error al asociar servicio con turno: ' + error.message)
        }
    }

    // Eliminar una relación servicio-turno
    static async delete({ idServicio, idTurno }) {
        try {
            const [result] = await connection.query(
                `DELETE FROM ServicioTurno 
                 WHERE id_servicio = ? AND id_turno = ?;`,
                [idServicio, idTurno]
            )
            return result.affectedRows > 0
        } catch (error) {
            console.error('ServicioTurnoModel: Error en DELETE:', error)
            throw error
        }
    }

    // Obtener una relación específica
    static async getRelacion({ idServicio, idTurno }) {
        const [relacion] = await connection.query(
            `SELECT 
                st.id_servicio as idServicio,
                st.id_turno as idTurno,
                st.fechaAsociacion,
                s.nombre as nombreServicio,
                s.descripcion as descripcionServicio,
                s.estado as estadoServicio,
                t.nombre as nombreTurno,
                t.horaInicio,
                t.horaFin,
                t.estado as estadoTurno
             FROM ServicioTurno st
             JOIN Servicios s ON st.id_servicio = s.id_servicio
             JOIN Turnos t ON st.id_turno = t.id_turno
             WHERE st.id_servicio = ? AND st.id_turno = ?;`,
            [idServicio, idTurno]
        )
        if (relacion.length === 0) return null
        return relacion[0]
    }

    // Eliminar todas las relaciones de un servicio
    static async deleteByServicio({ idServicio }) {
        try {
            const [result] = await connection.query(
                `DELETE FROM ServicioTurno WHERE id_servicio = ?;`,
                [idServicio]
            )
            return result.affectedRows
        } catch (error) {
            console.error('ServicioTurnoModel: Error al eliminar relaciones del servicio:', error)
            throw error
        }
    }

    // Eliminar todas las relaciones de un turno
    static async deleteByTurno({ idTurno }) {
        try {
            const [result] = await connection.query(
                `DELETE FROM ServicioTurno WHERE id_turno = ?;`,
                [idTurno]
            )
            return result.affectedRows
        } catch (error) {
            console.error('ServicioTurnoModel: Error al eliminar relaciones del turno:', error)
            throw error
        }
    }
}