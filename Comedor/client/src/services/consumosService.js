import api from "./api";

const consumosService = {
  // Obtener consumos con filtros
  async obtenerConsumos(params = "") {
    try {
      const url = params ? `/consumos?${params}` : "/consumos";
      const response = await api.get(url);

      // Manejar formato de respuesta del servidor
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
        };
      } else if (Array.isArray(response.data)) {
        // Si el servidor devuelve directamente un array
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Error desconocido",
          data: [],
        };
      }
    } catch (error) {
      console.error("Error al obtener consumos:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al obtener consumos",
        data: [],
      };
    }
  },

  // Obtener consumo por ID
  async obtenerConsumoPorId(id) {
    try {
      const response = await api.get(`/consumos/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error al obtener consumo:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al obtener consumo",
        data: null,
      };
    }
  },

  // Crear nuevo consumo
  async crearConsumo(data) {
    try {
      const response = await api.post("/consumos", data);
      return {
        success: true,
        data: response.data,
        message: "Consumo registrado correctamente",
      };
    } catch (error) {
      console.error("Error al crear consumo:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al registrar consumo",
      };
    }
  },

  // Actualizar consumo
  async actualizarConsumo(id, data) {
    try {
      const response = await api.patch(`/consumos/${id}`, data);
      return {
        success: true,
        data: response.data,
        message: "Consumo actualizado correctamente",
      };
    } catch (error) {
      console.error("Error al actualizar consumo:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al actualizar consumo",
      };
    }
  },

  // Eliminar consumo
  async eliminarConsumo(id) {
    try {
      const response = await api.delete(`/consumos/${id}`);
      return {
        success: true,
        message: "Consumo eliminado correctamente",
      };
    } catch (error) {
      console.error("Error al eliminar consumo:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error al eliminar consumo",
      };
    }
  },

  // Obtener estadísticas de consumos
  async obtenerEstadisticas(fechaInicio, fechaFin) {
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);

      const response = await api.get(
        `/consumos/estadisticas?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Error al obtener estadísticas",
        data: {},
      };
    }
  },
};

export default consumosService;
