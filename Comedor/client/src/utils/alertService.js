import Swal from "sweetalert2";

/**
 * Muestra una alerta de éxito
 * @param {string} title - Título del alerta
 * @param {string} message - Mensaje del alerta
 * @param {number} timer - Tiempo en ms antes de cerrarse (opcional)
 */
export const showSuccess = (title = "Éxito", message = "", timer = 2000) => {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    timer,
    timerProgressBar: true,
    showConfirmButton: timer ? false : true,
    confirmButtonColor: "#28a745",
  });
};

/**
 * Muestra una alerta de error
 * @param {string} title - Título del alerta
 * @param {string} message - Mensaje del alerta
 */
export const showError = (title = "Error", message = "") => {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: "#dc3545",
  });
};

/**
 * Muestra una alerta de advertencia
 * @param {string} title - Título del alerta
 * @param {string} message - Mensaje del alerta
 */
export const showWarning = (title = "Advertencia", message = "") => {
  return Swal.fire({
    icon: "warning",
    title,
    text: message,
    confirmButtonColor: "#ffc107",
    confirmButtonTextColor: "#000",
  });
};

/**
 * Muestra una alerta informativa
 * @param {string} title - Título del alerta
 * @param {string} message - Mensaje del alerta
 */
export const showInfo = (title = "Información", message = "") => {
  return Swal.fire({
    icon: "info",
    title,
    text: message,
    confirmButtonColor: "#17a2b8",
  });
};

export const showInfoError = (title = "Información", message = "") => {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: "#b8172aff",
  });
};

// Dentro de tu archivo de utilidades/alertas
export const showInfoAuditoria = (titulo, contenido) => {
  Swal.fire({
    title: titulo,
    html: contenido, // <--- ESTO ES LA CLAVE, no uses 'text'
    confirmButtonText: "Cerrar",
  });
};

/**
 * Muestra un diálogo de confirmación
 * @param {string} title - Título del alerta
 * @param {string} message - Mensaje del alerta
 * @param {string} confirmButtonText - Texto del botón confirmar
 * @param {string} cancelButtonText - Texto del botón cancelar
 * @returns {Promise} - Resuelve true si se confirma, false si se cancela
 */
export const showConfirm = (
  title = "¿Estás seguro?",
  message = "",
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar"
) => {
  return Swal.fire({
    icon: "question",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText,
    cancelButtonText,
  }).then((result) => result.isConfirmed);
};

/**
 * Muestra un diálogo de confirmación de eliminación
 * @param {string} itemName - Nombre del elemento a eliminar
 * @returns {Promise} - Resuelve true si se confirma, false si se cancela
 */
export const showDeleteConfirm = (itemName = "este elemento") => {
  return Swal.fire({
    icon: "warning",
    title: "¿Eliminar?",
    text: `¿Estás seguro de que deseas eliminar ${itemName}? Esta acción no se puede deshacer.`,
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => result.isConfirmed);
};

/**
 * Muestra un modal con contenido HTML
 * @param {string} title - Título del alerta
 * @param {string} htmlContent - Contenido HTML
 */
export const showHtml = (title = "", htmlContent = "") => {
  return Swal.fire({
    icon: "info",
    title,
    html: htmlContent,
    confirmButtonColor: "#17a2b8",
  });
};

/**
 * Muestra un toast (notificación pequeña)
 * @param {string} message - Mensaje del toast
 * @param {string} icon - Icono ('success', 'error', 'warning', 'info')
 * @param {number} timer - Tiempo en ms antes de cerrarse
 */
export const showToast = (message = "", icon = "warning", timer = 4000) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon,
    title: message,
  });
};

/**
 * Muestra un diálogo para cancelar con motivo
 * @param {string} title - Título del alerta
 * @param {string} placeholder - Placeholder del textarea
 * @returns {Promise} - Resuelve con el motivo ingresado o null si se cancela
 */
export const showCancelar = (
  title = "Cancelar",
  placeholder = "Escriba el motivo aquí..."
) => {
  return Swal.fire({
    title,
    text: "Por favor, ingrese el motivo de la cancelación:",
    input: "textarea",
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "Confirmar Cancelación",
    cancelButtonText: "Volver",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    inputValidator: (value) => {
      if (!value) {
        return "¡Es obligatorio ingresar un motivo!";
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      return result.value; // Retorna el motivo ingresado
    }
    return null; // Retorna null si se cancela
  });
};
