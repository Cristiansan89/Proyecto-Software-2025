import API from "./api";

const serviciosRecetasService = {
  // Obtener todos los servicios asociados a una receta
  getServiciosPorReceta: async (id_receta) => {
    try {
      const response = await API.get(`/recetas-servicios/receta/${id_receta}`);
      return response.data.data || [];
    } catch (error) {
      console.error("Error obteniendo servicios de la receta:", error);
      throw error;
    }
  },

  // Obtener todas las recetas de un servicio
  getRecetasPorServicio: async (id_servicio) => {
    try {
      const response = await API.get(
        `/recetas-servicios/servicio/${id_servicio}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error obteniendo recetas del servicio:", error);
      throw error;
    }
  },

  // Crear una asociación entre receta y servicio
  crearRecetaServicio: async (id_receta, id_servicio) => {
    try {
      const response = await API.post("/recetas-servicios", {
        id_receta,
        id_servicio,
      });
      return response.data;
    } catch (error) {
      console.error("Error creando asociación receta-servicio:", error);
      throw error;
    }
  },

  // Actualizar servicios de una receta (reemplaza todos)
  actualizarServiciosReceta: async (id_receta, servicios) => {
    try {
      const response = await API.patch(
        `/recetas-servicios/receta/${id_receta}`,
        {
          servicios,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error actualizando servicios de la receta:", error);
      throw error;
    }
  },

  // Eliminar una asociación específica
  eliminarRecetaServicio: async (id_recetaServicio) => {
    try {
      const response = await API.delete(
        `/recetas-servicios/${id_recetaServicio}`
      );
      return response.data;
    } catch (error) {
      console.error("Error eliminando asociación receta-servicio:", error);
      throw error;
    }
  },

  // Obtener todas las asociaciones
  getAll: async () => {
    try {
      const response = await API.get("/recetas-servicios");
      return response.data.data || [];
    } catch (error) {
      console.error("Error obteniendo todas las asociaciones:", error);
      throw error;
    }
  },
};

export default serviciosRecetasService;
