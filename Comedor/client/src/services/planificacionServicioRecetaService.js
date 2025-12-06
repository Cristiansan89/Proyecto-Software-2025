import axios from "axios";

const API_URL = "/api/recetas-servicios";

/**
 * Servicio para gestionar la relación entre Recetas y Servicios
 * Usa tabla intermedia: RecetaServicio
 */
const planificacionServicioRecetaService = {
  /**
   * Obtener todos los servicios de una receta
   * @param {string} id_receta - ID de la receta
   * @returns {Promise} Array de servicios asociados
   */
  async getServiciosPorReceta(id_receta) {
    try {
      const response = await axios.get(`${API_URL}/receta/${id_receta}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      throw error;
    }
  },

  /**
   * Obtener todas las recetas de un servicio específico
   * @param {number} id_servicio - ID del servicio (1=Desayuno, 2=Almuerzo, 3=Merienda)
   * @returns {Promise} Array de recetas del servicio
   */
  async getRecetasPorServicio(id_servicio) {
    try {
      const response = await axios.get(`${API_URL}/servicio/${id_servicio}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener recetas por servicio:", error);
      throw error;
    }
  },

  /**
   * Actualizar los servicios de una receta (reemplaza todos)
   * @param {string} id_receta - ID de la receta
   * @param {number[]} servicios - Array de IDs de servicios
   * @returns {Promise} Respuesta del servidor
   */
  async actualizarServiciosReceta(id_receta, servicios) {
    try {
      const response = await axios.patch(`${API_URL}/receta/${id_receta}`, {
        servicios,
      });
      return response.data;
    } catch (error) {
      console.error("Error al actualizar servicios:", error);
      throw error;
    }
  },

  /**
   * Crear una asociación entre receta y servicio
   * @param {string} id_receta - ID de la receta
   * @param {number} id_servicio - ID del servicio
   * @returns {Promise} Respuesta del servidor
   */
  async crearServicioReceta(id_receta, id_servicio) {
    try {
      const response = await axios.post(API_URL, {
        id_receta,
        id_servicio,
      });
      return response.data;
    } catch (error) {
      console.error("Error al crear asociación:", error);
      throw error;
    }
  },

  /**
   * Eliminar una asociación entre receta y servicio
   * @param {string} id_receta - ID de la receta
   * @param {number} id_servicio - ID del servicio
   * @returns {Promise} Respuesta del servidor
   */
  async eliminarServicioReceta(id_receta, id_servicio) {
    try {
      const response = await axios.delete(
        `${API_URL}/${id_receta}/${id_servicio}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al eliminar asociación:", error);
      throw error;
    }
  },

  /**
   * Obtener todas las asociaciones receta-servicio
   * @returns {Promise} Array de todas las asociaciones
   */
  async getAll() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener todas las asociaciones:", error);
      throw error;
    }
  },
};

export default planificacionServicioRecetaService;
