import alertasService from "../services/alertasInventarioService.js";
import { AlertaInventarioModel } from "../models/alertaInventario.js";

export class AlertasInventarioController {
  // Inicializar el servicio de alertas
  static async inicializar(req, res) {
    try {
      const resultado = await alertasService.inicializar();
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al inicializar alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al inicializar el servicio de alertas",
        error: error.message,
      });
    }
  }

  // Obtener alertas activas
  static async obtenerAlertasActivas(req, res) {
    try {
      const resultado = await alertasService.obtenerAlertasActivas();
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas",
        error: error.message,
      });
    }
  }

  // Obtener estadísticas de alertas
  static async obtenerEstadisticas(req, res) {
    try {
      const resultado = await alertasService.obtenerEstadisticas();
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: error.message,
      });
    }
  }

  // Resolver alerta cuando cocinera ingresa
  static async resolverAlerta(req, res) {
    try {
      const { id_insumo } = req.params;

      if (!id_insumo) {
        return res.status(400).json({
          success: false,
          message: "id_insumo es requerido",
        });
      }

      const resultado = await alertasService.resolverAlertaCocineraIngresa(
        id_insumo
      );
      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      console.error("Error al resolver alerta:", error);
      res.status(500).json({
        success: false,
        message: "Error al resolver alerta",
        error: error.message,
      });
    }
  }

  // Obtener alertas de un insumo específico
  static async obtenerAlertas(req, res) {
    try {
      const { id_insumo } = req.params;

      if (!id_insumo) {
        return res.status(400).json({
          success: false,
          message: "id_insumo es requerido",
        });
      }

      const alertas = await AlertaInventarioModel.getAlertas({ id_insumo });
      res.json({
        success: true,
        alertas,
      });
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener alertas",
        error: error.message,
      });
    }
  }

  // Cambiar tiempo de verificación
  static async cambiarTiempoVerificacion(req, res) {
    try {
      const { tiempoMinutos } = req.body;

      if (!tiempoMinutos || tiempoMinutos < 1) {
        return res.status(400).json({
          success: false,
          message: "tiempoMinutos debe ser mayor a 1",
        });
      }

      const tiempoMs = tiempoMinutos * 60 * 1000;
      alertasService.cambiarTiempoVerificacion(tiempoMs);

      res.json({
        success: true,
        message: `Tiempo de verificación actualizado a ${tiempoMinutos} minutos`,
        estado: alertasService.obtenerEstado(),
      });
    } catch (error) {
      console.error("Error al cambiar tiempo de verificación:", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar tiempo de verificación",
        error: error.message,
      });
    }
  }

  // Obtener estado del servicio
  static async obtenerEstado(req, res) {
    try {
      const estado = alertasService.obtenerEstado();
      res.json({
        success: true,
        estado,
      });
    } catch (error) {
      console.error("Error al obtener estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estado del servicio",
        error: error.message,
      });
    }
  }

  // Iniciar verificación manual
  static async iniciarVerificacionManual(req, res) {
    try {
      await alertasService.verificarYEnviarAlertas();
      res.json({
        success: true,
        message: "Verificación manual completada",
      });
    } catch (error) {
      console.error("Error en verificación manual:", error);
      res.status(500).json({
        success: false,
        message: "Error al realizar verificación manual",
        error: error.message,
      });
    }
  }

  // Detener el servicio de alertas
  static async detener(req, res) {
    try {
      alertasService.detenerVerificacion();
      res.json({
        success: true,
        message: "Servicio de alertas detenido",
      });
    } catch (error) {
      console.error("Error al detener servicio:", error);
      res.status(500).json({
        success: false,
        message: "Error al detener el servicio",
        error: error.message,
      });
    }
  }
}
