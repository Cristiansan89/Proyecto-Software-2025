import api from "./api";

const movimientoInventarioService = {
  // Obtener todos los movimientos
  async obtenerMovimientos(params = "") {
    try {
      const url = params
        ? `/movimientos-inventarios?${params}`
        : "/movimientos-inventarios";
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
      console.error("Error al obtener movimientos:", error);
      return [];
    }
  },

  // Obtener movimiento por ID
  async obtenerMovimientoPorId(id) {
    try {
      const response = await api.get(`/movimientos-inventarios/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener movimiento:", error);
      throw error;
    }
  },

  // Crear nuevo movimiento
  async crearMovimiento(datos) {
    try {
      const response = await api.post("/movimientos-inventarios", datos);
      return response.data;
    } catch (error) {
      console.error("Error al crear movimiento:", error);
      throw error;
    }
  },

  // Actualizar movimiento
  async actualizarMovimiento(id, datos) {
    try {
      const response = await api.put(`/movimientos-inventarios/${id}`, datos);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar movimiento:", error);
      throw error;
    }
  },

  // Eliminar movimiento
  async eliminarMovimiento(id) {
    try {
      const response = await api.delete(`/movimientos-inventarios/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar movimiento:", error);
      throw error;
    }
  },

  // Obtener movimientos por tipo
  async obtenerMovimientosPorTipo(tipo) {
    try {
      const response = await api.get(`/movimientos-inventarios?tipo=${tipo}`);

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Error al obtener movimientos de tipo ${tipo}:`, error);
      return [];
    }
  },

  // Obtener movimientos por insumo
  async obtenerMovimientosPorInsumo(idInsumo) {
    try {
      const response = await api.get(
        `/movimientos-inventarios?id_insumo=${idInsumo}`
      );

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        `Error al obtener movimientos del insumo ${idInsumo}:`,
        error
      );
      return [];
    }
  },

  // Obtener movimientos en rango de fechas
  async obtenerMovimientosEnRango(fechaInicio, fechaFin) {
    try {
      const response = await api.get(
        `/movimientos-inventarios?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );

      if (response.data && response.data.success) {
        return response.data.data || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error(
        `Error al obtener movimientos entre ${fechaInicio} y ${fechaFin}:`,
        error
      );
      return [];
    }
  },
};

export default movimientoInventarioService;
