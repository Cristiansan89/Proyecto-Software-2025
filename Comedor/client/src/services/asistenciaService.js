import api from "./api";

const asistenciaService = {
  // Obtener todos los registros de asistencia
  getAll: async () => {
    try {
      const response = await api.get("/registros-asistencias");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener asistencia por fecha
  getByFecha: async (fecha) => {
    try {
      const response = await api.get(`/registros-asistencias/fecha/${fecha}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener asistencia por persona
  getByPersona: async (idPersona) => {
    try {
      const response = await api.get(
        `/registros-asistencias/persona/${idPersona}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo registro de asistencia
  create: async (data) => {
    try {
      const response = await api.post("/registros-asistencias", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener cantidad de alumnos que asisten en una fecha (por grado y servicio)
  getAsistenciaResumen: async (fecha) => {
    try {
      const asistencias = await asistenciaService.getByFecha(fecha);

      // Agrupar por grado y servicio para contar asistencias
      const resumen = {};

      if (Array.isArray(asistencias)) {
        asistencias.forEach((registro) => {
          const key = `${registro.id_grado}_${registro.id_servicio}`;
          if (!resumen[key]) {
            resumen[key] = {
              id_grado: registro.id_grado,
              id_servicio: registro.id_servicio,
              cantidad: 0,
              nombreGrado: registro.nombreGrado,
            };
          }
          resumen[key].cantidad += 1;
        });
      }

      return resumen;
    } catch (error) {
      console.error("Error al obtener resumen de asistencia:", error);
      throw error;
    }
  },

  // Obtener cantidad total de asistentes por servicio
  getTotalAsistenciasPorServicio: async (fecha) => {
    try {
      const asistencias = await asistenciaService.getByFecha(fecha);

      const totales = {};

      if (Array.isArray(asistencias)) {
        asistencias.forEach((registro) => {
          if (!totales[registro.id_servicio]) {
            totales[registro.id_servicio] = 0;
          }
          totales[registro.id_servicio] += 1;
        });
      }

      return totales;
    } catch (error) {
      console.error("Error al obtener total de asistencias:", error);
      throw error;
    }
  },
};

export default asistenciaService;
