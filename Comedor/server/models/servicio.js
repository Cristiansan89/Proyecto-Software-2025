import { connection } from './db.js'

export class ServicioModel {
    static async getAll() {
        const [servicios] = await connection.query(
            `SELECT 
                id_servicio as idServicio,
                nombre,
                descripcion,
                fechaAlta,
                fecha_modificacion as fechaModificacion,
                estado
             FROM Servicios
             ORDER BY nombre;`
        )
        return servicios
    }

    static async getById({ id }) {
        const [servicios] = await connection.query(
            `SELECT 
                id_servicio as idServicio,
                nombre,
                descripcion,
                fechaAlta,
                fecha_modificacion as fechaModificacion,
                estado
             FROM Servicios
             WHERE id_servicio = ?;`,
            [id]
        )
        if (servicios.length === 0) return null
        return servicios[0]
    }

    static async create({ input }) {
        const {
            nombre,
            descripcion,
            estado = 'Activo'
        } = input

        try {
            const [result] = await connection.query(
                `INSERT INTO Servicios (nombre, descripcion, estado)
                 VALUES (?, ?, ?);`,
                [nombre, descripcion, estado]
            )

            return this.getById({ id: result.insertId })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un servicio con ese nombre')
            }
            throw new Error('Error al crear el servicio')
        }
    }

    static async delete({ id }) {
        try {
            console.log('ServicioModel: Ejecutando DELETE para ID:', id)
            const [result] = await connection.query(
                `DELETE FROM Servicios
                 WHERE id_servicio = ?;`,
                [id]
            )
            console.log('ServicioModel: Resultado de DELETE:', result)
            console.log('ServicioModel: Filas afectadas:', result.affectedRows)

            // Verificar si se eliminó alguna fila
            return result.affectedRows > 0
        } catch (error) {
            console.error('ServicioModel: Error en DELETE:', error)
            throw error
        }
    }

    static async update({ id, input }) {
        const {
            nombre,
            descripcion,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (nombre) {
                updates.push('nombre = ?')
                values.push(nombre)
            }
            if (descripcion) {
                updates.push('descripcion = ?')
                values.push(descripcion)
            }
            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fecha_modificacion = NOW()')
            values.push(id)

            await connection.query(
                `UPDATE Servicios
                 SET ${updates.join(', ')}
                 WHERE id_servicio = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un servicio con ese nombre')
            }
            throw new Error('Error al actualizar el servicio')
        }
    }

    static async getActivos() {
        const [servicios] = await connection.query(
            `SELECT 
                id_servicio as idServicio,
                nombre,
                descripcion
             FROM Servicios
             WHERE estado = 'Activo'
             ORDER BY nombre;`
        )
        return servicios
    }

    static async getConTurnos() {
        const [servicios] = await connection.query(
            `SELECT DISTINCT
                s.id_servicio as idServicio,
                s.nombre,
                s.descripcion,
                GROUP_CONCAT(
                    CONCAT(t.nombre, ' (', t.horaInicio, ' - ', t.horaFin, ')')
                    ORDER BY t.horaInicio SEPARATOR ', '
                ) as turnos
             FROM Servicios s
             JOIN ServicioTurno st ON s.id_servicio = st.id_servicio
             JOIN Turnos t ON st.id_turno = t.id_turno
             WHERE s.estado = 'Activo' AND t.estado = 'Activo'
             GROUP BY s.id_servicio, s.nombre, s.descripcion
             ORDER BY s.nombre;`
        )
        return servicios
    }
}