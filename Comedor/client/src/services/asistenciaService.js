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

  // Obtener cantidad total de asistentes por servicio (solo los que marcó como "Si"/presentes)
  getTotalAsistenciasPorServicio: async (fecha) => {
    try {
      console.log(`🔍 Buscando asistencias para fecha: ${fecha}`);
      // Usar el endpoint que retorna RegistrosAsistencias (con cantidadPresentes agregada)
      const response = await api.get(`/asistencias/lista/servicio`, {
        params: { fecha },
      });

      console.log(`📤 Response.data:`, response.data);

      const registros = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      console.log(`📊 Total de registros: ${registros.length}`);

      const totales = {};

      if (Array.isArray(registros) && registros.length > 0) {
        // Usar cantidadPresentes directamente de cada registro
        // Cada registro es un resumen por grado+servicio
        registros.forEach((registro) => {
          const servicio = registro.id_servicio;
          const cantidad = registro.cantidadPresentes || 0;

          // Log detallado
          console.log(
            `  📊 Grado: ${registro.nombreGrado} - Servicio: ${servicio} (${registro.nombreServicio}) - Presentes: ${cantidad}`
          );

          if (servicio) {
            // Sumar cantidad de presentes por servicio
            if (!totales[servicio]) {
              totales[servicio] = 0;
            }
            totales[servicio] += cantidad;
            console.log(
              `  ✅ Acumulando en servicio ${servicio} - Total actual: ${totales[servicio]}`
            );
          }
        });
        console.log(`✅ Resumen final por servicio:`, totales);
      } else {
        console.log(`⚠️ No hay asistencias para fecha ${fecha}`);
      }

      return totales;
    } catch (error) {
      console.error("❌ Error al obtener total de asistencias:", error);
      return {};
    }
  },
};

export default asistenciaService;
