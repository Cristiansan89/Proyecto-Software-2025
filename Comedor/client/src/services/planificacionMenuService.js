import api from "./api.js";

const planificacionMenuService = {
  // Obtener todas las planificaciones
  getAll: async () => {
    try {
      const response = await api.get("/planificacion-menus");
      return response.data;
    } catch (error) {
      console.error("Error al obtener planificaciones:", error);
      throw error;
    }
  },

  // Obtener planificación por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/planificacion-menus/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener planificación:", error);
      throw error;
    }
  },

  // Crear nueva planificación
  create: async (planificacion) => {
    try {
      const response = await api.post("/planificacion-menus", planificacion);
      return response.data;
    } catch (error) {
      console.error("Error al crear planificación:", error);
      throw error;
    }
  },

  // Actualizar planificación
  update: async (id, planificacion) => {
    try {
      const response = await api.patch(
        `/planificacion-menus/${id}`,
        planificacion
      );
      return response.data;
    } catch (error) {
      console.error("Error al actualizar planificación:", error);
      throw error;
    }
  },

  // Eliminar planificación
  delete: async (id) => {
    try {
      const response = await api.delete(`/planificacion-menus/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar planificación:", error);
      throw error;
    }
  },

  // Obtener planificación completa con jornadas y recetas
  getPlanificacionCompleta: async (id) => {
    try {
      const response = await api.get(`/planificacion-menus/${id}/completa`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener planificación completa:", error);
      throw error;
    }
  },

  // Crear jornada en planificación
  crearJornada: async (data) => {
    try {
      const response = await api.post("/planificacion-menus/jornadas", data);
      return response.data;
    } catch (error) {
      console.error("Error al crear jornada:", error);
      throw error;
    }
  },

  // Asignar receta a jornada
  asignarReceta: async (data) => {
    try {
      const response = await api.post(
        "/planificacion-menus/asignar-receta",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error al asignar receta:", error);
      throw error;
    }
  },

  // Obtener recetas por jornada
  getRecetasPorJornada: async (idJornada) => {
    try {
      const response = await api.get(
        `/planificacion-menus/jornadas/${idJornada}/recetas`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener recetas por jornada:", error);
      throw error;
    }
  },

  // Obtener planificaciones por usuario
  getByUsuario: async (idUsuario) => {
    try {
      const response = await api.get(
        `/planificacion-menus/usuario/${idUsuario}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener planificaciones por usuario:", error);
      throw error;
    }
  },

  // Obtener planificaciones por estado
  getByEstado: async (estado) => {
    try {
      const response = await api.get(`/planificacion-menus/estado/${estado}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener planificaciones por estado:", error);
      throw error;
    }
  },

  // Finalizar planificación
  finalizar: async (id) => {
    try {
      const response = await api.patch(`/planificacion-menus/${id}/finalizar`);
      return response.data;
    } catch (error) {
      console.error("Error al finalizar planificación:", error);
      throw error;
    }
  },

  // Obtener planificaciones por rango de fechas
  getByRangoFechas: async (fechaInicio, fechaFin) => {
    try {
      const response = await api.get(
        `/planificacion-menus/rango-fechas/reporte?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener planificaciones por rango:", error);
      throw error;
    }
  },

  // Duplicar planificación de semana anterior
  duplicarSemana: async (fechaBase, nuevaFecha) => {
    try {
      const response = await api.post("/planificacion-menus/duplicar-semana", {
        fechaBase,
        nuevaFecha,
      });
      return response.data;
    } catch (error) {
      console.error("Error al duplicar semana:", error);
      throw error;
    }
  },

  // Obtener estadísticas de planificación
  getEstadisticas: async (fechaInicio, fechaFin) => {
    try {
      const response = await api.get(
        `/planificacion-menus/estadisticas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      throw error;
    }
  },

  // Obtener recetas activas disponibles para asignar
  getRecetasDisponibles: async () => {
    try {
      const response = await api.get("/recetas/activas");
      return response.data;
    } catch (error) {
      console.error("Error al obtener recetas disponibles:", error);
      throw error;
    }
  },

  // Obtener menús asignados para una semana específica
  getMenusSemana: async (fechaInicio, fechaFin) => {
    try {
      const response = await api.get(
        `/planificacion-menus/semana?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );
      return response.data;
    } catch (error) {
      console.error("Error al obtener menús de la semana:", error);
      throw error;
    }
  },

  // Eliminar receta asignada
  eliminarReceta: async (datosEliminacion) => {
    try {
      const response = await api.delete(
        "/planificacion-menus/eliminar-receta",
        {
          data: datosEliminacion,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error al eliminar receta:", error);
      throw error;
    }
  },
};

export default planificacionMenuService;
