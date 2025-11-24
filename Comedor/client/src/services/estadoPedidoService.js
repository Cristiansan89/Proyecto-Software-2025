import api from "./api.js";

const estadoPedidoService = {
  // Obtener todos los estados de pedido
  getAll: async () => {
    try {
      const response = await api.get("/estado-pedidos");
      return response.data;
    } catch (error) {
      console.error("Error al obtener estados de pedido:", error);
      throw error;
    }
  },

  // Obtener un estado de pedido por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/estado-pedidos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener estado de pedido:", error);
      throw error;
    }
  },

  // Crear un nuevo estado de pedido
  create: async (estadoPedidoData) => {
    try {
      const response = await api.post("/estado-pedidos", estadoPedidoData);
      return response.data;
    } catch (error) {
      console.error("Error al crear estado de pedido:", error);
      throw error;
    }
  },

  // Actualizar un estado de pedido
  update: async (id, estadoPedidoData) => {
    try {
      const response = await api.patch(
        `/estado-pedidos/${id}`,
        estadoPedidoData
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar estado de pedido:", error);
      throw error;
    }
  },

  // Eliminar un estado de pedido
  delete: async (id) => {
    try {
      const response = await api.delete(`/estado-pedidos/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar estado de pedido:", error);
      throw error;
    }
  },
};

export default estadoPedidoService;
