import axiosInstance from "./axiosConfig.js";

const estadoPedidoService = {
  // Obtener todos los estados de pedido
  getAll: async () => {
    try {
      const response = await axiosInstance.get("/estado-pedidos");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener un estado de pedido por ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/estado-pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear un nuevo estado de pedido
  create: async (estadoPedidoData) => {
    try {
      const response = await axiosInstance.post(
        "/estado-pedidos",
        estadoPedidoData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar un estado de pedido
  update: async (id, estadoPedidoData) => {
    try {
      const response = await axiosInstance.patch(
        `/estado-pedidos/${id}`,
        estadoPedidoData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar un estado de pedido
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/estado-pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default estadoPedidoService;
