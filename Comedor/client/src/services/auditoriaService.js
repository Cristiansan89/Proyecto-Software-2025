import API from "./api";

const auditoriaService = {
  /**
   * Obtener logs con filtros
   * @param {string} fechaInicio - Formato: YYYY-MM-DD
   * @param {string} fechaFin - Formato: YYYY-MM-DD
   * @param {string} usuario - Nombre o email del usuario
   * @param {string} accion - CREAR, ACTUALIZAR, ELIMINAR, CONSULTAR, etc.
   * @param {string} modulo - Nombre del módulo
   */
  obtenerLogs: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio)
        params.append("fechaInicio", filtros.fechaInicio);
      if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
      if (filtros.usuario) params.append("usuario", filtros.usuario);
      if (filtros.accion) params.append("accion", filtros.accion);
      if (filtros.modulo) params.append("modulo", filtros.modulo);

      const queryString = params.toString();
      const response = await API.get(
        `/auditoria/logs${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener logs de auditoría:", error);
      throw error;
    }
  },

  /**
   * Obtener un log específico
   */
  obtenerLogPorId: async (idLog) => {
    try {
      const response = await API.get(`/auditoria/logs/${idLog}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener log:", error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de auditoría
   */
  obtenerEstadisticas: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.fechaInicio)
        params.append("fechaInicio", filtros.fechaInicio);
      if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);

      const queryString = params.toString();
      const response = await API.get(
        `/auditoria/estadisticas${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      throw error;
    }
  },

  /**
   * Obtener logs por módulo
   */
  obtenerPorModulo: async (modulo) => {
    try {
      const response = await API.get(`/auditoria/modulo/${modulo}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener logs por módulo:", error);
      throw error;
    }
  },

  /**
   * Obtener logs por usuario
   */
  obtenerPorUsuario: async (idUsuario) => {
    try {
      const response = await API.get(`/auditoria/usuario/${idUsuario}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener logs por usuario:", error);
      throw error;
    }
  },

  /**
   * Obtener logs del día actual
   */
  obtenerDelDia: async () => {
    try {
      const response = await API.get("/auditoria/hoy");
      return response.data;
    } catch (error) {
      console.error("Error al obtener logs del día:", error);
      throw error;
    }
  },

  /**
   * Limpiar logs antiguos (solo admin)
   * @param {number} dias - Días de antigüedad (default: 90)
   */
  limpiarLogsAntiguos: async (dias = 90) => {
    try {
      const response = await API.post("/auditoria/limpiar-antiguos", {
        dias,
      });
      return response.data;
    } catch (error) {
      console.error("Error al limpiar logs antiguos:", error);
      throw error;
    }
  },
};

export default auditoriaService;
