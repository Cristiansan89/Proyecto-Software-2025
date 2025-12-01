/**
 * Utilitarios para manejo de fechas de entrega
 */

/**
 * Calcula la fecha de entrega laborable (día siguiente, evitando fines de semana)
 * a partir de la fecha de aprobación para mostrar en el frontend
 * @param {Date} fechaAprobacion - Fecha de aprobación del pedido
 * @returns {Date} Fecha de entrega calculada
 */
export const calcularFechaEntrega = (fechaAprobacion = new Date()) => {
  const fecha = new Date(fechaAprobacion);

  // Agregar 1 día a la fecha de aprobación
  fecha.setDate(fecha.getDate() + 1);

  // Si cae en sábado (6), mover al lunes
  if (fecha.getDay() === 6) {
    fecha.setDate(fecha.getDate() + 2);
  }
  // Si cae en domingo (0), mover al lunes
  else if (fecha.getDay() === 0) {
    fecha.setDate(fecha.getDate() + 1);
  }

  return fecha;
};

/**
 * Calcula la fecha de entrega laborable a partir de una fecha string de aprobación
 * @param {string} fechaAprobacionString - Fecha en formato 'YYYY-MM-DD'
 * @returns {string} Fecha de entrega en formato 'YYYY-MM-DD'
 */
export const calcularFechaEntregaDesdeAprobacion = (fechaAprobacionString) => {
  const fecha = new Date(fechaAprobacionString);
  const fechaEntrega = calcularFechaEntrega(fecha);

  // Convertir a formato YYYY-MM-DD para MySQL
  return fechaEntrega.toISOString().split("T")[0];
};

/**
 * Verifica si una fecha es día laborable (lunes a viernes)
 * @param {Date} fecha - Fecha a verificar
 * @returns {boolean} true si es día laborable
 */
export const esDiaLaborable = (fecha) => {
  const dia = fecha.getDay();
  return dia >= 1 && dia <= 5; // Lunes (1) a Viernes (5)
};

/**
 * Formatea una fecha para mostrar de forma amigable
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "Miércoles 4 de Diciembre, 2025")
 */
export const formatearFechaEntrega = (fecha) => {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  const opciones = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return fechaObj.toLocaleDateString("es-ES", opciones);
};
