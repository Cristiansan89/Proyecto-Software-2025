// Datos de prueba para testear el componente Consumos
// Este archivo puede ser usado para verificar que el componente funciona correctamente

const datosConsumosPrueba = [
  {
    id_consumo: "550e8400-e29b-41d4-a716-446655440001",
    id_servicio: 1,
    id_turno: 1,
    fecha: "2024-12-01",
    fecha_registro: "2024-12-01T08:00:00Z",
    nombreServicio: "Desayuno",
    nombreTurno: "Mañana",
    nombreUsuario: "Ana García",
    observaciones: "Consumo normal",
    estado: "activo",
  },
  {
    id_consumo: "550e8400-e29b-41d4-a716-446655440002",
    id_servicio: 2,
    id_turno: 2,
    fecha: "2024-12-01",
    fecha_registro: "2024-12-01T12:00:00Z",
    nombreServicio: "Almuerzo",
    nombreTurno: "Tarde",
    nombreUsuario: "Carlos López",
    observaciones: "Mayor cantidad que usual",
    estado: "activo",
  },
  {
    id_consumo: "550e8400-e29b-41d4-a716-446655440003",
    id_servicio: 3,
    id_turno: 3,
    fecha: "2024-12-01",
    fecha_registro: "2024-12-01T18:00:00Z",
    nombreServicio: "Cena",
    nombreTurno: "Noche",
    nombreUsuario: "María Rodríguez",
    observaciones: null,
    estado: "activo",
  },
  {
    id_consumo: "550e8400-e29b-41d4-a716-446655440004",
    id_servicio: 1,
    id_turno: 1,
    fecha: "2024-12-02",
    fecha_registro: "2024-12-02T08:15:00Z",
    nombreServicio: "Desayuno",
    nombreTurno: "Mañana",
    nombreUsuario: "Pedro Martínez",
    observaciones: "Consumo reducido",
    estado: "activo",
  },
  {
    id_consumo: "550e8400-e29b-41d4-a716-446655440005",
    id_servicio: 2,
    id_turno: 2,
    fecha: "2024-12-02",
    fecha_registro: "2024-12-02T12:30:00Z",
    nombreServicio: "Almuerzo",
    nombreTurno: "Tarde",
    nombreUsuario: "Laura Sánchez",
    observaciones: "Todo en orden",
    estado: "activo",
  },
];

// Estadísticas de ejemplo
const estadisticasPrueba = {
  totalRegistros: 5,
  totalConsumos: 5,
  promedioConsumos: 1.67,
  servicioMasConsumido: "Desayuno",
};

// Función para simular la API durante desarrollo
export const mockConsumoAPI = {
  obtenerConsumos: (filtros = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let datosFiltrados = [...datosConsumosPrueba];

        if (filtros.fechaInicio) {
          datosFiltrados = datosFiltrados.filter(
            (c) => c.fecha >= filtros.fechaInicio
          );
        }
        if (filtros.fechaFin) {
          datosFiltrados = datosFiltrados.filter(
            (c) => c.fecha <= filtros.fechaFin
          );
        }
        if (filtros.idServicio) {
          datosFiltrados = datosFiltrados.filter(
            (c) => c.id_servicio === parseInt(filtros.idServicio)
          );
        }

        resolve({
          success: true,
          data: datosFiltrados,
          message: "Consumos obtenidos exitosamente",
        });
      }, 500); // Simular latencia
    });
  },

  obtenerEstadisticas: (filtros = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: estadisticasPrueba,
          message: "Estadísticas obtenidas exitosamente",
        });
      }, 300);
    });
  },

  crearConsumo: (nuevoConsumo) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const consumoConId = {
          ...nuevoConsumo,
          id_consumo: `550e8400-e29b-41d4-a716-44665544${String(
            Date.now()
          ).slice(-4)}`,
          fecha_registro: new Date().toISOString(),
        };

        resolve({
          success: true,
          data: consumoConId,
          message: "Consumo creado exitosamente",
        });
      }, 400);
    });
  },

  eliminarConsumo: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Consumo eliminado exitosamente",
        });
      }, 300);
    });
  },
};

export { datosConsumosPrueba, estadisticasPrueba };
