import { connection } from "./db.js";

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
    );
    return proveedores;
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
    );
    if (proveedores.length === 0) return null;
    return proveedores[0];
  }

  static async create({ input }) {
    const {
      razonSocial,
      CUIT,
      direccion,
      telefono,
      mail,
      estado = "Activo",
    } = input;

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
      );

      const [newProveedor] = await connection.query(
        `SELECT BIN_TO_UUID(id_proveedor) as idProveedor 
                 FROM Proveedores 
                 WHERE razonSocial = ? AND CUIT = ?
                 ORDER BY fechaAlta DESC LIMIT 1;`,
        [razonSocial, CUIT]
      );

      return this.getById({ id: newProveedor[0].idProveedor });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe un proveedor con esta razón social y CUIT");
      }
      throw new Error("Error al crear el proveedor");
    }
  }

  static async delete({ id }) {
    try {
      await connection.query(
        `DELETE FROM Proveedores
                 WHERE id_proveedor = UUID_TO_BIN(?);`,
        [id]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Verificar si un proveedor tiene insumos activos asignados
  static async hasActiveInsumos({ id }) {
    const [result] = await connection.query(
      `SELECT COUNT(*) as count
       FROM ProveedorInsumo
       WHERE id_proveedor = UUID_TO_BIN(?) AND estado = 'Activo';`,
      [id]
    );
    return result[0].count > 0;
  }

  static async update({ id, input }) {
    const { razonSocial, CUIT, direccion, telefono, mail, estado } = input;

    try {
      const updates = [];
      const values = [];

      if (razonSocial) {
        updates.push("razonSocial = ?");
        values.push(razonSocial);
      }
      if (CUIT) {
        updates.push("CUIT = ?");
        values.push(CUIT);
      }
      if (direccion !== undefined) {
        updates.push("direccion = ?");
        values.push(direccion);
      }
      if (telefono !== undefined) {
        updates.push("telefono = ?");
        values.push(telefono);
      }
      if (mail !== undefined) {
        updates.push("mail = ?");
        values.push(mail);
      }
      if (estado) {
        updates.push("estado = ?");
        values.push(estado);
      }

      if (updates.length === 0) return this.getById({ id });

      updates.push("fechaModificacion = NOW()");
      values.push(id);

      await connection.query(
        `UPDATE Proveedores
                 SET ${updates.join(", ")}
                 WHERE id_proveedor = UUID_TO_BIN(?);`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe un proveedor con esta razón social y CUIT");
      }
      throw new Error("Error al actualizar el proveedor");
    }
  }

  // Obtener insumos asignados a un proveedor
  static async getInsumosAsignados({ id }) {
    const [insumos] = await connection.query(
      `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.categoria,
                i.unidadMedida,
                pi.calificacion,
                pi.estado as estadoAsignacion
             FROM ProveedorInsumo pi
             JOIN Insumos i ON pi.id_insumo = i.id_insumo
             WHERE BIN_TO_UUID(pi.id_proveedor) = ? AND pi.estado = 'Activo'
             ORDER BY i.nombreInsumo;`,
      [id]
    );
    return insumos;
  }

  // Asignar insumos a un proveedor
  static async asignarInsumos({ idProveedor, insumos }) {
    try {
      // Primero desactivar todas las asignaciones actuales
      await connection.query(
        `UPDATE ProveedorInsumo 
                 SET estado = 'Inactivo'
                 WHERE id_proveedor = UUID_TO_BIN(?);`,
        [idProveedor]
      );

      // Luego insertar o reactivar las nuevas asignaciones
      for (const insumo of insumos) {
        const { idInsumo, calificacion = "Bueno" } = insumo;

        // Verificar si ya existe la relación
        const [existing] = await connection.query(
          `SELECT COUNT(*) as count
                     FROM ProveedorInsumo
                     WHERE id_insumo = ? AND id_proveedor = UUID_TO_BIN(?);`,
          [idInsumo, idProveedor]
        );

        if (existing[0].count > 0) {
          // Reactivar y actualizar
          await connection.query(
            `UPDATE ProveedorInsumo
                         SET calificacion = ?, estado = 'Activo'
                         WHERE id_insumo = ? AND id_proveedor = UUID_TO_BIN(?);`,
            [calificacion, idInsumo, idProveedor]
          );
        } else {
          // Crear nueva relación
          await connection.query(
            `INSERT INTO ProveedorInsumo (id_insumo, id_proveedor, calificacion, estado)
                         VALUES (?, UUID_TO_BIN(?), ?, 'Activo');`,
            [idInsumo, idProveedor, calificacion]
          );
        }
      }

      return true;
    } catch (error) {
      throw new Error("Error al asignar insumos al proveedor");
    }
  }

  // Obtener proveedores con sus insumos
  static async getAllWithInsumos() {
    const [proveedores] = await connection.query(
      `SELECT 
                BIN_TO_UUID(p.id_proveedor) as idProveedor,
                p.razonSocial,
                p.CUIT,
                p.direccion,
                p.telefono,
                p.mail,
                p.fechaAlta,
                p.estado,
                COUNT(pi.id_insumo) as totalInsumos
             FROM Proveedores p
             LEFT JOIN ProveedorInsumo pi ON p.id_proveedor = pi.id_proveedor AND pi.estado = 'Activo'
             GROUP BY p.id_proveedor
             ORDER BY p.razonSocial;`
    );

    // Para cada proveedor, obtener sus insumos
    for (let proveedor of proveedores) {
      proveedor.insumos = await this.getInsumosAsignados({
        id: proveedor.idProveedor,
      });
    }

    return proveedores;
  }

  // Obtener solo proveedores activos
  static async getProveedoresActivos() {
    const [proveedores] = await connection.query(
      `SELECT 
                BIN_TO_UUID(p.id_proveedor) as idProveedor,
                p.razonSocial,
                p.CUIT,
                p.direccion,
                p.telefono,
                p.mail,
                p.fechaAlta,
                p.fechaModificacion,
                p.estado
             FROM Proveedores p
             WHERE p.estado = 'Activo'
             ORDER BY p.razonSocial;`
    );

    // Para cada proveedor, obtener sus insumos
    for (let proveedor of proveedores) {
      proveedor.insumos = await this.getInsumosAsignados({
        id: proveedor.idProveedor,
      });
    }

    return proveedores;
  }
}
