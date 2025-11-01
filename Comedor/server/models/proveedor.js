import { connection } from './db.js'

export class ProveedorModel {
    static async getAll() {
        const [proveedores] = await connection.query(
            `SELECT 
                BIN_TO_UUID(id_proveedor) as idProveedor,
                razonSocial,
                CUIT,
                direccion, 
                telefono,
                mail,
                fechaAlta,
                fechaModificacion,
                estado
             FROM Proveedores
             ORDER BY razonSocial;`
        )
        return proveedores
    }

    static async getById({ id }) {
        const [proveedores] = await connection.query(
            `SELECT 
                BIN_TO_UUID(id_proveedor) as idProveedor,
                razonSocial,
                CUIT,
                direccion, 
                telefono,
                mail,
                fechaAlta,
                fechaModificacion,
                estado
             FROM Proveedores
             WHERE id_proveedor = UUID_TO_BIN(?);`,
            [id]
        )
        if (proveedores.length === 0) return null
        return proveedores[0]
    }

    static async create({ input }) {
        const {
            razonSocial,
            CUIT,
            direccion,
            telefono,
            mail,
            estado = 'Activo'
        } = input

        try {
            await connection.query(
                `INSERT INTO Proveedores (
                    razonSocial,
                    CUIT,
                    direccion, 
                    telefono,
                    mail,
                    estado
                ) VALUES (?, ?, ?, ?, ?, ?);`,
                [razonSocial, CUIT, direccion, telefono, mail, estado]
            )

            const [newProveedor] = await connection.query(
                `SELECT BIN_TO_UUID(id_proveedor) as idProveedor 
                 FROM Proveedores 
                 WHERE razonSocial = ? AND CUIT = ?
                 ORDER BY fechaAlta DESC LIMIT 1;`,
                [razonSocial, CUIT]
            )

            return this.getById({ id: newProveedor[0].idProveedor })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un proveedor con esta razón social y CUIT')
            }
            throw new Error('Error al crear el proveedor')
        }
    }

    static async delete({ id }) {
        try {
            await connection.query(
                `DELETE FROM Proveedores
                 WHERE id_proveedor = UUID_TO_BIN(?);`,
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
            CUIT,
            direccion,
            telefono,
            mail,
            estado
        } = input

        try {
            const updates = []
            const values = []

            if (razonSocial) {
                updates.push('razonSocial = ?')
                values.push(razonSocial)
            }
            if (CUIT) {
                updates.push('CUIT = ?')
                values.push(CUIT)
            }
            if (direccion !== undefined) {
                updates.push('direccion = ?')
                values.push(direccion)
            }
            if (telefono !== undefined) {
                updates.push('telefono = ?')
                values.push(telefono)
            }
            if (mail !== undefined) {
                updates.push('mail = ?')
                values.push(mail)
            }
            if (estado) {
                updates.push('estado = ?')
                values.push(estado)
            }

            if (updates.length === 0) return this.getById({ id })

            updates.push('fechaModificacion = NOW()')
            values.push(id)

            await connection.query(
                `UPDATE Proveedores
                 SET ${updates.join(', ')}
                 WHERE id_proveedor = UUID_TO_BIN(?);`,
                values
            )

            return this.getById({ id })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe un proveedor con esta razón social y CUIT')
            }
            throw new Error('Error al actualizar el proveedor')
        }
    }

    static async getProveedoresWithInsumos() {
        try {
            const [proveedores] = await connection.query(`
                SELECT 
                    BIN_TO_UUID(p.id_proveedor) as id_proveedor,
                    p.razonSocial,
                    p.CUIT,
                    p.direccion,
                    p.telefono,
                    p.mail,
                    p.estado,
                    p.fechaAlta,
                    p.fechaModificacion,
                    GROUP_CONCAT(
                        CONCAT(i.nombre, ' (', pi.precio, ')')
                        SEPARATOR ', '
                    ) as insumos
                FROM Proveedores p
                LEFT JOIN ProveedorInsumo pi ON p.id_proveedor = pi.id_proveedor
                LEFT JOIN Insumos i ON pi.id_insumo = i.id_insumo
                WHERE p.estado = 'activo'
                GROUP BY p.id_proveedor, p.razonSocial, p.CUIT, p.direccion, p.telefono, p.mail, p.estado, p.fechaAlta, p.fechaModificacion
                ORDER BY p.razonSocial;
            `)

            return proveedores
        } catch (error) {
            console.error('Error al obtener proveedores con sus insumos:', error)
            throw new Error('Error al obtener proveedores con sus insumos')
        }
    }
}