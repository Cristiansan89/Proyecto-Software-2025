import API from "./api.js";

const configuracionServicioAutomaticoService = {
  // Obtener todas las configuraciones
  obtenerTodas: async () => {
    try {
      const response = await API.get("/configuracion-servicios-automaticos");
      return response.data;
    } catch (error) {
      console.error("Error al obtener configuraciones:", error);
      throw error;
    }
  },

  // Obtener servicios activos
  obtenerServiciosActivos: async () => {
    try {
      const response = await API.get(
        "/configuracion-servicios-automaticos/activos"
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener servicios activos:", error);
      throw error;
    }
  },

  // Obtener configuración por ID
  obtenerPorId: async (id) => {
    try {
      const response = await API.get(
        `/configuracion-servicios-automaticos/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener configuración:", error);
      throw error;
    }
  },

  // Crear nueva configuración
  crear: async (datos) => {
    try {
      const response = await API.post(
        "/configuracion-servicios-automaticos",
        datos
      );
      return response.data;
    } catch (error) {
      console.error("Error al crear configuración:", error);
      throw error;
    }
  },

  // Actualizar configuración
  actualizar: async (id, datos) => {
    try {
      const response = await API.patch(
        `/configuracion-servicios-automaticos/${id}`,
        datos
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      throw error;
    }
  },

  // Eliminar configuración
  eliminar: async (id) => {
    try {
      const response = await API.delete(
        `/configuracion-servicios-automaticos/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al eliminar configuración:", error);
      throw error;
    }
  },
};

export default configuracionServicioAutomaticoService;
