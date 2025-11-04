import { connection } from './db.js'

export class DocenteGradoModel {
    static async getAll() {
        const [docentes] = await connection.query(
            `SELECT 
                dg.id_docenteTitular as idDocenteTitular,
                dg.id_persona as idPersona,
                dg.nombreGrado,
                dg.fechaAsignado,
                dg.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado as estadoPersona,
                g.id_grado as idGrado,
                g.estado as estadoGrado
             FROM DocenteGrado dg
             JOIN Personas p ON dg.id_persona = p.id_persona
             LEFT JOIN Grados g ON dg.nombreGrado = g.nombreGrado
             ORDER BY dg.nombreGrado, p.apellido, p.nombre;`
        )
        return docentes
    }

    static async getById({ idDocenteTitular, idPersona, nombreGrado }) {
        const [docentes] = await connection.query(
            `SELECT 
                dg.id_docenteTitular as idDocenteTitular,
                dg.id_persona as idPersona,
                dg.nombreGrado,
                dg.fechaAsignado,
                dg.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado as estadoPersona,
                g.id_grado as idGrado,
                g.estado as estadoGrado
             FROM DocenteGrado dg
             JOIN Personas p ON dg.id_persona = p.id_persona
             LEFT JOIN Grados g ON dg.nombreGrado = g.nombreGrado
             WHERE dg.id_docenteTitular = ? AND dg.id_persona = ? AND dg.nombreGrado = ?;`,
            [idDocenteTitular, idPersona, nombreGrado]
        )
        if (docentes.length === 0) return null
        return docentes[0]
    }

    static async getByGrado({ nombreGrado }) {
        const [docentes] = await connection.query(
            `SELECT 
                dg.id_docenteTitular as idDocenteTitular,
                dg.id_persona as idPersona,
                dg.nombreGrado,
                dg.fechaAsignado,
                dg.cicloLectivo,
                p.nombre,
                p.apellido,
                p.dni,
                p.fechaNacimiento,
                p.genero,
                p.estado as estadoPersona
             FROM DocenteGrado dg
             JOIN Personas p ON dg.id_persona = p.id_persona
             WHERE dg.nombreGrado = ?
             ORDER BY dg.fechaAsignado DESC;`,
            [nombreGrado]
        )
        return docentes
    }

    static async create({ input }) {
        const {
            idPersona,
            nombreGrado,
            fechaAsignado = new Date().toISOString().split('T')[0],
            cicloLectivo = new Date().getFullYear()
        } = input

        try {
            // Convertir el año a una fecha completa para la base de datos
            const fechaCiclo = `${cicloLectivo}-01-01`;

            // Verificar que la persona tenga rol de Docente
            const [persona] = await connection.query(
                `SELECT p.id_persona, r.nombreRol 
                 FROM Personas p 
                 JOIN Roles r ON p.nombreRol = r.nombreRol
                 WHERE p.id_persona = ? AND r.nombreRol = 'Docente';`,
                [idPersona]
            )

            if (persona.length === 0) {
                throw new Error('La persona seleccionada no tiene el rol de Docente')
            }

            // Verificar que el grado existe
            const [grado] = await connection.query(
                `SELECT nombreGrado FROM Grados WHERE nombreGrado = ? AND estado = 'Activo';`,
                [nombreGrado]
            )

            if (grado.length === 0) {
                throw new Error('El grado seleccionado no existe o está inactivo')
            }

            // Verificar que el grado no tenga ya un docente asignado
            const [existingDocente] = await connection.query(
                `SELECT id_docenteTitular FROM DocenteGrado 
                 WHERE nombreGrado = ? AND cicloLectivo = ?;`,
                [nombreGrado, fechaCiclo]
            )

            if (existingDocente.length > 0) {
                throw new Error('Este grado ya tiene un docente asignado para el ciclo lectivo actual')
            }

            // Generar un nuevo ID para docente titular
            const [maxId] = await connection.query(
                `SELECT COALESCE(MAX(id_docenteTitular), 0) + 1 as nextId FROM DocenteGrado;`
            )
            const idDocenteTitular = maxId[0].nextId

            const [result] = await connection.query(
                `INSERT INTO DocenteGrado (id_docenteTitular, id_persona, nombreGrado, fechaAsignado, cicloLectivo)
                 VALUES (?, ?, ?, ?, ?);`,
                [idDocenteTitular, idPersona, nombreGrado, fechaAsignado, fechaCiclo]
            )

            return this.getById({ idDocenteTitular, idPersona, nombreGrado })
        } catch (error) {
            console.error('DocenteGradoModel: Error al crear asignación:', error);
            throw new Error('Error al asignar docente al grado: ' + error.message)
        }
    }

