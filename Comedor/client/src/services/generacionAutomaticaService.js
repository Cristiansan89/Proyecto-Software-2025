import API from "./api";

const handleError = (error) => {
  if (error.response?.status === 401) {
    // Token expirado - el interceptor ya maneja la redirección
    throw new Error("Token expirado. Por favor, inicia sesión nuevamente.");
  }
  if (error.response?.status === 403) {
    throw new Error("No tienes permiso para acceder a este recurso.");
  }
  if (error.response?.status === 404) {
    throw new Error("Recurso no encontrado.");
  }
  throw error;
};

const generacionAutomaticaService = {
  // Generar insumos semanales manualmente
  generarInsumosSemanales: async () => {
    try {
      const response = await API.post(
        "/generacion-automatica/generar-insumos-semanales",
        {}
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Generar pedidos automáticos manualmente
  generarPedidosAutomaticos: async () => {
    try {
      const response = await API.post(
        "/generacion-automatica/generar-pedidos-automaticos",
        {}
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Obtener insumos semanales calculados
  obtenerInsumosSemanales: async (fechaInicio = null, fechaFin = null) => {
    try {
      let url = "/generacion-automatica/obtener-insumos-semanales";
      
      // Agregar parámetros de semana si se proporcionan
      if (fechaInicio && fechaFin) {
        url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      }
      
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Obtener estado de generación
  obtenerEstadoGeneracion: async () => {
    try {
      const response = await API.get(
        "/generacion-automatica/estado-generacion"
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Recargar scheduler
  recargarScheduler: async () => {
    try {
      const response = await API.post(
        "/generacion-automatica/recargar-scheduler",
        {}
      );
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Obtener estado del scheduler
  obtenerEstadoScheduler: async () => {
    try {
      const response = await API.get("/generacion-automatica/estado-scheduler");
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Generar pedidos por insumos faltantes
  generarPedidosPorInsumosFaltantes: async () => {
    const response = await API.post(
      "/generacion-automatica/generar-pedidos-insumos-faltantes",
      {}
    );
    return response.data;
  },
};

export default generacionAutomaticaService;
