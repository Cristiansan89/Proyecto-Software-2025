import { connection } from './db.js'

export class ProveedorModel {
    static async getAll() {
        const [proveedores] = await connection.query(
            `SELECT 
                id_proveedor as idProveedor,
                razonSocial, 
                direccion, 
                telefono, 
                estado
             FROM Proveedores
             ORDER BY razonSocial;`
        )
        return proveedores
    }

    static async getById({ id }) {
        const [proveedores] = await connection.query(
            `SELECT 
                id_proveedor as idProveedor,
                razonSocial, 
                direccion, 
                telefono, 
                estado
             FROM Proveedores
             WHERE id_proveedor = ?;`,
            [id]
        )
        if (proveedores.length === 0) return null
        return proveedores[0]
    }

    static async create({ input }) {
        const {
            razonSocial,
            direccion,
            telefono,
            estado = 'Activo'
        } = input

        try {
            await connection.query(
                `INSERT INTO Proveedores (
                    id_proveedor, 
                    razonSocial, 
                    direccion, 
                    telefono, 
                    estado
                ) VALUES (UUID(), ?, ?, ?, ?);`,
                [razonSocial, direccion, telefono, estado]
            )

            const [newProveedor] = await connection.query(
                `SELECT id_proveedor as idProveedor 
                 FROM Proveedores 
                 WHERE razonSocial = ? 
                 ORDER BY id_proveedor DESC LIMIT 1;`,
                [razonSocial]
            )

            return this.getById({ id: newProveedor[0].idProveedor })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un proveedor con esta razón social')
            }
            throw new Error('Error al crear el proveedor')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Proveedores
                 WHERE id_proveedor = ?;`,
                [id]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ id, input }) {
        const {
            razonSocial,
            direccion,
            telefono,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (razonSocial) {
                updates.push('razonSocial = ?')
                values.push(razonSocial)
            }
            if (direccion !== undefined) {
                updates.push('direccion = ?')
                values.push(direccion)
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
                `UPDATE Proveedores
                 SET ${updates.join(', ')}
                 WHERE id_proveedor = ?;`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un proveedor con esta razón social')
            }
            throw new Error('Error al actualizar el proveedor')
        }
    }
}