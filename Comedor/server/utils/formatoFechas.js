/**
 * Formatea una fecha sin conversión de zona horaria
 * Evita el problema de JavaScript interpretando strings ISO como UTC
 * 
 * @param {string|Date} fecha - Fecha en formato YYYY-MM-DD o objeto Date
 * @param {string} idioma - Código de idioma (ej: 'es-ES', 'en-US')
 * @returns {string} Fecha formateada (ej: "11/3/2026")
 */
export function formatearFechaLocal(fecha, idioma = 'es-ES') {
  if (!fecha) return 'Sin fecha';
  
  let fechaObj;
  
  if (typeof fecha === 'string') {
    // Si es un string en formato YYYY-MM-DD, parsear localmente
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [año, mes, día] = fecha.split('-').map(Number);
      // Crear fecha local directamente SIN conversión UTC
      fechaObj = new Date(año, mes - 1, día);
    } else {
      // Si es otro formato, intentar con constructor estándar
      fechaObj = new Date(fecha);
    }
  } else if (fecha instanceof Date) {
    fechaObj = fecha;
  } else {
    return 'Formato de fecha inválido';
  }
  
  return fechaObj.toLocaleDateString(idioma);
}

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD
 * Sin conversión UTC
 * 
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function obtenerFechaActualLocal() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const día = String(ahora.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
}
