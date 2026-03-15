import AuditoriaLog from "../models/auditoriaLog.js";

/**
 * Función helper para validar si es un UUID válido
 */
const isValidUUID = (value) => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(String(value));
};

/**
 * Función helper para convertir UUID binario (16 bytes) a string
 */
const convertBinaryUUIDToString = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length !== 16) return null; // UUID binario debe ser 16 bytes
  
  try {
    // Convertir 16 bytes a hex y formatear como UUID
    const hex = buffer.toString('hex');
    // Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuid = [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32)
    ].join('-');
    
    return uuid;
  } catch (e) {
    return null;
  }
};

/**
 * Mapeo de rutas a módulos
 */
const rutasModulos = {
  "/api/roles": "Roles",
  "/api/usuarios": "Usuarios",
  "/api/consumos": "Consumos",
  "/api/grados": "Grados",
  "/api/insumos": "Insumos",
  "/api/inventarios": "Inventarios",
  "/api/items-recetas": "Items Recetas",
  "/api/lineaspedidos": "Líneas Pedidos",
  "/api/movimientos-inventarios": "Movimientos Inventarios",
  "/api/parametros-sistemas": "Parámetros Sistema",
  "/api/pedidos": "Pedidos",
  "/api/permisos": "Permisos",
  "/api/personas": "Personas",
  "/api/planificacion-menus": "Planificación Menús",
  "/api/proveedores": "Proveedores",
  "/api/recetas": "Recetas",
  "/api/registros-asistencias": "Registros Asistencias",
  "/api/rol-permisos": "Rol Permisos",
  "/api/servicios": "Servicios",
  "/api/servicio-turnos": "Servicio Turnos",
  "/api/recetas-servicios": "Recetas Servicios",
  "/api/turnos": "Turnos",
  "/api/proveedor-insumos": "Proveedor Insumos",
  "/api/alumno-grados": "Alumno Grados",
  "/api/docente-grados": "Docente Grados",
  "/api/reemplazo-docentes": "Reemplazo Docentes",
  "/api/estado-pedidos": "Estado Pedidos",
  "/api/tipos-merma": "Tipos Merma",
  "/api/alertas-inventario": "Alertas Inventario",
  "/api/generacion-automatica": "Generación Automática",
  "/api/escuela": "Escuela",
  "/api/configuracion-servicios-automaticos": "Configuración Servicios",
  "/api/asistencias": "Asistencias",
  "/api/telegram": "Telegram",
  "/api/auditoria": "Auditoría",
};

/**
 * Mapeo de módulos a tipos de registro (nombres singulares)
 */
const tiposRegistro = {
  "Roles": "Rol",
  "Usuarios": "Usuario",
  "Consumos": "Consumo",
  "Grados": "Grado",
  "Insumos": "Insumo",
  "Inventarios": "Inventario",
  "Items Recetas": "Item Receta",
  "Líneas Pedidos": "Línea Pedido",
  "Movimientos Inventarios": "Movimiento Inventario",
  "Parámetros Sistema": "Parámetro Sistema",
  "Pedidos": "Pedido",
  "Permisos": "Permiso",
  "Personas": "Persona",
  "Planificación Menús": "Planificación Menú",
  "Proveedores": "Proveedor",
  "Recetas": "Receta",
  "Registros Asistencias": "Registro Asistencia",
  "Rol Permisos": "Rol Permiso",
  "Servicios": "Servicio",
  "Servicio Turnos": "Servicio Turno",
  "Recetas Servicios": "Receta Servicio",
  "Turnos": "Turno",
  "Proveedor Insumos": "Proveedor Insumo",
  "Alumno Grados": "Alumno Grado",
  "Docente Grados": "Docente Grado",
  "Reemplazo Docentes": "Reemplazo Docente",
  "Estado Pedidos": "Estado Pedido",
  "Tipos Merma": "Tipo Merma",
  "Alertas Inventario": "Alerta Inventario",
  "Generación Automática": "Generación Automática",
  "Escuela": "Escuela",
  "Configuración Servicios": "Configuración Servicio",
  "Asistencias": "Asistencia",
  "Telegram": "Configuración Telegram",
  "Auditoría": "Registro Auditoría",
};

/**
 * Campos que no deben incluirse en las comparaciones de auditoría
 */
const camposExcluidos = [
  "password",
  "passwordHash",
  "token",
  "refreshToken",
  "createdAt",
  "updatedAt",
  "fechaHora",
  "estado",
];

