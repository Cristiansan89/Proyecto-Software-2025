/**
 * Utilidad centralizada para normalizar cantidades entre unidades de medida.
 * Devuelve siempre un float con exactamente 3 decimales.
 *
 * Reglas de conversión:
 *  - gramo / gramos → kilogramos (÷ 1000)
 *  - mililitro / mililitros → litros (÷ 1000)
 *  - kilogramo / kilogramos / litro / litros / unidad / unidades → sin conversión
 *
 * @param {number|string} value - Cantidad a normalizar (puede ser string de input)
 * @param {string} unit - Unidad de medida (case-insensitive)
 * @returns {number} Cantidad normalizada con 3 decimales de precisión
 */
export function normalizeQuantity(value, unit) {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return 0;

  const u = String(unit || "").toLowerCase().trim();

  let result;
  if (u === "gramo" || u === "gramos" || u === "g") {
    result = num / 1000; // gramos → kilogramos
  } else if (u === "mililitro" || u === "mililitros" || u === "ml") {
    result = num / 1000; // mililitros → litros
  } else {
    result = num; // kilogramos, litros, unidades, etc. → sin conversión
  }

  // Redondear a 3 decimales usando Number para evitar artefactos de punto flotante
  return parseFloat(result.toFixed(3));
}

/**
 * Formatea un número para mostrar siempre 3 decimales en la interfaz.
 * Útil para tablas, reportes PDF/CSV y mensajes de Telegram.
 *
 * @param {number|string} value - Valor a formatear
 * @returns {string} Valor con exactamente 3 decimales (ej: "15.450")
 */
export function formatDecimal(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.000";
  return num.toFixed(3);
}

/**
 * Formatea un número con 3 decimales usando separador COMA (es-AR).
 * Usar en mensajes de Telegram y cualquier texto visible al usuario.
 *
 * @param {number|string} value - Valor a formatear
 * @returns {string} Valor con exactamente 3 decimales y coma decimal (ej: "0,850")
 */
export function formatDecimalAR(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,000";
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(num);
}