    static async delete({ idDocenteTitular, idPersona, nombreGrado }) {
        try {
            const [result] = await connection.query(
                `DELETE FROM DocenteGrado 
                 WHERE id_docenteTitular = ? AND id_persona = ? AND nombreGrado = ?;`,
                [idDocenteTitular, idPersona, nombreGrado]
            )
            return result.affectedRows > 0
        } catch (error) {
            console.error('DocenteGradoModel: Error en DELETE:', error)
            throw error
        }
    }

    static async update({ idDocenteTitular, idPersona, nombreGrado, input }) {
        const {
            newIdPersona,
            newNombreGrado,
            fechaAsignado,
            cicloLectivo
        } = input

        try {
            const updates = []
            const values = []

            if (newIdPersona && newIdPersona !== idPersona) {
                // Verificar que la nueva persona tenga rol de Docente
                const [persona] = await connection.query(
                    `SELECT p.id_persona, r.nombreRol 
                     FROM Personas p 
                     JOIN Roles r ON p.nombreRol = r.nombreRol
                     WHERE p.id_persona = ? AND r.nombreRol = 'Docente';`,
                    [newIdPersona]
                )

                if (persona.length === 0) {
                    throw new Error('La persona seleccionada no tiene el rol de Docente')
                }

                updates.push('id_persona = ?')
                values.push(newIdPersona)
            }

            if (newNombreGrado && newNombreGrado !== nombreGrado) {
                // Verificar que el nuevo grado no tenga ya un docente asignado
                const fechaCicloCheck = `${cicloLectivo || new Date().getFullYear()}-01-01`;
                const [existingDocente] = await connection.query(
                    `SELECT id_docenteTitular FROM DocenteGrado 
                     WHERE nombreGrado = ? AND cicloLectivo = ?;`,
                    [newNombreGrado, fechaCicloCheck]
                )

                if (existingDocente.length > 0) {
                    throw new Error('El grado seleccionado ya tiene un docente asignado')
                }

                updates.push('nombreGrado = ?')
                values.push(newNombreGrado)
            }

            if (fechaAsignado) {
                updates.push('fechaAsignado = ?')
                values.push(fechaAsignado)
            }

            if (cicloLectivo) {
                // Convertir el año a una fecha completa para la base de datos
                const fechaCiclo = `${cicloLectivo}-01-01`;
                updates.push('cicloLectivo = ?')
                values.push(fechaCiclo)
            }

            if (updates.length === 0) return this.getById({ idDocenteTitular, idPersona, nombreGrado })

            values.push(idDocenteTitular, idPersona, nombreGrado)
            await connection.query(
                `UPDATE DocenteGrado
                 SET ${updates.join(', ')}
                 WHERE id_docenteTitular = ? AND id_persona = ? AND nombreGrado = ?;`,
                values
            )

            // Retornar con los nuevos valores si se actualizaron
            return this.getById({
                idDocenteTitular,
                idPersona: newIdPersona || idPersona,
                nombreGrado: newNombreGrado || nombreGrado
            })
        } catch (error) {
            throw new Error('Error al actualizar la asignación: ' + error.message)
        }
    }

    // Obtener docentes disponibles (personas con rol Docente que no están asignadas a ningún grado)
    static async getDocentesDisponibles({ cicloLectivo = new Date().getFullYear() }) {
        // Convertir el año a una fecha completa para la comparación con DATE
        const fechaCiclo = `${cicloLectivo}-01-01`;

        const [docentes] = await connection.query(
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
             WHERE r.nombreRol = 'Docente' 
               AND p.estado = 'Activo'
               AND p.id_persona NOT IN (
                   SELECT id_persona 
                   FROM DocenteGrado 
                   WHERE cicloLectivo = ?
               )
             ORDER BY p.apellido, p.nombre;`,
            [fechaCiclo]
        )
        return docentes
    }

    // Obtener grados disponibles (grados que no tienen docente asignado)
    static async getGradosDisponibles({ cicloLectivo = new Date().getFullYear() }) {
        // Convertir el año a una fecha completa para la comparación con DATE
        const fechaCiclo = `${cicloLectivo}-01-01`;

        const [grados] = await connection.query(
            `SELECT 
                g.id_grado as idGrado,
                g.nombreGrado,
                g.estado,
                t.nombre as turno,
                t.horaInicio,
                t.horaFin
             FROM Grados g
             JOIN Turnos t ON g.id_turno = t.id_turno
             WHERE g.estado = 'Activo'
               AND g.nombreGrado NOT IN (
                   SELECT nombreGrado 
                   FROM DocenteGrado 
                   WHERE cicloLectivo = ?
               )
             ORDER BY g.nombreGrado;`,
            [fechaCiclo]
        )
        return grados
    }
}