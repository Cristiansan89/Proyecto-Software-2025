/**
 * Utilidades para manejo de fechas en el frontend
 */

/**
 * Parsea una fecha de forma segura evitando desplazamientos UTC.
 * Si la cadena es solo YYYY-MM-DD se construye como fecha local.
 */
const parseFecha = (fecha) => {
  if (!fecha) return null;
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? null : fecha;
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Convierte un timestamp completo o fecha a solo el año.
 * Evita desfasajes por zona horaria al manejar fechas en formato YYYY-MM-DD.
 * @param {string|number|Date} fecha - La fecha a normalizar
 * @returns {string|number} - Solo el año o el valor original si ya es un año simple
 */
export const formatCicloLectivo = (fecha) => {
  if (!fecha) return "N/A";

  if (typeof fecha === "number") return fecha;

  if (fecha instanceof Date) {
    if (!Number.isNaN(fecha.getTime())) {
      return Number(
        fecha.toISOString().match(/^(\d{4})-/)?.[1] ?? fecha.getFullYear(),
      );
    }
    return "N/A";
  }

  const fechaStr = String(fecha).trim();

  if (/^\d{4}$/.test(fechaStr)) return fechaStr;
  const match = fechaStr.match(/^(\d{4})-/);
  if (match) return Number(match[1]);
  const parsed = parseFecha(fecha);
  if (parsed) return parsed.getFullYear();

  return fechaStr;
};

// Opciones Intl compartidas (garantizan cero-relleno independiente del entorno)
const OPTS_DATE = { day: "2-digit", month: "2-digit", year: "numeric" };
const OPTS_DATETIME = {
  ...OPTS_DATE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};
const OPTS_DATETIME_SEC = { ...OPTS_DATETIME, second: "2-digit" };
const LOCALE = "es-AR"; // dd/mm/aaaa garantizado

/**
 * Formatea una fecha al formato DD/MM/AAAA (zero-padded, ignorando hora).
 * Maneja YYYY-MM-DD sin desplazamiento UTC.
 * @param {string|Date} fecha
 * @returns {string} "19/03/2026" o 'N/A'
 */
export const formatDate = (fecha) => {
  const d = parseFecha(fecha);
  if (!d) return "N/A";
  try {
    return new Intl.DateTimeFormat(LOCALE, OPTS_DATE).format(d);
  } catch {
    return "N/A";
  }
};

/**
 * Formatea fecha y hora al formato DD/MM/AAAA HH:mm.
 * @param {string|Date} fecha
 * @returns {string} "19/03/2026 14:35" o 'N/A'
 */
export const formatDateTime = (fecha) => {
  const d = parseFecha(fecha);
  if (!d) return "N/A";
  try {
    return new Intl.DateTimeFormat(LOCALE, OPTS_DATETIME).format(d);
  } catch {
    return "N/A";
  }
};

/**
 * Formatea fecha y hora incluyendo segundos: DD/MM/AAAA HH:mm:ss.
 * Usar en reportes de auditoría.
 * @param {string|Date} fecha
 * @returns {string} "19/03/2026 14:35:07" o 'N/A'
 */
export const formatAuditDateTime = (fecha) => {
  const d = parseFecha(fecha);
  if (!d) return "N/A";
  try {
    return new Intl.DateTimeFormat(LOCALE, OPTS_DATETIME_SEC).format(d);
  } catch {
    return "N/A";
  }
};

/**
 * Formatea la última actividad del usuario de manera más legible
 * @param {string|Date} fecha - La fecha de última actividad
 * @returns {object} - Objeto con fecha, hora y mensaje de tiempo relativo
 */
export const formatLastActivity = (fecha) => {
  if (!fecha) {
    return {
      fecha: null,
      hora: null,
      relativeTime: "Nunca",
      isNever: true,
    };
  }

  try {
    const fechaObj = new Date(fecha);
    const now = new Date();
    const diffMs = now - fechaObj;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let relativeTime;
    if (diffMins < 1) {
      relativeTime = "Hace un momento";
    } else if (diffMins < 60) {
      relativeTime = `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      relativeTime = `Hace ${diffHours}h`;
    } else if (diffDays < 7) {
      relativeTime = `Hace ${diffDays}d`;
    } else {
      relativeTime = fechaObj.toLocaleDateString("es-ES");
    }

    return {
      fecha: fechaObj.toLocaleDateString("es-ES"),
      hora: fechaObj.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      relativeTime,
      isNever: false,
      isRecent: diffHours < 24,
    };
  } catch {
    return {
      fecha: null,
      hora: null,
      relativeTime: "Error",
      isNever: true,
    };
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
  if (fechaStr.includes("T")) {
    return fechaStr.split("T")[0];
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
