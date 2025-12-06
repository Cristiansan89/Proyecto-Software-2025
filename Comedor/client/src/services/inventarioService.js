import api from "./api";

const inventarioService = {
  // Obtener todos los inventarios
  async obtenerInventarios(params = "") {
    try {
      const url = params ? `/inventarios?${params}` : "/inventarios";
      const response = await api.get(url);

      // Manejar formato de respuesta del servidor
      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        // Si el servidor devuelve directamente un array
        return response.data;
      } else {
        console.warn("Respuesta inesperada:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error al obtener inventarios:", error);
      return [];
    }
  },

  // Obtener inventario por ID
  async obtenerInventarioPorId(id) {
    try {
      const response = await api.get(`/inventarios/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      throw error;
    }
  },

  // Crear nuevo inventario
  async crearInventario(datos) {
    try {
      const response = await api.post("/inventarios", datos);
      return response.data;
    } catch (error) {
      console.error("Error al crear inventario:", error);
      throw error;
    }
  },

  // Actualizar inventario
  async actualizarInventario(id, datos) {
    try {
      const response = await api.put(`/inventarios/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar inventario:", error);
      throw error;
    }
  },

  // Eliminar inventario
  async eliminarInventario(id) {
    try {
      const response = await api.delete(`/inventarios/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar inventario:", error);
      throw error;
    }
  },

  // Obtener inventarios por categoría
  async obtenerInventariosPorCategoria(categoria) {
    try {
      const response = await api.get(`/inventarios?categoria=${categoria}`);

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        `Error al obtener inventarios de categoría ${categoria}:`,
        error
      );
      return [];
    }
  },

  // Obtener inventarios con bajo stock
  async obtenerInventariosBajoStock() {
    try {
      const response = await api.get("/inventarios/stock/bajo");

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error al obtener inventarios con bajo stock:", error);
      return [];
    }
  },

  // Actualizar cantidad de inventario
  async actualizarCantidad(idInsumo, cantidad, tipoMovimiento = "Entrada") {
    try {
      const response = await api.put(`/inventarios/${idInsumo}/cantidad`, {
        cantidad,
        tipoMovimiento,
      });
      return response.data;
    } catch (error) {
      console.error("Error al actualizar cantidad de inventario:", error);
      throw error;
    }
  },

  // Obtener alertas de inventario
  async obtenerAlertas() {
    try {
      const response = await api.get("/inventarios/alertas");

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error al obtener alertas de inventario:", error);
      return [];
    }
  },
};

export default inventarioService;
