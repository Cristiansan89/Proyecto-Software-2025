import { connection } from "./db.js";
import { SoftDeleteService } from "./softDeleteService.js";

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
      // Si el error ya es sobre duplicado de nombre, relanzarlo tal cual
      if (error.message.includes("Ya existe un insumo")) {
        throw error;
      }
      throw new Error("Error al crear el insumo: " + error.message);
    } finally {
      conn.release();
    }
  }

  static async delete({ id }) {
    try {
      // Usar soft delete en lugar de DELETE físico
      return await SoftDeleteService.softDelete("Insumos", "id_insumo", id);
    } catch (error) {
      console.error("Error en softDelete:", error);
      return false;
    }
  }

  // Nuevo método: Restaurar insumo eliminado
  static async undelete({ id }) {
    try {
      return await SoftDeleteService.undelete("Insumos", "id_insumo", id);
    } catch (error) {
      console.error("Error en undelete:", error);
      return false;
    }
  }

  // Nuevo método: Obtener insumos eliminados
  static async getDeleted() {
    try {
      const [insumos] = await connection.query(
        `SELECT 
          i.id_insumo as idInsumo,
          i.nombreInsumo,
          i.descripcion,
          i.categoria,
          i.estado,
          i.fechaEliminacion
         FROM Insumos i
         WHERE i.estado = 'Inactivo'
         ORDER BY i.fechaEliminacion DESC;`
      );
      return insumos;
    } catch (error) {
      console.error("Error en getDeleted:", error);
      return [];
    }
  }

  // Nuevo método: Estadísticas de insumos
  static async getStats() {
    try {
      return await SoftDeleteService.getStats("Insumos");
    } catch (error) {
      console.error("Error en getStats:", error);
      return { activos: 0, inactivos: 0, total: 0, porcentajeInactivos: 0 };
    }
  }

  static async hasActiveRelations({ id }) {
    try {
      // Verificar en ItemsRecetas con recetas activas
      const [itemsRecetas] = await connection.query(
        `SELECT COUNT(*) as count
         FROM ItemsRecetas ir
         JOIN Recetas r ON ir.id_receta = r.id_receta
         WHERE ir.id_insumo = ? AND r.estado = 'Activo'`,
        [id]
      );

      // Verificar en ProveedorInsumo activo
      const [proveedorInsumo] = await connection.query(
        `SELECT COUNT(*) as count
         FROM ProveedorInsumo
         WHERE id_insumo = ? AND estado = 'Activo'`,
        [id]
      );

      const countItemsRecetas = itemsRecetas[0]?.count || 0;
      const countProveedorInsumo = proveedorInsumo[0]?.count || 0;

      console.log(
        `[hasActiveRelations] id_insumo=${id} | ItemsRecetas(RecetasActivas)=${countItemsRecetas} | ProveedorInsumo(Activos)=${countProveedorInsumo}`
      );

      return countItemsRecetas > 0 || countProveedorInsumo > 0;
    } catch (error) {
      console.error(
        `[hasActiveRelations] Error verificando relaciones para id_insumo=${id}:`,
        error
      );
      return false;
    }
  }

  // Nuevo método: obtener detalles de relaciones activas
  static async getActiveRelationsDetails({ id }) {
    try {
      // Obtener recetas activas que usan este insumo
      const [recetas] = await connection.query(
        `SELECT DISTINCT r.id_receta, r.nombreReceta
         FROM ItemsRecetas ir
         JOIN Recetas r ON ir.id_receta = r.id_receta
         WHERE ir.id_insumo = ? AND r.estado = 'Activo'`,
        [id]
      );

      // Obtener proveedores activos para este insumo
      const [proveedores] = await connection.query(
        `SELECT DISTINCT pr.id_proveedor, pr.razonSocial
         FROM ProveedorInsumo pi
         JOIN Proveedores pr ON pi.id_proveedor = pr.id_proveedor
         WHERE pi.id_insumo = ? AND pi.estado = 'Activo'`,
        [id]
      );

      return {
        recetas: recetas || [],
        proveedores: proveedores || [],
      };
    } catch (error) {
      console.error(
        `[getActiveRelationsDetails] Error obteniendo detalles para id_insumo=${id}:`,
        error
      );
      return { recetas: [], proveedores: [] };
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
