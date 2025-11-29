import API from "./api";

const generacionAutomaticaService = {
  // Generar insumos semanales manualmente
  generarInsumosSemanales: async () => {
    const response = await API.post(
      "/generacion-automatica/generar-insumos-semanales",
      {}
    );
    return response.data;
  },

  // Generar pedidos automáticos manualmente
  generarPedidosAutomaticos: async () => {
    const response = await API.post(
      "/generacion-automatica/generar-pedidos-automaticos",
      {}
    );
    return response.data;
  },

  // Obtener insumos semanales calculados
  obtenerInsumosSemanales: async () => {
    const response = await API.get(
      "/generacion-automatica/obtener-insumos-semanales"
    );
    return response.data;
  },

  // Obtener estado de generación
  obtenerEstadoGeneracion: async () => {
    const response = await API.get("/generacion-automatica/estado-generacion");
    return response.data;
  },

  // Recargar scheduler
  recargarScheduler: async () => {
    const response = await API.post(
      "/generacion-automatica/recargar-scheduler",
      {}
    );
    return response.data;
  },

  // Obtener estado del scheduler
  obtenerEstadoScheduler: async () => {
    const response = await API.get("/generacion-automatica/estado-scheduler");
    return response.data;
  },
};

export default generacionAutomaticaService;
