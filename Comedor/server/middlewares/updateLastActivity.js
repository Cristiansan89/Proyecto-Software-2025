import { UsuarioModel } from "../models/usuario.js";
import alertasService from "../services/alertasInventarioService.js";

export const updateLastActivity = async (req, res, next) => {
  // Solo actualizar si hay un usuario autenticado
  if (req.user && req.user.id) {
    try {
      // Actualizar la última actividad de forma asíncrona sin bloquear la respuesta
      UsuarioModel.updateLastActivity({ id: req.user.id }).catch((error) => {
        console.error("Error al actualizar última actividad:", error);
      });

      // Si el usuario es cocinera, resolver alertas de inventario
      if (req.user.rol && req.user.rol.toLowerCase().includes("cocinera")) {
        try {
          // Obtener alertas activas y marcar como resueltas
          const alertasResult = await alertasService.obtenerAlertasActivas();
          if (
            alertasResult.success &&
            alertasResult.alertas &&
            alertasResult.alertas.length > 0
          ) {
            console.log(
              `🔔 Cocinera ha ingresado. Resolviendo ${alertasResult.alertas.length} alertas activas`
            );

            // Resolver cada alerta activa
            for (const alerta of alertasResult.alertas) {
              await alertasService.resolverAlertaCocineraIngresa(
                alerta.id_insumo
              );
            }
          }
        } catch (error) {
          console.error("Error al resolver alertas de cocinera:", error);
        }
      }
    } catch (error) {
      // No queremos que esto rompa el flujo principal, solo logeamos el error
      console.error("Error en middleware updateLastActivity:", error);
    }
  }
  next();
};
