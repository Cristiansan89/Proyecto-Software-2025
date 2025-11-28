import { connection } from "./db.js";

export class InsumoModel {
  static async getAll() {
    const [insumos] = await connection.query(
      `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.descripcion,
                i.unidadMedida,
                i.categoria,
                i.stockMinimo,
                i.fecha,
                i.estado,
                COALESCE(inv.cantidadActual, 0) as stockActual,
                inv.nivelMinimoAlerta,
                inv.stockMaximo,
                inv.fechaUltimaActualizacion,
                inv.estado as estadoInventario
             FROM Insumos i
             LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             ORDER BY i.nombreInsumo;`
    );
    return insumos;
  }

  static async getById({ id }) {
    const [insumos] = await connection.query(
      `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.descripcion,
                i.unidadMedida,
                i.categoria,
                i.stockMinimo,
                i.fecha,
                i.estado,
                COALESCE(inv.cantidadActual, 0) as stockActual,
                inv.nivelMinimoAlerta,
                inv.stockMaximo,
                inv.fechaUltimaActualizacion,
                inv.estado as estadoInventario
             FROM Insumos i
             LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             WHERE i.id_insumo = ?;`,
      [id]
    );
    if (insumos.length === 0) return null;
    return insumos[0];
  }

  static async create({ input }) {
    const {
      nombreInsumo,
      descripcion,
      unidadMedida,
      categoria = "Otros",
      stockMinimo = 0.0,
      estado = "Activo",
      // Campos para inventario inicial
      cantidadActual = 0.0,
      nivelMinimoAlerta = 0.0,
      stockMaximo = 999.999,
    } = input;

    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar si ya existe un insumo con ese nombre
      const [existing] = await conn.query(
        `SELECT id_insumo FROM Insumos WHERE nombreInsumo = ?;`,
        [nombreInsumo]
      );

      if (existing.length > 0) {
        await conn.rollback();
        throw new Error("Ya existe un insumo con ese nombre");
      }

      // Crear el insumo
      const [result] = await conn.query(
        `INSERT INTO Insumos (
                    nombreInsumo, 
                    descripcion,
                    unidadMedida, 
                    categoria,
                    stockMinimo,
                    estado
                ) VALUES (?, ?, ?, ?, ?, ?);`,
        [
          nombreInsumo,
          descripcion,
          unidadMedida,
          categoria,
          stockMinimo,
          estado,
        ]
      );

      const insumoId = result.insertId;

      // Crear el registro en inventario
      await conn.query(
        `INSERT INTO Inventarios (
                    id_insumo,
                    cantidadActual,
                    nivelMinimoAlerta,
                    stockMaximo
                ) VALUES (?, ?, ?, ?);`,
        [
          insumoId,
          cantidadActual,
          nivelMinimoAlerta || stockMinimo,
          stockMaximo,
        ]
      );

      await conn.commit();
      return this.getById({ id: insumoId });
    } catch (error) {
      await conn.rollback();
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe un insumo con ese nombre");
      }
      throw new Error("Error al crear el insumo: " + error.message);
    } finally {
      conn.release();
    }
  }

  static async delete({ id }) {
    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar si el insumo existe
      const [exists] = await conn.query(
        `SELECT id_insumo FROM Insumos WHERE id_insumo = ?;`,
        [id]
      );

      if (exists.length === 0) {
        await conn.rollback();
        return false;
      }

      // Verificar si el insumo está siendo usado en otras tablas
      const [references] = await conn.query(
        `SELECT 
                    (SELECT COUNT(*) FROM ProveedorInsumo WHERE id_insumo = ?) as proveedorCount,
                    (SELECT COUNT(*) FROM ItemsRecetas WHERE id_insumo = ?) as recetaCount,
                    (SELECT COUNT(*) FROM MovimientosInventarios WHERE id_insumo = ?) as movimientoCount`,
        [id, id, id]
      );

      const totalReferences =
        references[0].proveedorCount +
        references[0].recetaCount +
        references[0].movimientoCount;

      if (totalReferences > 0) {
        await conn.rollback();
        throw new Error(
          "No se puede eliminar el insumo porque está siendo usado en otros registros"
        );
      }

      // Eliminar primero del inventario (por la restricción de FK)
      await conn.query(`DELETE FROM Inventarios WHERE id_insumo = ?;`, [id]);

      // Luego eliminar el insumo
      const [result] = await conn.query(
        `DELETE FROM Insumos WHERE id_insumo = ?;`,
        [id]
      );

      await conn.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  static async update({ id, input }) {
    const {
      nombreInsumo,
      descripcion,
      unidadMedida,
      categoria,
      stockMinimo,
      estado,
      // Campos para inventario
      cantidadActual,
      nivelMinimoAlerta,
      stockMaximo,
    } = input;

    const conn = await connection.getConnection();
    try {
      await conn.beginTransaction();

      // Verificar si el insumo existe
      const [exists] = await conn.query(
        `SELECT id_insumo FROM Insumos WHERE id_insumo = ?;`,
        [id]
      );

      if (exists.length === 0) {
        await conn.rollback();
        return null;
      }

      // Verificar duplicado de nombre si se está actualizando
      if (nombreInsumo) {
        const [duplicate] = await conn.query(
          `SELECT id_insumo FROM Insumos WHERE nombreInsumo = ? AND id_insumo != ?;`,
          [nombreInsumo, id]
        );

        if (duplicate.length > 0) {
          await conn.rollback();
          throw new Error("Ya existe otro insumo con ese nombre");
        }
      }

      // Actualizar datos del insumo
      const insumoUpdates = [];
      const insumoValues = [];

      if (nombreInsumo) {
        insumoUpdates.push("nombreInsumo = ?");
        insumoValues.push(nombreInsumo);
      }
      if (descripcion !== undefined) {
        insumoUpdates.push("descripcion = ?");
        insumoValues.push(descripcion);
      }
      if (unidadMedida) {
        insumoUpdates.push("unidadMedida = ?");
        insumoValues.push(unidadMedida);
      }
      if (categoria) {
        insumoUpdates.push("categoria = ?");
        insumoValues.push(categoria);
      }
      if (stockMinimo !== undefined) {
        insumoUpdates.push("stockMinimo = ?");
        insumoValues.push(stockMinimo);
      }
      if (estado) {
        insumoUpdates.push("estado = ?");
        insumoValues.push(estado);
      }

      if (insumoUpdates.length > 0) {
        insumoValues.push(id);
        await conn.query(
          `UPDATE Insumos
                     SET ${insumoUpdates.join(", ")}
                     WHERE id_insumo = ?;`,
          insumoValues
        );
      }

      // Actualizar datos del inventario
      const inventarioUpdates = [];
      const inventarioValues = [];

      if (cantidadActual !== undefined) {
        inventarioUpdates.push("cantidadActual = ?");
        inventarioValues.push(cantidadActual);
      }
      if (nivelMinimoAlerta !== undefined) {
        inventarioUpdates.push("nivelMinimoAlerta = ?");
        inventarioValues.push(nivelMinimoAlerta);
      }
      if (stockMaximo !== undefined) {
        inventarioUpdates.push("stockMaximo = ?");
        inventarioValues.push(stockMaximo);
      }

      if (inventarioUpdates.length > 0) {
        inventarioUpdates.push("fechaUltimaActualizacion = NOW()");
        inventarioValues.push(id);

        await conn.query(
          `UPDATE Inventarios
                     SET ${inventarioUpdates.join(", ")}
                     WHERE id_insumo = ?;`,
          inventarioValues
        );
      }

      await conn.commit();
      return this.getById({ id });
    } catch (error) {
      await conn.rollback();
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe un insumo con ese nombre");
      }
      throw new Error("Error al actualizar el insumo: " + error.message);
    } finally {
      conn.release();
    }
  }

  static async updateStock({ id, cantidad }) {
    try {
      await connection.query(
        `UPDATE Inventarios
                 SET cantidadActual = cantidadActual + ?,
                     fechaUltimaActualizacion = NOW()
                 WHERE id_insumo = ?;`,
        [cantidad, id]
      );

      return this.getById({ id });
    } catch (error) {
      throw new Error("Error al actualizar el stock");
    }
  }

  static async getByCategoria({ categoria }) {
    const [insumos] = await connection.query(
      `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.descripcion,
                i.unidadMedida,
                i.categoria,
                i.stockMinimo,
                i.estado,
                COALESCE(inv.cantidadActual, 0) as stockActual
             FROM Insumos i
             LEFT JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             WHERE i.categoria = ? AND i.estado = 'Activo'
             ORDER BY i.nombreInsumo;`,
      [categoria]
    );
    return insumos;
  }

  static async getBajoStock() {
    const [insumos] = await connection.query(
      `SELECT 
                i.id_insumo as idInsumo,
                i.nombreInsumo,
                i.categoria,
                i.unidadMedida,
                inv.cantidadActual as stockActual,
                inv.nivelMinimoAlerta
             FROM Insumos i
             JOIN Inventarios inv ON i.id_insumo = inv.id_insumo
             WHERE inv.cantidadActual <= inv.nivelMinimoAlerta 
                AND i.estado = 'Activo'
             ORDER BY (inv.cantidadActual / inv.nivelMinimoAlerta) ASC;`
    );
    return insumos;
  }
}
