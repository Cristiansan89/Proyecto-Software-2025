import { connection } from "./db.js";

export class AlertaInventarioModel {
  // Crear una nueva alerta
  static async create({ id_insumo, tipoAlerta, contadorEnvios = 1 }) {
    try {
      const [result] = await connection.query(
        `INSERT INTO AlertasInventario (id_insumo, tipoAlerta, contadorEnvios, fechaPrimeraAlerta, fechaUltimaAlerta, estado)
         VALUES (?, ?, ?, NOW(), NOW(), 'activa')
         ON DUPLICATE KEY UPDATE 
           contadorEnvios = contadorEnvios + 1,
           fechaUltimaAlerta = NOW(),
           estado = 'activa'`,
        [id_insumo, tipoAlerta, contadorEnvios]
      );
      return result;
    } catch (error) {
      console.error("Error al crear alerta de inventario:", error);
      throw new Error("Error al crear alerta de inventario");
    }
  }

  // Obtener alertas activas
  static async getAlertasActivas() {
    try {
      const [alertas] = await connection.query(
        `SELECT 
          aa.id_alerta,
          aa.id_insumo,
          aa.tipoAlerta,
          aa.contadorEnvios,
          aa.fechaPrimeraAlerta,
          aa.fechaUltimaAlerta,
          aa.estado,
          i.nombreInsumo,
          i.unidadMedida,
          inv.cantidadActual,
          inv.nivelMinimoAlerta,
          inv.estado as estado_stock
         FROM AlertasInventario aa
         JOIN Insumos i ON aa.id_insumo = i.id_insumo
         JOIN Inventarios inv ON aa.id_insumo = inv.id_insumo
         WHERE aa.estado = 'activa' AND aa.contadorEnvios < 3
         ORDER BY aa.fechaPrimeraAlerta DESC`
      );
      return alertas;
    } catch (error) {
      console.error("Error al obtener alertas activas:", error);
      throw new Error("Error al obtener alertas activas");
    }
  }

  // Obtener alertas por insumo
  static async getAlertas({ id_insumo }) {
    try {
      const [alertas] = await connection.query(
        `SELECT * FROM AlertasInventario WHERE id_insumo = ? ORDER BY fechaUltimaAlerta DESC`,
        [id_insumo]
      );
      return alertas;
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      throw new Error("Error al obtener alertas");
    }
  }

  // Marcar alerta como resuelta (cuando la cocinera ingresa)
  static async marcarComoResuelta({ id_insumo }) {
    try {
      await connection.query(
        `UPDATE AlertasInventario 
         SET estado = 'resuelta', fecha_resolucion = NOW()
         WHERE id_insumo = ? AND estado = 'activa'`,
        [id_insumo]
      );
      return true;
    } catch (error) {
      console.error("Error al marcar alerta como resuelta:", error);
      throw new Error("Error al marcar alerta como resuelta");
    }
  }

  // Marcar alerta como completada (3 envios alcanzados)
  static async marcarComoCompletada({ id_insumo }) {
    try {
      await connection.query(
        `UPDATE AlertasInventario 
         SET estado = 'completada'
         WHERE id_insumo = ? AND contadorEnvios >= 3`,
        [id_insumo]
      );
      return true;
    } catch (error) {
      console.error("Error al marcar alerta como completada:", error);
      throw new Error("Error al marcar alerta como completada");
    }
  }

  // Obtener estadísticas de alertas
  static async getEstadisticas() {
    try {
      const [stats] = await connection.query(
        `SELECT 
          COUNT(*) as total_alertas,
          SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as alertas_activas,
          SUM(CASE WHEN estado = 'resuelta' THEN 1 ELSE 0 END) as alertas_resueltas,
          SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as alertas_completadas,
          AVG(contadorEnvios) as promedio_envios
         FROM AlertasInventario`
      );
      return stats[0];
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      throw new Error("Error al obtener estadísticas");
    }
  }

  // Limpiar alertas antiguas (más de 7 días)
  static async limpiarAletasAntiguas() {
    try {
      const result = await connection.query(
        `DELETE FROM AlertasInventario 
         WHERE estado IN ('resuelta', 'completada') 
         AND DATE_ADD(fechaResolucion, INTERVAL 7 DAY) < NOW()`
      );
      return result;
    } catch (error) {
      console.error("Error al limpiar alertas antiguas:", error);
      throw new Error("Error al limpiar alertas antiguas");
    }
  }

  // Marcar como completadas las alertas de insumos que ya no están críticos
  static async marcarCompletadasSiNoEsCritico() {
    try {
      const result = await connection.query(
        `UPDATE AlertasInventario aa
         JOIN Inventarios inv ON aa.id_insumo = inv.id_insumo
         SET aa.estado = 'resuelta', aa.fechaResolucion = NOW()
         WHERE aa.estado = 'activa' 
         AND inv.estado = 'Normal'`
      );
      return result;
    } catch (error) {
      console.error("Error al marcar alertas como resueltas:", error);
      throw new Error("Error al marcar alertas como resueltas");
    }
  }

  // Obtener alertas no vistas
  static async obtenerNoVistas() {
    try {
      const [alertas] = await connection.query(
        `SELECT 
          aa.id_alerta,
          aa.id_insumo,
          aa.tipoAlerta,
          aa.contadorEnvios,
          aa.fechaPrimeraAlerta,
          aa.fechaUltimaAlerta,
          aa.visto,
          i.nombreInsumo,
          i.unidadMedida,
          inv.cantidadActual,
          inv.nivelMinimoAlerta as stockMinimo
         FROM AlertasInventario aa
         JOIN Insumos i ON aa.id_insumo = i.id_insumo
         JOIN Inventarios inv ON aa.id_insumo = inv.id_insumo
         WHERE aa.visto = false AND aa.estado = 'activa'
         ORDER BY aa.fechaUltimaAlerta DESC`
      );
      return alertas;
    } catch (error) {
      console.error("Error al obtener alertas no vistas:", error);
      throw error;
    }
  }

  // Marcar alerta como vista
  static async marcarComoVisto(id_alerta) {
    try {
      await connection.query(
        `UPDATE AlertasInventario 
         SET visto = true
         WHERE id_alerta = ?`,
        [id_alerta]
      );
    } catch (error) {
      console.error("Error al marcar alerta como vista:", error);
      throw error;
    }
  }

  // Actualizar contador de envíos
  static async actualizarContador({ id_insumo, contadorEnvios }) {
    try {
      const [result] = await connection.query(
        `UPDATE AlertasInventario 
         SET contadorEnvios = ?, fechaUltimaAlerta = NOW()
         WHERE id_insumo = ? AND estado = 'activa'`,
        [contadorEnvios, id_insumo]
      );
      return result;
    } catch (error) {
      console.error("Error al actualizar contador de alertas:", error);
      throw error;
    }
  }
}
