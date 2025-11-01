import { connection } from './db.js'
import bcrypt from 'bcrypt'

export class UsuarioModel {
    static async getAll() {
        const [usuarios] = await connection.query(
            `SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.id_persona as idPersona,
                p.nombre,
                p.apellido,
                p.nombreRol,
                u.nombreUsuario,
                u.mail,
                u.telefono,
                u.fechaAlta,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             JOIN Personas p ON u.id_persona = p.id_persona
             ORDER BY u.nombreUsuario;`
        )
        return usuarios
    }

    static async getById({ id }) {
        const [usuarios] = await connection.query(
            `SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.id_persona as idPersona,
                p.nombre,
                p.apellido,
                p.nombreRol,
                u.nombreUsuario,
                u.mail,
                u.telefono,
                u.fechaAlta,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             JOIN Personas p ON u.id_persona = p.id_persona
             WHERE u.id_usuario = UUID_TO_BIN(?);`,
            [id]
        )
        if (usuarios.length === 0) return null
        return usuarios[0]
    }

    static async getByUsername(nombreUsuario) {
        const [usuarios] = await connection.query(
            `SELECT 
                BIN_TO_UUID(u.id_usuario) as idUsuario,
                u.id_persona as idPersona,
                p.nombre,
                p.apellido,
                p.nombreRol,
                u.nombreUsuario,
                u.contrasenia as contrasena,
                u.mail,
                u.telefono,
                u.fechaAlta,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             JOIN Personas p ON u.id_persona = p.id_persona
             WHERE u.nombreUsuario = ?;`,
            [nombreUsuario]
        )
        if (usuarios.length === 0) return null
        return usuarios[0]
    }

    static async create({ input }) {
        const {
            idPersona,
            nombreUsuario,
            contrasena,
            mail,
            telefono,
            estado = 'Activo'
        } = input

        const hashedPassword = await bcrypt.hash(contrasena, 10)

        try {
            await connection.query(
                `INSERT INTO Usuarios (
                    id_persona, 
                    nombreUsuario, 
                    contrasenia, 
                    mail, 
                    telefono, 
                    estado
                ) VALUES (?, ?, ?, ?, ?, ?);`,
                [idPersona, nombreUsuario, hashedPassword, mail, telefono, estado]
            )

            const [newUser] = await connection.query(
                `SELECT BIN_TO_UUID(id_usuario) as idUsuario 
                 FROM Usuarios 
                 WHERE nombreUsuario = ?;`,
                [nombreUsuario]
            )

            return this.getById({ id: newUser[0].idUsuario })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El nombre de usuario ya existe')
            }
            throw new Error('Error al crear el usuario')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Usuarios
                 WHERE id_usuario = UUID_TO_BIN(?);`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            idPersona,
            nombreUsuario,
            contrasena,
            mail,
            telefono,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (idPersona) {
                updates.push('id_persona = ?')
                values.push(idPersona)
            }
            if (nombreUsuario) {
                updates.push('nombreUsuario = ?')
                values.push(nombreUsuario)
            }
            if (contrasena) {
                const hashedPassword = await bcrypt.hash(contrasena, 10)
                updates.push('contrasenia = ?')
                values.push(hashedPassword)
            }
            if (mail !== undefined) {
                updates.push('mail = ?')
                values.push(mail)
            }
            if (telefono !== undefined) {
                updates.push('telefono = ?')
                values.push(telefono)
            }
            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            values.push(id)
            await connection.query(
                `UPDATE Usuarios
                 SET ${updates.join(', ')}
                 WHERE id_usuario = UUID_TO_BIN(?);`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El nombre de usuario ya existe')
            }
            throw new Error('Error al actualizar el usuario')
        }
    }

    static async updateLastActivity({ id }) {
        try {
            await connection.query(
                `UPDATE Usuarios
                 SET fechaUltimaActividad = NOW()
                 WHERE id_usuario = UUID_TO_BIN(?);`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }
}