/**
 * Función para detectar el módulo basado en la ruta
 */
const detectarModulo = (ruta) => {
  for (const [prefix, modulo] of Object.entries(rutasModulos)) {
    if (ruta.startsWith(prefix)) {
      return modulo;
    }
  }
  return "Sistema"; // Valor por defecto
};

/**
 * Función para comparar valores y generar cambios
 */
const generarCambios = (valorAnterior, valorNuevo) => {
  const cambios = {};
  
  // Si valorAnterior no existe, significa que es una creación
  if (!valorAnterior || Object.keys(valorAnterior).length === 0) {
    return null;
  }

  // Comparar valores anterior y nuevo
  for (const campo in valorNuevo) {
    if (camposExcluidos.includes(campo)) continue;
    
    const anterior = valorAnterior[campo];
    const nuevo = valorNuevo[campo];
    
    // Solo incluir si hubo cambio
    if (anterior !== nuevo) {
      cambios[campo] = {
        anterior: anterior !== undefined ? anterior : null,
        nuevo: nuevo !== undefined ? nuevo : null,
      };
    }
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
};

/**
 * Función helper para extraer el ID del registro afectado de múltiples fuentes
 */
const extraerIdRegistro = (req, data) => {
  // Orden de prioridad para buscar el ID
  const fuentes = [
    // 1. Parámetros de ruta
    () => req.params.id,
    () => req.params.idRecurso,
    () => req.params.idUsuario,
    () => req.params.idInsumo,
    () => req.params.idProveedor,
    () => req.params.idPersona,
    () => req.params.idReceta,
    () => req.params.idTurno,
    () => req.params.idServicio,
    () => req.params.idGrado,
    () => req.params.idRol,
    
    // 2. Body del request
    () => req.body?.id,
    () => req.body?.idRecurso,
    () => req.body?.idUsuario,
    
    // 3. Data de respuesta (nested)
    () => data?.data?.id,
    () => data?.data?.idRecurso,
    () => data?.data?.id_resource,
    () => data?.data?.idInsumo,
    () => data?.data?.idProveedor,
    () => data?.data?.idPersona,
    () => data?.data?.idReceta,
    () => data?.data?.idTurno,
    () => data?.data?.idServicio,
    () => data?.data?.idGrado,
    () => data?.data?.idRol,
    
    // 4. Data de respuesta (directo)
    () => data?.id,
    () => data?.idRecurso,

    // 5. Pedidos: crearPedidoManual → { pedidos: [{id_pedido}] }
    () => data?.pedidos?.[0]?.id_pedido,
    // 6. Pedido individual → { id_pedido }
    () => data?.id_pedido,
    // 7. Líneas Pedidos → { id_detallePedido }
    () => data?.id_detallePedido !== undefined ? String(data.id_detallePedido) : null,
  ];

  let idEncontrado = null;
  for (const fuente of fuentes) {
    try {
      const valor = fuente();
      if (valor && valor !== undefined && valor !== null) {
        idEncontrado = valor;
        break;
      }
    } catch (e) {
      // Ignorar errores en acceso a propiedades
    }
  }

  return idEncontrado || null;
};

const generarDescripcion = (accion, modulo, idRegistro, cambios) => {
  const tipoRegistro = tiposRegistro[modulo] || modulo;
  const maxLongitud = 500;
  
  // Log para depuración
  if (!idRegistro) {
    console.warn(`[Auditoria] generarDescripcion: idRegistro vacío para módulo ${modulo}, acción ${accion}`);
  }
  
  let descripcion;
  
  switch (accion) {
    case "CREAR":
      descripcion = `Se registró un nuevo ${tipoRegistro} #${idRegistro || "N/A"} en el módulo ${modulo}`;
      break;
    
    case "ACTUALIZAR":
      if (cambios && Object.keys(cambios).length > 0) {
        const campos = Object.keys(cambios).join(", ");
        descripcion = `Se modificó el ${campos} del ${tipoRegistro} #${idRegistro || "N/A"} en el módulo ${modulo}`;
      } else {
        descripcion = `Se actualizó el ${tipoRegistro} #${idRegistro || "N/A"} en el módulo ${modulo}`;
      }
      break;
    
    case "ELIMINAR":
      descripcion = `Se eliminó el ${tipoRegistro} #${idRegistro || "N/A"} del módulo ${modulo}`;
      break;
    
    default:
      descripcion = `Se ejecutó la acción ${accion} en el módulo ${modulo}`;
  }
  
  // Truncar la descripción si excede el límite
  if (descripcion.length > maxLongitud) {
    descripcion = descripcion.substring(0, maxLongitud - 3) + "...";
  }
  
  return descripcion;
};

/**
 * Función helper para capturar valor anterior ANTES de actualizar
 * Debe usarse en los controladores ANTES de hacer cualquier cambio en BD
 * 
 * Uso:
 * const valorAnterior = await capturarValorAnterior(Model, id);
 * await Model.update(id, {...});
 * req.auditoria = { valorAnterior };
 */
const capturarValorAnterior = async (model, id) => {
  try {
    // Intenta obtener usando métodos comunes
    if (model.obtenerPorId) {
      return await model.obtenerPorId(id);
    }
    if (model.findById) {
      return await model.findById(id);
    }
    if (model.getById) {
      return await model.getById(id);
    }
    return null;
  } catch (error) {
    console.error("Error capturando valor anterior:", error);
    return null;
  }
};

/**
 * Middleware para registrar automáticamente todas las acciones en la auditoría
 * Se ejecuta DESPUÉS de que la acción se complete
 */
const auditoriaMiddleware = (moduloPersonalizado, accion) => {
  return async (req, res, next) => {
    // Guardar el método original res.json
    const originalJson = res.json;
    // Guardar datos originales para comparación
    const datosOriginales = req.body;
    // Detectar el módulo de la ruta si no se proporciona uno personalizado
    const modulo = moduloPersonalizado || detectarModulo(req.path);

    // Sobrescribir res.json para capturar la respuesta
    res.json = function (data) {
      // Verificar si fue exitoso (manejar null/undefined)
      const esExitoso = res.statusCode < 400 && (data === null || data === undefined || data.success !== false);
      const esError = res.statusCode >= 400 || (data && data.success === false);

      // Solo registrar si fue exitoso Y es una acción que modifica datos
      // POST (crear), PUT/PATCH (actualizar), DELETE (eliminar)
      // NO registrar GET (consultas)
      const metodoModifica = ["POST", "PUT", "PATCH", "DELETE"].includes(
        req.method
      );

      if (metodoModifica && (esExitoso || esError)) {
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
          "Sistema";

        // Extraer ID del registro afectado - con validación mejorada
        let idRegistroAfectado = extraerIdRegistro(req, data);
        
        // Manejo especial para Buffers (UUIDs binarios desde la BD)
        if (Buffer.isBuffer(idRegistroAfectado)) {
          const convertedUUID = convertBinaryUUIDToString(idRegistroAfectado);
          idRegistroAfectado = convertedUUID || null;
        }
        
        // Asegurar que es una cadena
        if (idRegistroAfectado && typeof idRegistroAfectado !== 'string') {
          idRegistroAfectado = String(idRegistroAfectado);
        }
        
        // Validar que el ID sea un UUID válido o un número
        if (idRegistroAfectado && !isValidUUID(idRegistroAfectado)) {
          // Si no es UUID pero es un número, es válido también
          if (!/^\d+$/.test(idRegistroAfectado)) {
            console.warn(`[Auditoria] ID inválido descartado: ${idRegistroAfectado}`);
            idRegistroAfectado = null;
          }
        }

        // Preparar valores anterior y nuevo según la acción
        let valorAnterior = null;
        let valorNuevo = null;
        let cambios = null;
        let descripcion = "";
        let nivelCriticidad = "Bajo";
        let resultadoAccion = esExitoso ? "Éxito" : (esError ? "Error" : "Intento_fallido");

        // Capturar detalles según el tipo de acción
        if (accionAuditoria === "CREAR") {
          valorNuevo = datosOriginales;
          descripcion = generarDescripcion(accionAuditoria, modulo, idRegistroAfectado, null);
          nivelCriticidad = "Bajo";
        } else if (accionAuditoria === "ACTUALIZAR") {
          // Intentar obtener valor anterior de múltiples fuentes
          // 1. Si está disponible en req.auditoria (capture manual)
          valorAnterior = req.auditoria?.valorAnterior;
          
          // 2. Si no está disponible pero está en data.anterior (fallback)
          if (!valorAnterior && data.anterior) {
            valorAnterior = data.anterior;
          }
          
          valorNuevo = datosOriginales;
          
          // Generar cambios comparando valores si ambos están disponibles
          if (valorAnterior) {
            cambios = generarCambios(valorAnterior, valorNuevo);
          }
          
          descripcion = generarDescripcion(accionAuditoria, modulo, idRegistroAfectado, cambios);
          nivelCriticidad = "Medio";
        } else if (accionAuditoria === "ELIMINAR") {
          // El valor anterior sería los datos del registro eliminado
          valorAnterior = data.data || req.auditoria?.valorAnterior || null;
          descripcion = generarDescripcion(accionAuditoria, modulo, idRegistroAfectado, null);
          nivelCriticidad = "Alto";
        }

        // Registrar en auditoría
        const idUsuarioAuditoria =
          usuario.id_usuario || usuario.idUsuario || usuario.id;

        AuditoriaLog.crear({
          id_usuario: idUsuarioAuditoria,
          nombreUsuario: nombreUsuario,
          email: usuario.email || "",
          accion: accionAuditoria,
          modulo,
          descripcion,
          detalles: cambios || datosOriginales,
          ip: ip.split(",")[0].trim(),
          userAgent,
          valor_anterior: valorAnterior,
          valor_nuevo: valorNuevo,
          id_registro_afectado: idRegistroAfectado,
          nivel_criticidad: nivelCriticidad,
          resultado_accion: resultadoAccion,
        }).catch((error) => {
          console.error("❌ Error al registrar en auditoría:", error);
        });
      }

      // Llamar al método original
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Función helper para registrar acciones manualmente con formato estándar
 * Útil para acciones que necesitan lógica especial como capturar valores anteriores
 * 
 * Uso recomendado:
 * registrarAuditoria(req, "ACTUALIZAR", "Usuarios", null, {
 *   valor_anterior: datosAnteriores,
 *   valor_nuevo: datosNuevos,
 *   id_registro_afectado: usuarioId,
 * });
 */
const registrarAuditoria = async (
  req,
  accion,
  modulo,
  descripcionPersonalizada = null,
  opciones = {}
) => {
  try {
    const usuario = req.user || {};
    const ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    let idRegistroAfectado = opciones.id_registro_afectado || null;
    
    // Manejo especial para Buffers (UUIDs binarios desde la BD)
    if (Buffer.isBuffer(idRegistroAfectado)) {
      const convertedUUID = convertBinaryUUIDToString(idRegistroAfectado);
      idRegistroAfectado = convertedUUID || null;
    }
    
    // Asegurar que es una cadena
    if (idRegistroAfectado && typeof idRegistroAfectado !== 'string') {
      idRegistroAfectado = String(idRegistroAfectado);
    }
    
    // Validar que el ID sea un UUID válido o un número
    if (idRegistroAfectado && !isValidUUID(idRegistroAfectado)) {
      // Si no es UUID pero es un número, es válido también
      if (!/^\d+$/.test(idRegistroAfectado)) {
        console.warn(`[Auditoria] ID inválido descartado en registrarAuditoria: ${idRegistroAfectado}`);
        idRegistroAfectado = null;
      }
    }
    
    const valorAnterior = opciones.valor_anterior || null;
    const valorNuevo = opciones.valor_nuevo || null;
    
    // Generar cambios si se proporcionan ambos valores
    let cambios = null;
    if (valorAnterior && valorNuevo) {
      cambios = generarCambios(valorAnterior, valorNuevo);
    }

    // Generar descripción estándar si no se proporciona una personalizada
    const descripcion = descripcionPersonalizada || 
                       generarDescripcion(accion, modulo, idRegistroAfectado, cambios);

    // Mapear nivel de criticidad
    let nivelCriticidad = opciones.nivelCriticidad || "Bajo";
    if (accion === "ELIMINAR") nivelCriticidad = "Alto";
    else if (accion === "ACTUALIZAR") nivelCriticidad = "Medio";

    const resultadoAccion = opciones.resultadoAccion || "Éxito";

    await AuditoriaLog.crear({
      id_usuario: usuario.id_usuario || usuario.idUsuario || null,
      nombreUsuario: usuario.nombre || usuario.nombreUsuario || "Sistema",
      email: usuario.email || "",
      accion,
      modulo,
      descripcion,
      detalles: cambios || valorNuevo,
      ip: ip.split(",")[0].trim(),
      userAgent,
      valor_anterior: valorAnterior,
      valor_nuevo: valorNuevo,
      id_registro_afectado: idRegistroAfectado,
      nivel_criticidad: nivelCriticidad,
      resultado_accion: resultadoAccion,
    });
  } catch (error) {
    console.error("Error al registrar auditoría:", error);
  }
};

export { auditoriaMiddleware, registrarAuditoria, detectarModulo, capturarValorAnterior };
