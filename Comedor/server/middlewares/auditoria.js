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

      // Solo registrar si fue exitoso Y es una acción que modifica datos
      // POST (crear), PUT/PATCH (actualizar), DELETE (eliminar)
      // NO registrar GET (consultas)
      const metodoModifica = ["POST", "PUT", "PATCH", "DELETE"].includes(
        req.method
      );

      if (esExitoso && metodoModifica) {
        // Obtener información del usuario
        const usuario = req.user || {};
        const ip =
          req.headers["x-forwarded-for"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          "";
        const userAgent = req.headers["user-agent"] || "";

        // Mapear el método HTTP a la acción de auditoría
        let accionAuditoria = "CONSULTAR";
        if (req.method === "POST") accionAuditoria = "CREAR";
        else if (req.method === "PUT" || req.method === "PATCH")
          accionAuditoria = "ACTUALIZAR";
        else if (req.method === "DELETE") accionAuditoria = "ELIMINAR";

        // Obtener nombre del usuario
        const nombreUsuario =
          usuario.nombreUsuario ||
          usuario.nombre ||
          usuario.nombreUsuario ||
          "Sistema";

        console.log(
          `📝 Auditoría: ${accionAuditoria} en ${modulo} por ${nombreUsuario}`
        );

        // Preparar descripción basada en la acción
        let descripcion = `${accionAuditoria} en ${modulo}`;
        let detalles = null;

        // Capturar detalles según el tipo de acción
        if (accionAuditoria === "CREAR") {
          descripcion = `Creó un nuevo registro en ${modulo}`;
          detalles = {
            recursoCreado: data.data?.id || data.data?.id_resource || "N/A",
            datos: req.body,
          };
        } else if (accionAuditoria === "ACTUALIZAR") {
          descripcion = `Actualizó un registro en ${modulo}`;
          detalles = {
            idRecurso: req.params.id || req.params.idRecurso,
            cambios: req.body,
          };
        } else if (accionAuditoria === "ELIMINAR") {
          descripcion = `Eliminó un registro de ${modulo}`;
          detalles = {
            idRecursoEliminado: req.params.id || req.params.idRecurso,
          };
        }

        // Registrar en auditoría
        const idUsuarioAuditoria =
          usuario.id_usuario || usuario.idUsuario || usuario.id;

        if (idUsuarioAuditoria) {
          AuditoriaLog.crear({
            id_usuario: idUsuarioAuditoria,
            nombreUsuario: nombreUsuario,
            email: usuario.email || "",
            accion: accionAuditoria,
            modulo,
            descripcion,
            detalles,
            ip: ip.split(",")[0].trim(),
            userAgent,
          }).catch((error) => {
            console.error("❌ Error al registrar en auditoría:", error);
          });
        }
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
