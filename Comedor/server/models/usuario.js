import { connection } from './db.js'
import bcrypt from 'bcrypt'

export class UsuarioModel {
    static async getAll() {
        const [usuarios] = await connection.query(
            `SELECT 
                u.id_usuario as idUsuario,
                u.id_rol as idRol,
                r.nombreRol,
                u.nombreUsuario,
                u.mail,
                u.telefono,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             JOIN Roles r ON u.id_rol = r.id_rol
             ORDER BY u.nombreUsuario;`
        )
        return usuarios
    }

    static async getById({ id }) {
        const [usuarios] = await connection.query(
            `SELECT 
                u.id_usuario as idUsuario,
                u.id_rol as idRol,
                r.nombreRol,
                u.nombreUsuario,
                u.mail,
                u.telefono,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             JOIN Roles r ON u.id_rol = r.id_rol
             WHERE u.id_usuario = ?;`,
            [id]
        )
        if (usuarios.length === 0) return null
        return usuarios[0]
    }

    static async getByUsername(nombreUsuario) {
        const [usuarios] = await connection.query(
            `SELECT 
                u.id_usuario as idUsuario,
                u.id_rol as idRol,
                r.nombreRol,
                u.nombreUsuario,
                u.contrasena,
                u.mail,
                u.telefono,
                u.fechaUltimaActividad,
                u.estado
             FROM Usuarios u
             JOIN Roles r ON u.id_rol = r.id_rol
             WHERE u.nombreUsuario = ?;`,
            [nombreUsuario]
        )
        if (usuarios.length === 0) return null
        return usuarios[0]
    }

    static async create({ input }) {
        const {
            idRol,
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
                    id_usuario, 
                    id_rol, 
                    nombreUsuario, 
                    contrasena, 
                    mail, 
                    telefono, 
                    estado
                ) VALUES (UUID(), ?, ?, ?, ?, ?, ?);`,
                [idRol, nombreUsuario, hashedPassword, mail, telefono, estado]
            )

            const [newUser] = await connection.query(
                `SELECT id_usuario as idUsuario 
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
                 WHERE id_usuario = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            idRol,
            nombreUsuario,
            contrasena,
            mail,
            telefono,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (idRol) {
                updates.push('id_rol = ?')
                values.push(idRol)
            }
            if (nombreUsuario) {
                updates.push('nombreUsuario = ?')
                values.push(nombreUsuario)
            }
            if (contrasena) {
                const hashedPassword = await bcrypt.hash(contrasena, 10)
                updates.push('contrasena = ?')
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
                 WHERE id_usuario = ?;`,
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
                 WHERE id_usuario = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }
}