import RecetaServicioModel from "../models/servicioReceta.js";

// Obtener todos los servicios asociados a una receta
export const getServiciosPorReceta = async (req, res) => {
  try {
    const { id_receta } = req.params;

    if (!id_receta) {
      return res.status(400).json({
        success: false,
        message: "ID de receta es requerido",
      });
    }

    const servicios = await RecetaServicioModel.getServiciosPorReceta(
      id_receta
    );

    res.json({
      success: true,
      data: servicios,
      count: servicios.length,
    });
  } catch (error) {
    console.error("Error en getServiciosPorReceta:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener servicios de la receta",
      error: error.message,
    });
  }
};

// Obtener todas las recetas de un servicio
export const getRecetasPorServicio = async (req, res) => {
  try {
    const { id_servicio } = req.params;

    if (!id_servicio) {
      return res.status(400).json({
        success: false,
        message: "ID de servicio es requerido",
      });
    }

    const recetas = await RecetaServicioModel.getRecetasPorServicio(
      id_servicio
    );

    res.json({
      success: true,
      data: recetas,
      count: recetas.length,
    });
  } catch (error) {
    console.error("Error en getRecetasPorServicio:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener recetas del servicio",
      error: error.message,
    });
  }
};

// Crear asociación entre receta y servicio
export const crearServicioReceta = async (req, res) => {
  try {
    const { id_receta, id_servicio } = req.body;

    if (!id_receta || !id_servicio) {
      return res.status(400).json({
        success: false,
        message: "ID de receta e ID de servicio son requeridos",
      });
    }

    const resultado = await RecetaServicioModel.criarServicioReceta(
      id_receta,
      id_servicio
    );

    res.status(201).json({
      success: true,
      message: "Asociación creada exitosamente",
      data: resultado,
    });
  } catch (error) {
    console.error("Error en crearServicioReceta:", error);

    // Manejar error de duplicado
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Esta receta ya está asociada a este servicio",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear la asociación",
      error: error.message,
    });
  }
};

// Eliminar asociación entre receta y servicio
export const eliminarServicioReceta = async (req, res) => {
  try {
    const { id_receta, id_servicio } = req.params;

    if (!id_receta || !id_servicio) {
      return res.status(400).json({
        success: false,
        message: "ID de receta e ID de servicio son requeridos",
      });
    }

    const eliminada = await RecetaServicioModel.eliminarServicioReceta(
      id_receta,
      id_servicio
    );

    if (!eliminada) {
      return res.status(404).json({
        success: false,
        message: "Asociación no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Asociación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en eliminarServicioReceta:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la asociación",
      error: error.message,
    });
  }
};

// Actualizar servicios de una receta
export const actualizarServiciosReceta = async (req, res) => {
  try {
    const { id_receta } = req.params;
    const { servicios } = req.body;

    if (!id_receta || !Array.isArray(servicios)) {
      return res.status(400).json({
        success: false,
        message: "ID de receta y array de servicios son requeridos",
      });
    }

    if (servicios.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe seleccionar al menos un servicio",
      });
    }

    await RecetaServicioModel.actualizarServiciosReceta(id_receta, servicios);

    res.json({
      success: true,
      message: "Servicios de la receta actualizados exitosamente",
      data: { id_receta, servicios },
    });
  } catch (error) {
    console.error("Error en actualizarServiciosReceta:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar los servicios de la receta",
      error: error.message,
    });
  }
};

// Obtener todas las asociaciones
export const getAll = async (req, res) => {
  try {
    const asociaciones = await RecetaServicioModel.getAll();

    res.json({
      success: true,
      data: asociaciones,
      count: asociaciones.length,
    });
  } catch (error) {
    console.error("Error en getAll:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las asociaciones",
      error: error.message,
    });
  }
};
