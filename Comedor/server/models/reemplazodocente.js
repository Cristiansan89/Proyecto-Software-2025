import { connection } from './db.js'

export class ReemplazoDocenteModel {
    static async getAll() {
        const [reemplazos] = await connection.query(
            `SELECT 
                BIN_TO_UUID(rd.id_reemplazoDocente) as idReemplazoDocente,
                rd.id_persona as idPersona,
                rd.id_docenteTitular as idDocenteTitular,
                rd.nombreGrado,
                rd.cicloLectivo,
                rd.fechaInicio,
                rd.fechaFin,
                rd.motivo,
                rd.estado,
                p.nombre as nombreSuplente,
                p.apellido as apellidoSuplente,
                p.dni as dniSuplente,
                pt.nombre as nombreTitular,
                pt.apellido as apellidoTitular,
                pt.dni as dniTitular
             FROM ReemplazoDocente rd
             JOIN Personas p ON rd.id_persona = p.id_persona
             JOIN DocenteGrado dg ON rd.id_docenteTitular = dg.id_docenteTitular 
                                  AND rd.nombreGrado = dg.nombreGrado
             JOIN Personas pt ON dg.id_persona = pt.id_persona
             ORDER BY rd.fechaInicio DESC, rd.nombreGrado;`
        )
        return reemplazos
    }

    static async getById({ id }) {
        const [reemplazos] = await connection.query(
            `SELECT 
                BIN_TO_UUID(rd.id_reemplazoDocente) as idReemplazoDocente,
                rd.id_persona as idPersona,
                rd.id_docenteTitular as idDocenteTitular,
                rd.nombreGrado,
                rd.cicloLectivo,
                rd.fechaInicio,
                rd.fechaFin,
                rd.motivo,
                rd.estado,
                p.nombre as nombreSuplente,
                p.apellido as apellidoSuplente,
                p.dni as dniSuplente,
                pt.nombre as nombreTitular,
                pt.apellido as apellidoTitular,
                pt.dni as dniTitular
             FROM ReemplazoDocente rd
             JOIN Personas p ON rd.id_persona = p.id_persona
             JOIN DocenteGrado dg ON rd.id_docenteTitular = dg.id_docenteTitular 
                                  AND rd.nombreGrado = dg.nombreGrado
             JOIN Personas pt ON dg.id_persona = pt.id_persona
             WHERE rd.id_reemplazoDocente = UUID_TO_BIN(?);`,
            [id]
        )
        if (reemplazos.length === 0) return null
        return reemplazos[0]
    }

    static async getByGrado({ nombreGrado }) {
        const [reemplazos] = await connection.query(
            `SELECT 
                BIN_TO_UUID(rd.id_reemplazoDocente) as idReemplazoDocente,
                rd.id_persona as idPersona,
                rd.id_docenteTitular as idDocenteTitular,
                rd.nombreGrado,
                rd.cicloLectivo,
                rd.fechaInicio,
                rd.fechaFin,
                rd.motivo,
                rd.estado,
                p.nombre as nombreSuplente,
                p.apellido as apellidoSuplente,
                p.dni as dniSuplente,
                pt.nombre as nombreTitular,
                pt.apellido as apellidoTitular,
                pt.dni as dniTitular
             FROM ReemplazoDocente rd
             JOIN Personas p ON rd.id_persona = p.id_persona
             JOIN DocenteGrado dg ON rd.id_docenteTitular = dg.id_docenteTitular 
                                  AND rd.nombreGrado = dg.nombreGrado
             JOIN Personas pt ON dg.id_persona = pt.id_persona
             WHERE rd.nombreGrado = ?
             ORDER BY rd.fechaInicio DESC;`,
            [nombreGrado]
        )
        return reemplazos
    }

