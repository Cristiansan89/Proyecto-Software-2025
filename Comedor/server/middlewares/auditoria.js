import AuditoriaLog from "../models/auditoriaLog.js";

/**
 * Middleware para registrar automáticamente todas las acciones en la auditoría
 * Se ejecuta DESPUÉS de que la acción se complete
 */
const auditoriaMiddleware = (modulo, accion) => {
  return async (req, res, next) => {
    // Guardar el método original res.json
    const originalJson = res.json;

    // Sobrescribir res.json para capturar la respuesta
    res.json = function (data) {
      // Verificar si fue exitoso
      const esExitoso = res.statusCode < 400 && data.success !== false;

      // Solo registrar si fue exitoso
      if (esExitoso) {
        // Obtener información del usuario
        const usuario = req.user || {};
        const ip =
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          "";
        const userAgent = req.headers["user-agent"] || "";

        // Preparar descripción basada en la acción
        let descripcion = `${accion} en ${modulo}`;
        let detalles = null;

        // Capturar detalles según el tipo de acción
        if (accion === "CREAR") {
          descripcion = `Creó un nuevo registro en ${modulo}`;
          detalles = {
            recursoCreado: data.data?.id || data.data?.id_resource || "N/A",
            datos: req.body,
          };
        } else if (accion === "ACTUALIZAR") {
          descripcion = `Actualizó un registro en ${modulo}`;
          detalles = {
            idRecurso: req.params.id || req.params.idRecurso,
            cambios: req.body,
          };
        } else if (accion === "ELIMINAR") {
          descripcion = `Eliminó un registro de ${modulo}`;
          detalles = {
            idRecursoEliminado: req.params.id || req.params.idRecurso,
          };
        } else if (accion === "CONSULTAR") {
          descripcion = `Consultó datos de ${modulo}`;
          detalles = {
            filtros: req.query,
            resultados: data.data?.length || 0,
          };
        } else if (accion === "DESCARGAR") {
          descripcion = `Descargó reporte de ${modulo}`;
          detalles = {
            formato: req.query.formato || "PDF",
            parametros: req.query,
          };
        }

        // Registrar en auditoría (sin esperar respuesta)
        AuditoriaLog.crear({
          id_usuario: usuario.id_usuario || usuario.idUsuario || null,
          nombreUsuario: usuario.nombre || usuario.nombreUsuario || "Sistema",
          email: usuario.email || "",
          accion,
          modulo,
          descripcion,
          detalles,
          ip: ip.split(",")[0].trim(),
          userAgent,
        }).catch((error) => {
          console.error("Error al registrar en auditoría:", error);
        });
      }

      // Llamar al método original
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Función helper para registrar acciones manualmente
 * Útil para acciones que necesitan lógica especial
 */
const registrarAuditoria = async (
  req,
  accion,
  modulo,
  descripcion,
  detalles
) => {
  try {
    const usuario = req.user || {};
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    await AuditoriaLog.crear({
      id_usuario: usuario.id_usuario || usuario.idUsuario || null,
      nombreUsuario: usuario.nombre || usuario.nombreUsuario || "Sistema",
      email: usuario.email || "",
      accion,
      modulo,
      descripcion,
      detalles,
      ip: ip.split(",")[0].trim(),
      userAgent,
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
};

export { auditoriaMiddleware, registrarAuditoria };
