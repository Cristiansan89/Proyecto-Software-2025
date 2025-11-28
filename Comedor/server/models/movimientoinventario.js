import { connection } from "./db.js";

export class MovimientoInventarioModel {
  static async getAll() {
    try {
      const [movimientos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(m.id_movimiento) as id_movimiento,
                    m.id_insumo,
                    BIN_TO_UUID(m.id_usuario) as id_usuario,
                    BIN_TO_UUID(m.id_consumo) as id_consumo,
                    m.id_tipoMerma,
                    i.nombreInsumo as nombreInsumo,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    m.tipoMovimiento,
                    m.cantidadMovimiento,
                    m.fechaHora,
                    m.comentarioMovimiento
                 FROM MovimientosInventarios m
                 JOIN Insumos i ON m.id_insumo = i.id_insumo
                 JOIN Usuarios u ON m.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 LEFT JOIN Consumos c ON m.id_consumo = c.id_consumo
                 ORDER BY m.fechaHora DESC;`
      );
      return movimientos;
    } catch (error) {
      console.error("Error al obtener movimientos de inventario:", error);
      throw new Error("Error al obtener movimientos de inventario");
    }
  }

  static async getById({ id }) {
    try {
      const [movimientos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(m.id_movimiento) as id_movimiento,
                    m.id_insumo,
                    BIN_TO_UUID(m.id_usuario) as id_usuario,
                    BIN_TO_UUID(m.id_consumo) as id_consumo,
                    m.id_tipoMerma,
                    i.nombreInsumo as nombreInsumo,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    m.tipoMovimiento,
                    m.cantidadMovimiento,
                    m.fechaHora,
                    m.comentarioMovimiento
                 FROM MovimientosInventarios m
                 JOIN Insumos i ON m.id_insumo = i.id_insumo
                 JOIN Usuarios u ON m.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 LEFT JOIN Consumos c ON m.id_consumo = c.id_consumo
                 WHERE m.id_movimiento = UUID_TO_BIN(?);`,
        [id]
      );
      if (movimientos.length === 0) return null;
      return movimientos[0];
    } catch (error) {
      console.error("Error al obtener movimiento de inventario:", error);
      throw new Error("Error al obtener movimiento de inventario");
    }
  }

