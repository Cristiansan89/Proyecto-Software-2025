import { connection } from './db.js'

export class ProveedorInsumoModel {
    static async getAll() {
        const [relaciones] = await connection.query(
            `SELECT 
                pi.id_proveedor as idProveedor,
                pi.id_insumo as idInsumo,
                pi.calificacion,
                pr.razonSocial as proveedor,
                i.nombreInsumo as insumo,
                i.unidadDeMedida
             FROM Proveedor_Insumos pi
             JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
             JOIN Insumos i ON pi.id_insumo = i.id_insumo
             ORDER BY pr.razonSocial, i.nombreInsumo;`
        )
        return relaciones
    }

    static async getById({ idProveedor, idInsumo }) {
        const [relaciones] = await connection.query(
            `SELECT 
                pi.id_proveedor as idProveedor,
                pi.id_insumo as idInsumo,
                pi.calificacion,
                pr.razonSocial as proveedor,
                i.nombreInsumo as insumo,
                i.unidadDeMedida
             FROM Proveedor_Insumos pi
             JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
             JOIN Insumos i ON pi.id_insumo = i.id_insumo
             WHERE pi.id_proveedor = ? AND pi.id_insumo = ?;`,
            [idProveedor, idInsumo]
        )
        if (relaciones.length === 0) return null
        return relaciones[0]
    }

    static async create({ input }) {
        const {
            idProveedor,
            idInsumo,
            calificacion
        } = input

        try {
            await connection.query(
                `INSERT INTO Proveedor_Insumos (
                    id_proveedor, 
                    id_insumo, 
                    calificacion
                ) VALUES (?, ?, ?);`,
                [idProveedor, idInsumo, calificacion]
            )

            return this.getById({ idProveedor, idInsumo })
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Esta relación proveedor-insumo ya existe')
            }
            throw new Error('Error al crear la relación proveedor-insumo')
        }
    }

    static async delete({ idProveedor, idInsumo }) {
        try {
            await connection.query(
                `DELETE FROM Proveedor_Insumos
                 WHERE id_proveedor = ? AND id_insumo = ?;`,
                [idProveedor, idInsumo]
            )
            return true
        } catch (error) {
            return false
        }
    }

    static async update({ idProveedor, idInsumo, input }) {
        const {
            calificacion
        } = input

        try {
            await connection.query(
                `UPDATE Proveedor_Insumos
                 SET calificacion = ?
                 WHERE id_proveedor = ? AND id_insumo = ?;`,
                [calificacion, idProveedor, idInsumo]
            )

            return this.getById({ idProveedor, idInsumo })
        } catch (error) {
            throw new Error('Error al actualizar la relación proveedor-insumo')
        }
    }

    static async getByProveedor({ idProveedor }) {
        const [insumos] = await connection.query(
            `SELECT 
                pi.id_insumo as idInsumo,
                pi.calificacion,
                i.nombreInsumo,
                i.unidadDeMedida,
                i.descripcion
             FROM Proveedor_Insumos pi
             JOIN Insumos i ON pi.id_insumo = i.id_insumo
             WHERE pi.id_proveedor = ?
             ORDER BY i.nombreInsumo;`,
            [idProveedor]
        )
        return insumos
    }

    static async getByInsumo({ idInsumo }) {
        const [proveedores] = await connection.query(
            `SELECT 
                pi.id_proveedor as idProveedor,
                pi.calificacion,
                pr.razonSocial,
                pr.telefono,
                pr.direccion,
                pr.estado
             FROM Proveedor_Insumos pi
             JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
             WHERE pi.id_insumo = ?
             ORDER BY pi.calificacion DESC, pr.razonSocial;`,
            [idInsumo]
        )
        return proveedores
    }

    static async getBestProviders({ idInsumo }) {
        const [proveedores] = await connection.query(
            `SELECT 
                pi.id_proveedor as idProveedor,
                pi.calificacion,
                pr.razonSocial,
                pr.telefono,
                pr.estado
             FROM Proveedor_Insumos pi
             JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
             WHERE pi.id_insumo = ? AND pr.estado = 'Activo'
             ORDER BY 
                CASE pi.calificacion
                    WHEN 'Excelente' THEN 1
                    WHEN 'Aceptable' THEN 2
                    WHEN 'Poco Eficiente' THEN 3
                END,
                pr.razonSocial;`,
            [idInsumo]
        )
        return proveedores
    }
}