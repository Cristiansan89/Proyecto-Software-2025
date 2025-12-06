import PlanificacionServicioRecetaServicio from "../models/planificacionServicioRecetaServicio.js";

export class PlanificacionServicioRecetaServicioController {
  /**
   * Asignar servicios a una receta planificada
   * POST /api/planificacion-receta-servicio/asignar
   */
  static async asignarServicios(req, res) {
    try {
      const { id_recetaAsignada, id_servicios } = req.body;

      // Validar entrada
      if (!id_recetaAsignada) {
        return res.status(400).json({
          message: "id_recetaAsignada es requerido",
        });
      }

      if (!Array.isArray(id_servicios) || id_servicios.length === 0) {
        return res.status(400).json({
          message: "id_servicios debe ser un array no vacío",
        });
      }

      // Asignar servicios
      const resultado =
        await PlanificacionServicioRecetaServicio.assignMultipleServicios(
          id_recetaAsignada,
          id_servicios
        );

      res.json({
        success: true,
        message: "Servicios asignados correctamente",
        data: resultado,
      });
    } catch (error) {
      console.error("Error en asignarServicios:", error);
      res.status(500).json({
        message: error.message || "Error al asignar servicios",
      });
    }
  }

  /**
   * Obtener servicios de una receta asignada
   * GET /api/planificacion-receta-servicio/:id_recetaAsignada
   */
  static async getServiciosByReceta(req, res) {
    try {
      const { id_recetaAsignada } = req.params;

      const servicios =
        await PlanificacionServicioRecetaServicio.getServiciosByRecetaAsignada(
          id_recetaAsignada
        );

      res.json({
        success: true,
        data: servicios,
      });
    } catch (error) {
      console.error("Error en getServiciosByReceta:", error);
      res.status(500).json({
        message: error.message || "Error al obtener servicios",
      });
    }
  }

  /**
   * Obtener recetas por servicio y jornada
   * GET /api/planificacion-receta-servicio/servicio/:id_servicio/jornada/:id_jornada
   */
  static async getRecetasByServicioAndJornada(req, res) {
    try {
      const { id_servicio, id_jornada } = req.params;

      const recetas =
        await PlanificacionServicioRecetaServicio.getRecetasByServicioAndJornada(
          id_servicio,
          id_jornada
        );

      res.json({
        success: true,
        data: recetas,
      });
    } catch (error) {
      console.error("Error en getRecetasByServicioAndJornada:", error);
      res.status(500).json({
        message: error.message || "Error al obtener recetas",
      });
    }
  }

  /**
   * Eliminar asociación entre receta y servicio
   * DELETE /api/planificacion-receta-servicio/:id_recetaAsignada/servicio/:id_servicio
   */
  static async removeServicio(req, res) {
    try {
      const { id_recetaAsignada, id_servicio } = req.params;

      const resultado =
        await PlanificacionServicioRecetaServicio.removeServicio(
          id_recetaAsignada,
          id_servicio
        );

      if (!resultado) {
        return res.status(404).json({
          message: "Asociación no encontrada",
        });
      }

      res.json({
        success: true,
        message: "Servicio eliminado correctamente",
      });
    } catch (error) {
      console.error("Error en removeServicio:", error);
      res.status(500).json({
        message: error.message || "Error al eliminar servicio",
      });
    }
  }

  /**
   * Verificar si existe una asociación
   * GET /api/planificacion-receta-servicio/existe/:id_recetaAsignada/servicio/:id_servicio
   */
  static async checkAssociation(req, res) {
    try {
      const { id_recetaAsignada, id_servicio } = req.params;

      const existe =
        await PlanificacionServicioRecetaServicio.existsAssociation(
          id_recetaAsignada,
          id_servicio
        );

      res.json({
        success: true,
        existe: existe,
      });
    } catch (error) {
      console.error("Error en checkAssociation:", error);
      res.status(500).json({
        message: error.message || "Error al verificar asociación",
      });
    }
  }

  /**
   * Obtener estadísticas de servicios
   * GET /api/planificacion-receta-servicio/estadisticas
   */
  static async getStatistics(req, res) {
    try {
      const estadisticas =
        await PlanificacionServicioRecetaServicio.getStatistics();

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      console.error("Error en getStatistics:", error);
      res.status(500).json({
        message: error.message || "Error al obtener estadísticas",
      });
    }
  }
}

export default PlanificacionServicioRecetaServicioController;
