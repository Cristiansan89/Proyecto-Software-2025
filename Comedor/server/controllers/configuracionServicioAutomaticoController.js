import { ConfiguracionServicioAutomaticoModel } from "../models/configuracionServicioAutomatico.js";

export class ConfiguracionServicioAutomaticoController {
  constructor() {
    this.configuracionModel = ConfiguracionServicioAutomaticoModel;
  }

  obtenerTodos = async (req, res) => {
    try {
      const configuraciones = await this.configuracionModel.getAll();
      res.json({
        success: true,
        data: configuraciones,
        message: "Configuraciones obtenidas exitosamente",
      });
    } catch (error) {
      console.error("Error al obtener configuraciones:", error);
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };

  obtenerPorId = async (req, res) => {
    try {
      const { id } = req.params;
      const configuracion = await this.configuracionModel.getById({ id });

      if (!configuracion) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Configuración no encontrada",
        });
      }

      res.json({
        success: true,
        data: configuracion,
        message: "Configuración obtenida exitosamente",
      });
    } catch (error) {
      console.error("Error al obtener configuración:", error);
      res.status(500).json({
        success: false,
        data: null,
        message: "Error interno del servidor",
      });
    }
  };

  crear = async (req, res) => {
    try {
      const {
        id_servicio,
        horaInicio,
        horaFin,
        procesarAutomaticamente,
        descripcion,
      } = req.body;

      if (!id_servicio || !horaInicio || !horaFin) {
        return res.status(400).json({
          success: false,
          data: null,
          message:
            "Faltan parámetros requeridos: id_servicio, horaInicio, horaFin",
        });
      }

      const configuracion = await this.configuracionModel.create({
        id_servicio,
        horaInicio,
        horaFin,
        procesarAutomaticamente,
        descripcion,
      });

      res.status(201).json({
        success: true,
        data: configuracion,
        message: "Configuración creada exitosamente",
      });
    } catch (error) {
      console.error("Error al crear configuración:", error);
      res.status(400).json({
        success: false,
        data: null,
        message: error.message || "Error al crear configuración",
      });
    }
  };

  actualizar = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        id_servicio,
        horaInicio,
        horaFin,
        procesarAutomaticamente,
        descripcion,
      } = req.body;

      const configuracion = await this.configuracionModel.update({
        id,
        id_servicio,
        horaInicio,
        horaFin,
        procesarAutomaticamente,
        descripcion,
      });

      if (!configuracion) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Configuración no encontrada",
        });
      }

      res.json({
        success: true,
        data: configuracion,
        message: "Configuración actualizada exitosamente",
      });
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      res.status(400).json({
        success: false,
        data: null,
        message: error.message || "Error al actualizar configuración",
      });
    }
  };

  eliminar = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.configuracionModel.delete({ id });

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: "Configuración no encontrada",
        });
      }

      res.json({
        success: true,
        message: "Configuración eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar configuración:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  obtenerServiciosActivos = async (req, res) => {
    try {
      const servicios = await this.configuracionModel.getServiciosActivos();
      res.json({
        success: true,
        data: servicios,
        message: "Servicios activos obtenidos exitosamente",
      });
    } catch (error) {
      console.error("Error al obtener servicios activos:", error);
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };
}
