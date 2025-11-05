/**
 * Utilidades para manejo de fechas en el frontend
 */

/**
 * Convierte un timestamp completo o fecha a solo el año
 * @param {string|number} fecha - La fecha a normalizar
 * @returns {string|number} - Solo el año o el valor original si no es una fecha con timestamp
 */
export const formatCicloLectivo = (fecha) => {
    if (!fecha) return 'N/A';

    const fechaStr = fecha.toString();

    // Si es un timestamp completo (contiene 'T'), extraer solo el año
    if (fechaStr.includes('T')) {
        return new Date(fecha).getFullYear();
    }

    // Si ya es solo un año, devolverlo tal como está
    return fecha;
};

/**
 * Formatea una fecha para mostrar en formato local
 * @param {string|Date} fecha - La fecha a formatear
 * @returns {string} - Fecha formateada o 'N/A' si no es válida
 */
export const formatDate = (fecha) => {
    if (!fecha) return 'N/A';

    try {
        return new Date(fecha).toLocaleDateString();
    } catch {
        return 'N/A';
    }
};

/**
 * Formatea una fecha y hora para mostrar en formato local
 * @param {string|Date} fecha - La fecha a formatear
 * @returns {string} - Fecha y hora formateadas o 'N/A' si no es válida
 */
export const formatDateTime = (fecha) => {
    if (!fecha) return 'N/A';

    try {
        return new Date(fecha).toLocaleString();
    } catch {
        return 'N/A';
    }
};

/**
 * Normaliza una fecha de timestamp a formato YYYY-MM-DD para envío al backend
 * @param {string|Date} fecha - La fecha a normalizar
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const normalizeDateToServer = (fecha) => {
    if (!fecha) return fecha;

    const fechaStr = String(fecha);

    // Si es un timestamp completo, convertir a fecha
    if (fechaStr.includes('T')) {
        return fechaStr.split('T')[0];
    }

    return fechaStr;
};

/**
 * Obtiene el año actual
 * @returns {number} - Año actual
 */
export const getCurrentYear = () => {
    return new Date().getFullYear();
};

/**
 * Valida si un año es válido para ciclo lectivo
 * @param {number|string} año - El año a validar
 * @returns {boolean} - True si es válido
 */
export const isValidCicloLectivo = (año) => {
    const añoNum = parseInt(año);
    const currentYear = getCurrentYear();
    return añoNum >= 2020 && añoNum <= currentYear + 5;
};