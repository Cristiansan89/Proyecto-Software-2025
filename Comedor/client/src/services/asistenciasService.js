import api from "./api";

const asistenciasService = {
  // Obtener registros de asistencia con filtros
  async obtenerRegistrosAsistencias(params = "") {
    try {
      const url = params
        ? `/asistencias/lista/detallado?${params}`
        : "/asistencias/lista/detallado";
      const response = await api.get(url);

      // El servidor ahora devuelve {success, data, message}
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Error desconocido",
          data: [],
        };
      }
    } catch (error) {
      console.error("Error al obtener registros de asistencias:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al obtener registros de asistencias",
        data: [],
      };
    }
  },

  // Obtener registros de asistencia por servicio
  async obtenerRegistrosAsistenciasServicio(params = "") {
    try {
      const url = params
        ? `/asistencias/lista/servicio?${params}`
        : "/asistencias/lista/servicio";
      const response = await api.get(url);

      // El servidor ahora devuelve {success, data, message}
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Error desconocido",
          data: [],
        };
      }
    } catch (error) {
      console.error(
        "Error al obtener registros de asistencias por servicio:",
        error
      );
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al obtener registros de asistencias por servicio",
        data: [],
      };
    }
  },

  // Crear registro de asistencia
  async crearRegistroAsistencia(data) {
    try {
      const response = await api.post("/registros-asistencias", data);
      return {
        success: true,
        data: response.data,
        message: "Registro de asistencia creado correctamente",
      };
    } catch (error) {
      console.error("Error al crear registro de asistencia:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al crear registro de asistencia",
      };
    }
  },

  // Actualizar estado de asistencia
  async actualizarEstadoAsistencia(idAsistencia, nuevoEstado) {
    try {
      const response = await api.patch(`/asistencias/${idAsistencia}`, {
        estado: nuevoEstado,
      });

      return {
        success: true,
        data: response.data,
        message: "Estado de asistencia actualizado correctamente",
      };
    } catch (error) {
      console.error("Error al actualizar estado de asistencia:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al actualizar estado de asistencia",
      };
    }
  },

  // Actualizar registro de asistencia
  async actualizarRegistroAsistencia(id, data) {
    try {
      const response = await api.put(`/registros-asistencias/${id}`, data);
      return {
        success: true,
        data: response.data,
        message: "Registro de asistencia actualizado correctamente",
      };
    } catch (error) {
      console.error("Error al actualizar registro de asistencia:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al actualizar registro de asistencia",
      };
    }
  },

  // Eliminar registro de asistencia
  async eliminarRegistroAsistencia(id) {
    try {
      await api.delete(`/registros-asistencias/${id}`);
      return {
        success: true,
        message: "Registro de asistencia eliminado correctamente",
      };
    } catch (error) {
      console.error("Error al eliminar registro de asistencia:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al eliminar registro de asistencia",
      };
    }
  },

  // Obtener estadísticas de asistencia por fecha
  async obtenerEstadisticasAsistencia(fecha) {
    try {
      const response = await api.get(
        `/registros-asistencias/estadisticas?fecha=${fecha}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error al obtener estadísticas de asistencia:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al obtener estadísticas de asistencia",
        data: {
          totalAsistencias: 0,
          totalPresentes: 0,
          porcentajeAsistencia: 0,
        },
      };
    }
  },

  // Verificar si todas las asistencias están registradas para una fecha y servicio
  async verificarAsistenciasCompletas(fecha, idServicio = null) {
    try {
      const params = new URLSearchParams({ fecha });
      if (idServicio) params.append("idServicio", idServicio);

      const response = await api.get(
        `/registros-asistencias/verificar-completas?${params.toString()}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error al verificar asistencias completas:", error);
      return {
        success: false,
        data: { completas: false, faltantes: [] },
      };
    }
  },

  // Función para procesar automáticamente el registro de asistencias cuando se completa
  async procesarAsistenciaCompletada(fecha, idServicio, idGrado) {
    try {
      const response = await api.post("/asistencias/procesar-completada", {
        fecha,
        idServicio,
        idGrado,
      });

      return {
        success: true,
        data: response.data,
        message: "Asistencias procesadas y registradas correctamente",
      };
    } catch (error) {
      console.error("Error al procesar asistencia completada:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al procesar asistencia completada",
      };
    }
  },

  // Función para procesar automáticamente todas las asistencias de una fecha
  async procesarTodasAsistenciasFecha(fecha) {
    try {
      const response = await api.post("/asistencias/procesar-todas-fecha", {
        fecha,
      });

      return {
        success: true,
        data: response.data,
        message:
          response.data?.message || "Asistencias procesadas correctamente",
      };
    } catch (error) {
      console.error("Error al procesar todas las asistencias:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Error al procesar todas las asistencias",
      };
    }
  },
};

export default asistenciasService;
