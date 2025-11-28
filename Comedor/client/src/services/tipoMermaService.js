import api from "./api.js";

const tipoMermaService = {
  // Obtener todos los tipos de merma
  async getAll() {
    try {
      const response = await api.get("/tipos-merma");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener tipo de merma por ID
  async getById(id) {
    try {
      const response = await api.get(`/tipos-merma/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo tipo de merma
  async create(data) {
    try {
      const response = await api.post("/tipos-merma", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar tipo de merma
  async update(id, data) {
    try {
      const response = await api.patch(`/tipos-merma/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar tipo de merma
  async delete(id) {
    try {
      const response = await api.delete(`/tipos-merma/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default tipoMermaService;