  static async create({ input }) {
    const {
      id_insumo,
      id_usuario,
      id_consumo = null,
      id_tipoMerma = null,
      tipoMovimiento,
      cantidadMovimiento,
      comentarioMovimiento = null,
    } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO MovimientosInventarios (
                    id_insumo, 
                    id_usuario,
                    id_consumo, 
                    id_tipoMerma,
                    tipoMovimiento, 
                    cantidadMovimiento,
                    comentarioMovimiento
                ) VALUES (?, UUID_TO_BIN(?), ${
                  id_consumo ? "UUID_TO_BIN(?)" : "NULL"
                }, ?, ?, ?, ?);`,
        id_consumo
          ? [
              id_insumo,
              id_usuario,
              id_consumo,
              id_tipoMerma,
              tipoMovimiento,
              cantidadMovimiento,
              comentarioMovimiento,
            ]
          : [
              id_insumo,
              id_usuario,
              id_tipoMerma,
              tipoMovimiento,
              cantidadMovimiento,
              comentarioMovimiento,
            ]
      );

      // Obtener el ID del movimiento recién creado
      const [newMovimiento] = await connection.query(
        `SELECT BIN_TO_UUID(id_movimiento) as id_movimiento 
                 FROM MovimientosInventarios 
                 WHERE id_insumo = ? AND id_usuario = UUID_TO_BIN(?)
                 ORDER BY fechaHora DESC LIMIT 1;`,
        [id_insumo, id_usuario]
      );

      return this.getById({ id: newMovimiento[0].id_movimiento });
    } catch (error) {
      console.error("Error al crear el movimiento de inventario:", error);
      throw new Error("Error al crear el movimiento de inventario");
    }
  }

  static async delete({ id }) {
    try {
      await connection.query(
        `DELETE FROM MovimientosInventarios WHERE id_movimiento = UUID_TO_BIN(?);`,
        [id]
      );
      return true;
    } catch (error) {
      console.error("Error al eliminar movimiento de inventario:", error);
      return false;
    }
  }

  static async update({ id, input }) {
    const { comentarioMovimiento } = input;

    try {
      await connection.query(
        `UPDATE MovimientosInventarios
                 SET comentarioMovimiento = ?
                 WHERE id_movimiento = UUID_TO_BIN(?);`,
        [comentarioMovimiento, id]
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al actualizar el movimiento de inventario:", error);
      throw new Error("Error al actualizar el movimiento de inventario");
    }
  }

  // Método para obtener movimientos por insumo
  static async getByInsumo({ id_insumo, limit = 50 }) {
    try {
      const [movimientos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(m.id_movimiento) as id_movimiento,
                    m.id_insumo,
                    BIN_TO_UUID(m.id_usuario) as id_usuario,
                    BIN_TO_UUID(m.id_consumo) as id_consumo,
                    m.id_tipoMerma,
                    i.nombreInsumo as nombreInsumo,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    m.tipoMovimiento,
                    m.cantidadMovimiento,
                    m.fechaHora,
                    m.comentarioMovimiento
                 FROM MovimientosInventarios m
                 JOIN Insumos i ON m.id_insumo = i.id_insumo
                 JOIN Usuarios u ON m.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE m.id_insumo = ?
                 ORDER BY m.fechaHora DESC
                 LIMIT ?;`,
        [id_insumo, limit]
      );
      return movimientos;
    } catch (error) {
      console.error("Error al obtener movimientos por insumo:", error);
      throw new Error("Error al obtener movimientos por insumo");
    }
  }

  // Método para obtener movimientos por usuario
  static async getByUsuario({ id_usuario, limit = 50 }) {
    try {
      const [movimientos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(m.id_movimiento) as id_movimiento,
                    m.id_insumo,
                    BIN_TO_UUID(m.id_usuario) as id_usuario,
                    BIN_TO_UUID(m.id_consumo) as id_consumo,
                    m.id_tipoMerma,
                    i.nombreInsumo as nombreInsumo,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    m.tipoMovimiento,
                    m.cantidadMovimiento,
                    m.fechaHora,
                    m.comentarioMovimiento
                 FROM MovimientosInventarios m
                 JOIN Insumos i ON m.id_insumo = i.id_insumo
                 JOIN Usuarios u ON m.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE m.id_usuario = UUID_TO_BIN(?)
                 ORDER BY m.fechaHora DESC
                 LIMIT ?;`,
        [id_usuario, limit]
      );
      return movimientos;
    } catch (error) {
      console.error("Error al obtener movimientos por usuario:", error);
      throw new Error("Error al obtener movimientos por usuario");
    }
  }

  // Método para obtener movimientos por tipo
  static async getByTipo({ tipoMovimiento, limit = 50 }) {
    try {
      const [movimientos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(m.id_movimiento) as id_movimiento,
                    m.id_insumo,
                    BIN_TO_UUID(m.id_usuario) as id_usuario,
                    BIN_TO_UUID(m.id_consumo) as id_consumo,
                    m.id_tipoMerma,
                    i.nombreInsumo as nombreInsumo,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario,
                    m.tipoMovimiento,
                    m.cantidadMovimiento,
                    m.fechaHora,
                    m.comentarioMovimiento
                 FROM MovimientosInventarios m
                 JOIN Insumos i ON m.id_insumo = i.id_insumo
                 JOIN Usuarios u ON m.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE m.tipoMovimiento = ?
                 ORDER BY m.fechaHora DESC
                 LIMIT ?;`,
        [tipoMovimiento, limit]
      );
      return movimientos;
    } catch (error) {
      console.error("Error al obtener movimientos por tipo:", error);
      throw new Error("Error al obtener movimientos por tipo");
    }
  }

  // Método para obtener resumen de movimientos por período
  static async getResumenPorPeriodo({ fechaInicio, fechaFin }) {
    try {
      const [resumen] = await connection.query(
        `SELECT 
                    m.tipoMovimiento,
                    COUNT(*) as totalMovimientos,
                    SUM(m.cantidadMovimiento) as totalCantidad,
                    COUNT(DISTINCT m.id_insumo) as insumosAfectados,
                    COUNT(DISTINCT m.id_usuario) as usuariosInvolucrados
                 FROM MovimientosInventarios m
                 WHERE DATE(m.fechaHora) BETWEEN ? AND ?
                 GROUP BY m.tipoMovimiento
                 ORDER BY totalMovimientos DESC;`,
        [fechaInicio, fechaFin]
      );
      return resumen;
    } catch (error) {
      console.error("Error al obtener resumen por período:", error);
      throw new Error("Error al obtener resumen por período");
    }
  }

  // Método para registrar un movimiento y actualizar inventario automáticamente
  static async registrarMovimientoConActualizacion({ input }) {
    const connection_local = await connection.getConnection();

    try {
      await connection_local.beginTransaction();

      // Crear el movimiento
      const movimiento = await this.create({ input });

      // Actualizar el inventario
      const { id_insumo, cantidadMovimiento, tipoMovimiento } = input;
      const signo =
        tipoMovimiento.toLowerCase().includes("entrada") ||
        tipoMovimiento.toLowerCase().includes("compra")
          ? "+"
          : "-";

      await connection_local.query(
        `UPDATE Inventarios 
                 SET cantidadActual = cantidadActual ${signo} ?,
                     fechaUltimaActualizacion = CURDATE()
                 WHERE id_insumo = ?;`,
        [Math.abs(cantidadMovimiento), id_insumo]
      );

      // Actualizar estado del inventario
      await connection_local.query(
        `UPDATE Inventarios 
                 SET estado = CASE 
                     WHEN cantidadActual <= 0 THEN 'Agotado'
                     WHEN cantidadActual <= nivelMinimoAlerta THEN 'Critico'
                     ELSE 'Normal'
                 END
                 WHERE id_insumo = ?;`,
        [id_insumo]
      );

      await connection_local.commit();
      return movimiento;
    } catch (error) {
      await connection_local.rollback();
      console.error("Error al registrar movimiento con actualización:", error);
      throw new Error("Error al registrar movimiento con actualización");
    } finally {
      connection_local.release();
    }
  }
}