    static async create({ input }) {
        const {
            idPersona,
            idDocenteTitular,
            nombreGrado,
            cicloLectivo = new Date().getFullYear(),
            fechaInicio,
            fechaFin = null,
            motivo,
            estado = 'Activo'
        } = input

        try {
            // Verificar que la persona tenga rol de Docente Suplente
            const [persona] = await connection.query(
                `SELECT p.id_persona, r.nombreRol 
                 FROM Personas p 
                 JOIN Roles r ON p.nombreRol = r.nombreRol
                 WHERE p.id_persona = ? AND r.nombreRol = 'Docente Suplente';`,
                [idPersona]
            )

            if (persona.length === 0) {
                throw new Error('La persona seleccionada no tiene el rol de Docente Suplente')
            }

            // Convertir el año a una fecha completa para la base de datos
            const fechaCiclo = `${cicloLectivo}-01-01`;

            // Verificar que existe el docente titular en el grado especificado
            const [docenteTitular] = await connection.query(
                `SELECT id_docenteTitular, id_persona, nombreGrado 
                 FROM DocenteGrado 
                 WHERE id_docenteTitular = ? AND nombreGrado = ? AND cicloLectivo = ?;`,
                [idDocenteTitular, nombreGrado, fechaCiclo]
            )

            if (docenteTitular.length === 0) {
                throw new Error('No existe un docente titular asignado a este grado para el ciclo lectivo especificado')
            }

            // Verificar que no haya un reemplazo activo en las mismas fechas
            const [existingReemplazo] = await connection.query(
                `SELECT BIN_TO_UUID(id_reemplazoDocente) as id
                 FROM ReemplazoDocente 
                 WHERE id_docenteTitular = ? 
                   AND nombreGrado = ? 
                   AND cicloLectivo = ?
                   AND estado = 'Activo'
                   AND (
                       (fechaInicio <= ? AND (fechaFin IS NULL OR fechaFin >= ?))
                       OR (fechaInicio <= ? AND (fechaFin IS NULL OR fechaFin >= ?))
                   );`,
                [idDocenteTitular, nombreGrado, fechaCiclo, fechaInicio, fechaInicio, fechaFin || fechaInicio, fechaFin || fechaInicio]
            )

            if (existingReemplazo.length > 0) {
                throw new Error('Ya existe un reemplazo activo para este docente en el período especificado')
            }

            const [result] = await connection.query(
                `INSERT INTO ReemplazoDocente (id_persona, id_docenteTitular, nombreGrado, cicloLectivo, fechaInicio, fechaFin, motivo, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
                [idPersona, idDocenteTitular, nombreGrado, fechaCiclo, fechaInicio, fechaFin, motivo, estado]
            )

            // Obtener el UUID generado
            const [newReemplazo] = await connection.query(
                `SELECT BIN_TO_UUID(id_reemplazoDocente) as id 
                 FROM ReemplazoDocente 
                 WHERE id_reemplazoDocente = LAST_INSERT_ID();`
            )

            return this.getById({ id: newReemplazo[0].id })
        } catch (error) {
            console.error('ReemplazoDocenteModel: Error al crear reemplazo:', error);
            throw new Error('Error al crear el reemplazo: ' + error.message)
        }
    }

    static async delete({ id }) {
        try {
            const [result] = await connection.query(
                `DELETE FROM ReemplazoDocente WHERE id_reemplazoDocente = UUID_TO_BIN(?);`,
                [id]
            )
            return result.affectedRows > 0
        } catch (error) {
            console.error('ReemplazoDocenteModel: Error en DELETE:', error)
            throw error
        }
    }

    static async update({ id, input }) {
        const {
            idPersona,
            fechaInicio,
            fechaFin,
            motivo,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (idPersona) {
                // Verificar que la persona tenga rol de Docente Suplente
                const [persona] = await connection.query(
                    `SELECT p.id_persona, r.nombreRol 
                     FROM Personas p 
                     JOIN Roles r ON p.nombreRol = r.nombreRol
                     WHERE p.id_persona = ? AND r.nombreRol = 'Docente Suplente';`,
                    [idPersona]
                )

                if (persona.length === 0) {
                    throw new Error('La persona seleccionada no tiene el rol de Docente Suplente')
                }

                updates.push('id_persona = ?')
                values.push(idPersona)
            }

            if (fechaInicio) {
                updates.push('fechaInicio = ?')
                values.push(fechaInicio)
            }

            if (fechaFin !== undefined) {
                updates.push('fechaFin = ?')
                values.push(fechaFin)
            }

            if (motivo) {
                updates.push('motivo = ?')
                values.push(motivo)
            }

            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE ReemplazoDocente
                 SET ${updates.join(', ')}
                 WHERE id_reemplazoDocente = UUID_TO_BIN(?);`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al actualizar el reemplazo: ' + error.message)
        }
    }

    // Obtener docentes suplentes disponibles
    static async getDocentesSupletesDisponibles() {
        const [suplentes] = await connection.query(
            `SELECT 
                p.id_persona as idPersona,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado
             FROM Personas p
             JOIN Roles r ON p.nombreRol = r.nombreRol
             WHERE r.nombreRol = 'Docente Suplente' 
               AND p.estado = 'Activo'
             ORDER BY p.apellido, p.nombre;`
        )
        return suplentes
    }

    // Obtener docentes titulares que pueden ser reemplazados
    static async getDocentesTitulares({ cicloLectivo = new Date().getFullYear() }) {
        // Convertir el año a una fecha completa para la comparación con DATE
        const fechaCiclo = `${cicloLectivo}-01-01`;

        const [titulares] = await connection.query(
            `SELECT 
                dg.id_docenteTitular as idDocenteTitular,
                dg.id_persona as idPersona,
                dg.nombreGrado,
                dg.fechaAsignado,
                dg.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni
             FROM DocenteGrado dg
             JOIN Personas p ON dg.id_persona = p.id_persona
             WHERE dg.cicloLectivo = ?
               AND p.estado = 'Activo'
             ORDER BY dg.nombreGrado, p.apellido, p.nombre;`,
            [fechaCiclo]
        )
        return titulares
    }

    // Finalizar un reemplazo
    static async finalizarReemplazo({ id, fechaFin = new Date().toISOString().split('T')[0] }) {
        try {
            await connection.query(
                `UPDATE ReemplazoDocente
                 SET estado = 'Finalizado', fechaFin = ?
                 WHERE id_reemplazoDocente = UUID_TO_BIN(?);`,
                [fechaFin, id]
            )

            return this.getById({ id })
        } catch (error) {
            throw new Error('Error al finalizar el reemplazo: ' + error.message)
        }
    }
}