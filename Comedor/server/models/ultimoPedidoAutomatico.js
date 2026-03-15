import { connection } from './db.js';

export class UltimoPedidoAutomaticoModel {
  // Verificar si se puede crear un nuevo pedido (no se ha creado uno en los últimos 30 segundos)
  static async puedeCrearPedido() {
    try {
      const [resultado] = await connection.query(
        `SELECT 
          DATE_ADD(proximaPermitidaEn, INTERVAL 30 SECOND) as proximaPermitida,
          NOW() as ahora,
          CASE 
            WHEN NOW() >= proximaPermitidaEn THEN true 
            ELSE false 
          END as permitido,
          TIMESTAMPDIFF(SECOND, NOW(), proximaPermitidaEn) as segundosRestantes
        FROM UltimoPedidoAutomatico
        LIMIT 1`
      );

      if (resultado.length === 0) {
        return { permitido: true, segundosRestantes: 0 };
      }

      const datos = resultado[0];
      return {
        permitido: datos.permitido,
        segundosRestantes: Math.max(0, datos.segundosRestantes)
      };
    } catch (error) {
      console.error("❌ Error verificando último pedido:", error);
      return { permitido: true, segundosRestantes: 0 }; // Permitir si hay error
    }
  }

  // Actualizar el tiempo del último pedido automático creado
  static async actualizarUltimoPedido() {
    try {
      const [resultado] = await connection.query(
        `UPDATE UltimoPedidoAutomatico
         SET 
          fecha_ultimoPedido = NOW(),
          proximaPermitidaEn = NOW()
         LIMIT 1`
      );

      console.log("✅ Última fecha de pedido automático actualizada");
      return true;
    } catch (error) {
      console.error("❌ Error actualizando último pedido:", error);
      return false;
    }
  }

  // Obtener información del último pedido
  static async obtenerInfoUltimoPedido() {
    try {
      const [resultado] = await connection.query(
        `SELECT 
          BIN_TO_UUID(id_ultimoPedido) as id_ultimoPedido,
          fecha_ultimoPedido,
          proximaPermitidaEn,
          TIMESTAMPDIFF(SECOND, NOW(), proximaPermitidaEn) as segundosRestantes
        FROM UltimoPedidoAutomatico
        LIMIT 1`
      );

      return resultado[0] || null;
    } catch (error) {
      console.error("❌ Error obteniendo info del último pedido:", error);
      return null;
    }
  }
}

export default UltimoPedidoAutomaticoModel;
