/**
 * Utilidades de formateo regional es-AR (Argentina)
 *
 * Separador decimal : coma  (,)
 * Separador de miles: punto (.)
 *
 * La coma solo se usa para PRESENTACIÓN.
 * La lógica interna y la comunicación con el backend siempre usan punto.
 */

const LOCALE = 'es-AR';

/**
 * Formatea un valor numérico con locale es-AR.
 *
 * @param {number|string} value    - Valor a formatear
 * @param {number}        [decimales=3] - Cantidad exacta de decimales a mostrar
 * @returns {string} Número con formato regional (ej: "1,500" para 1.5 con 3 decimales)
 */
export function formatNumeroAR(value, decimales = 3) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0,' + '0'.repeat(decimales);
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(num);
}

/**
 * Parsea un string ingresado por el usuario.
 * Acepta tanto coma (,) como punto (.) como separador decimal.
 * Devuelve un float con punto (para uso interno y envío al backend).
 *
 * @param {string|number} str - Cadena de entrada del usuario
 * @returns {number} Valor float, o NaN si la cadena no es válida
 */
export function parsearDecimalAR(str) {
  if (str === null || str === undefined || str === '') return NaN;
  // Reemplazar ultima coma por punto para parseo interno
  const normalizado = String(str).trim().replace(',', '.');
  return parseFloat(normalizado);
}

/**
 * Sanitiza el input de un campo de texto numérico decimal.
 * Permite solo dígitos y un único separador decimal (coma o punto).
 * Acepta un signo negativo inicial opcional.
 *
 * @param {string} str - Cadena cruda del evento onChange
 * @returns {string} Cadena sanitizada apta para mostrar en el input
 */
export function sanitizarInputDecimal(str) {
  const s = String(str);
  // Permitir signo negativo, dígitos, y un solo separador (coma o punto)
  const sinInvalidos = s.replace(/[^0-9.,-]/g, '');
  // Asegurar que haya a lo sumo un separador decimal (toma el primero encontrado)
  const partes = sinInvalidos.split(/[.,]/);
  if (partes.length === 1) return sinInvalidos;
  const separador = sinInvalidos.match(/[.,]/)?.[0] ?? '.';
  return partes[0] + separador + partes.slice(1).join('');
}
