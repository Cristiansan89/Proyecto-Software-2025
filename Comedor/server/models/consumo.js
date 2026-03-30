import { connection } from "./db.js";

// Función para normalizar nombres de unidades
export function normalizarUnidad(unidad) {
  if (!unidad) return "Unidades";

  const unidadLower = String(unidad).toLowerCase().trim();

  // Sólidos
  if (
    unidadLower === "gramo" ||
    unidadLower === "gramos" ||
    unidadLower === "g"
  ) {
    return "Gramos";
  }
  if (
    unidadLower === "kilogramo" ||
    unidadLower === "kilogramos" ||
    unidadLower === "kg"
  ) {
    return "Kilogramos";
  }

  // Líquidos
  if (
    unidadLower === "mililitro" ||
    unidadLower === "mililitros" ||
    unidadLower === "ml"
  ) {
    return "Mililitros";
  }
  if (
    unidadLower === "litro" ||
    unidadLower === "litros" ||
    unidadLower === "l"
  ) {
    return "Litros";
  }

  // Unidades
  if (
    unidadLower === "unidad" ||
    unidadLower === "unidades" ||
    unidadLower === "u"
  ) {
    return "Unidades";
  }

  // Si no se reconoce, retornar la original
  return "Unidades";
}

// Función para convertir unidades de medida
export function convertirUnidad(cantidad, unidadOrigen, unidadDestino) {
  if (unidadOrigen === unidadDestino) {
    return { cantidad, unidad: unidadOrigen };
  }

  // Definir factores de conversión a unidades base
  // Sólidos: Gramos es la base
  const factoresGramos = {
    Gramos: 1,
    Kilogramos: 1000,
  };

  // Líquidos: Mililitros es la base
  const factoresMililitros = {
    Mililitros: 1,
    Litros: 1000,
  };

  // Determinar grupos de unidades
  const esLiquidoOrigen = ["Mililitros", "Litros"].includes(unidadOrigen);
  const esLiquidoDestino = ["Mililitros", "Litros"].includes(unidadDestino);
  const esSolidoOrigen = ["Gramos", "Kilogramos"].includes(unidadOrigen);
  const esSolidoDestino = ["Gramos", "Kilogramos"].includes(unidadDestino);

  // Si es solido a solido
  if (esSolidoOrigen && esSolidoDestino) {
    const cantidadEnGramos = cantidad * factoresGramos[unidadOrigen];
    const cantidadFinal = cantidadEnGramos / factoresGramos[unidadDestino];
    // Preservar 3 decimales sin redondear a entero
    return {
      cantidad: parseFloat(cantidadFinal.toFixed(3)),
      unidad: unidadDestino,
    };
  }

  // Si es liquido a liquido
  if (esLiquidoOrigen && esLiquidoDestino) {
    const cantidadEnMililitros = cantidad * factoresMililitros[unidadOrigen];
    const cantidadFinal =
      cantidadEnMililitros / factoresMililitros[unidadDestino];
    // Preservar 3 decimales sin redondear a entero
    return {
      cantidad: parseFloat(cantidadFinal.toFixed(3)),
      unidad: unidadDestino,
    };
  }

  // Si las unidades no son compatibles, retornar sin cambios
  return { cantidad, unidad: unidadOrigen };
}

// Función para obtener la mejor unidad de representación
export function obtenerMejorUnidad(cantidad, unidadActual) {
  const esLiquido = ["Mililitros", "Litros"].includes(unidadActual);

  if (esLiquido) {
    if (cantidad >= 1000) {
      return convertirUnidad(cantidad, unidadActual, "Litros");
    }
    return { cantidad, unidad: unidadActual };
  } else {
    if (cantidad >= 1000) {
      return convertirUnidad(cantidad, unidadActual, "Kilogramos");
    }
    return { cantidad, unidad: unidadActual };
  }
}

// Función para determinar si dos unidades son compatibles
export function sonUnidadesCompatibles(unidad1, unidad2) {
  const solidosGramo = ["Gramos", "Kilogramos"];
  const liquidosMililitro = ["Mililitros", "Litros"];
  const unidades = ["Unidades"];

  if (unidades.includes(unidad1) && unidades.includes(unidad2)) return true;
  if (solidosGramo.includes(unidad1) && solidosGramo.includes(unidad2))
    return true;
  if (
    liquidosMililitro.includes(unidad1) &&
    liquidosMililitro.includes(unidad2)
  )
    return true;

  return false;
}

// Función para normalizar cantidad a unidad estándar del inventario
export function convertirAUnidadInventario(
  cantidad,
  unidadOrigen,
  unidadDestino
) {
  // Si no son compatibles, retornar error
  if (!sonUnidadesCompatibles(unidadOrigen, unidadDestino)) {
    throw new Error(
      `No se puede convertir ${unidadOrigen} a ${unidadDestino}. Unidades incompatibles.`
    );
  }

  return convertirUnidad(cantidad, unidadOrigen, unidadDestino);
}

// Conversión exacta (sin redondeo) para actualizaciones de inventario
function _convertirExacto(cantidad, unidadOrigen, unidadDestino) {
  const factoresGramos = { Gramos: 1, Kilogramos: 1000 };
  const factoresMililitros = { Mililitros: 1, Litros: 1000 };

  const esSolidoOrigen = Object.prototype.hasOwnProperty.call(factoresGramos, unidadOrigen);
  const esSolidoDestino = Object.prototype.hasOwnProperty.call(factoresGramos, unidadDestino);
  const esLiquidoOrigen = Object.prototype.hasOwnProperty.call(factoresMililitros, unidadOrigen);
  const esLiquidoDestino = Object.prototype.hasOwnProperty.call(factoresMililitros, unidadDestino);

  if (esSolidoOrigen && esSolidoDestino) {
    return (cantidad * factoresGramos[unidadOrigen]) / factoresGramos[unidadDestino];
  }
  if (esLiquidoOrigen && esLiquidoDestino) {
    return (cantidad * factoresMililitros[unidadOrigen]) / factoresMililitros[unidadDestino];
  }
  // Unidades incompatibles o iguales: devolver sin cambio
  return cantidad;
}

export class ConsumoModel {
  static async getAll() {
    try {
      console.log("🔍 Ejecutando consulta getAll en modelo Consumo...");

      const [consumos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(c.id_consumo) as id_consumo,
                    BIN_TO_UUID(c.id_jornada) as id_jornada,
                    c.id_servicio,
                    BIN_TO_UUID(c.id_usuario) as id_usuario,
                    c.fecha,
                    c.origenCalculo,
                    c.fechaHoraGeneracion,
                    COALESCE(s.nombre, 'Servicio no especificado') as nombreServicio,
                    COALESCE(CONCAT(p.nombre, ' ', p.apellido), u.nombreUsuario, 'Usuario no especificado') as nombreUsuario,
                    dc.id_insumo,
                    i.nombreInsumo,
                    COALESCE(dc.unidadMedida, i.unidadMedida, 'Unidades') as unidadMedida,
                    dc.cantidadUtilizada,
                    dc.cantidadCalculada,
                    dc.id_itemReceta
                 FROM Consumos c
                 LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                 LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
                 LEFT JOIN Personas p ON u.id_persona = p.id_persona
                 LEFT JOIN DetalleConsumo dc ON c.id_consumo = dc.id_consumo
                 LEFT JOIN Insumos i ON dc.id_insumo = i.id_insumo
                 ORDER BY c.fechaHoraGeneracion DESC, COALESCE(dc.id_detalleConsumo, 0) ASC;`
      );

      console.log(
        `✅ Consulta exitosa, ${consumos.length} registros encontrados`
      );
      // Normalizar unidadMedida del ENUM (minúsculas) a formato capitalizado para display
      return consumos.map((c) => ({
        ...c,
        unidadMedida: normalizarUnidad(c.unidadMedida),
      }));
    } catch (error) {
      console.error("❌ Error al obtener consumos:", error);
      console.error("❌ SQL Error:", error.sqlMessage || error.code);
      console.error("❌ Stack trace:", error.stack);
      throw new Error("Error al obtener consumos");
    }
  }

  static async getById({ id }) {
    try {
      const [consumos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(c.id_consumo) as id_consumo,
                    BIN_TO_UUID(c.id_jornada) as id_jornada,
                    c.id_servicio,
                    BIN_TO_UUID(c.id_usuario) as id_usuario,
                    c.fecha,
                    c.origenCalculo,
                    c.fechaHoraGeneracion,
                    s.nombre as nombreServicio,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario
                 FROM Consumos c
                 LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                 LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
                 LEFT JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE c.id_consumo = UUID_TO_BIN(?);`,
        [id]
      );
      if (consumos.length === 0) return null;
      return consumos[0];
    } catch (error) {
      console.error("Error al obtener consumo:", error);
      throw new Error("Error al obtener consumo");
    }
  }

  static async create({ input }) {
    const {
      id_jornada,
      id_servicio,
      id_turno,
      id_usuario,
      fecha,
      origenCalculo = "Calculado",
    } = input;

    // Agregar un log para verificar los datos enviados al modelo
    console.log("Datos enviados al modelo para crear consumo:", input);

    try {
      // Si no se proporciona id_jornada, obtenerlo de la base de datos
      let finalIdJornada = id_jornada;

      if (!finalIdJornada) {
        // Obtener el id_jornada basándose en la fecha y el servicio
        // Calcular el día de la semana de la fecha
        const dateObj = new Date(fecha);
        const diasSemana = [
          "Lunes",
          "Martes",
          "Miercoles",
          "Jueves",
          "Viernes",
        ];
        const diaSemana = diasSemana[dateObj.getDay()];

        console.log(
          `🔍 Buscando jornada para: ${diaSemana}, Servicio ${id_servicio}, Fecha ${fecha}`
        );

        const [jornadas] = await connection.query(
          `SELECT BIN_TO_UUID(jp.id_jornada) as id_jornada
           FROM JornadaPlanificada jp
           JOIN PlanificacionMenus pm ON jp.id_planificacion = pm.id_planificacion
           WHERE jp.id_servicio = ? AND jp.diaSemana = ?
             AND pm.estado IN ('Activo', 'Programado', 'Pendiente')
           ORDER BY (pm.estado = 'Activo') DESC, pm.fechaInicio DESC
           LIMIT 1;`,
          [id_servicio, diaSemana]
        );

        if (jornadas.length > 0) {
          finalIdJornada = jornadas[0].id_jornada;
          console.log(`✅ Jornada encontrada: ${finalIdJornada}`);
        } else {
          console.warn(
            `⚠️ No se encontró jornada para ${diaSemana} y servicio ${id_servicio}`
          );
          // Generar un UUID por defecto si no se encuentra la jornada
          const [uuidResult] = await connection.query(
            "SELECT UUID() as new_uuid;"
          );
          finalIdJornada = uuidResult[0].new_uuid;
          console.log(`📝 Usando UUID generado: ${finalIdJornada}`);
        }
      }

      // Obtener id_turno asociado al id_servicio
      const [turnoResult] = await connection.query(
        `SELECT id_turno FROM ServicioTurno WHERE id_servicio = ? LIMIT 1;`,
        [id_servicio]
      );

      const id_turno = turnoResult.length > 0 ? turnoResult[0].id_turno : 1; // Default a 1 si no se encuentra
      console.log(`🔍 id_turno obtenido para servicio ${id_servicio}: ${id_turno}`);

      const [result] = await connection.query(
        `INSERT INTO Consumos (id_jornada, id_servicio, id_turno, id_usuario, fecha, origenCalculo)
                 VALUES (UUID_TO_BIN(?), ?, ?, UUID_TO_BIN(?), ?, ?);`,
        [finalIdJornada, id_servicio, id_turno, id_usuario, fecha, origenCalculo]
      );

      const [newConsumo] = await connection.query(
        `SELECT BIN_TO_UUID(id_consumo) as id_consumo 
                 FROM Consumos 
                 WHERE id_servicio = ? AND fecha = ?
                 ORDER BY fechaHoraGeneracion DESC LIMIT 1;`,
        [id_servicio, fecha]
      );

      return this.getById({ id: newConsumo[0].id_consumo });
    } catch (error) {
      console.error("Error al crear el consumo:", error);
      throw new Error("Error al crear el consumo");
    }
  }

  static async createDetalles({
    id_consumo,
    detalles,
    id_jornada,
    id_servicio,
    id_usuario,
  }) {
    try {
      console.log(
        `📝 Insertando ${detalles.length} detalles para consumo ${id_consumo}`
      );

      for (const detalle of detalles) {
        // Buscar el ItemReceta correspondiente para obtener cantidadCalculada y unidad
        let id_itemReceta = null;
        let cantidadCalculada = null;
        let unidadMedida = normalizarUnidad(
          detalle.unidad_medida || "Unidades"
        );

        console.log(
          `📦 Procesando detalle - ID Insumo: ${detalle.id_insumo}, Cantidad: ${detalle.cantidad_utilizada}, Unidad recibida: "${detalle.unidad_medida}", Unidad normalizada: "${unidadMedida}"`
        );

        try {
          const [items] = await connection.query(
            `SELECT ir.id_itemReceta, ir.cantidadPorPorcion, ir.unidadPorPorcion
             FROM ItemsRecetas ir
             JOIN RecetaJornada psr ON ir.id_receta = psr.id_receta
             WHERE psr.id_jornada = UUID_TO_BIN(?) 
             AND ir.id_insumo = ?
             LIMIT 1;`,
            [id_jornada, detalle.id_insumo]
          );

          if (items.length > 0) {
            id_itemReceta = items[0].id_itemReceta;
            cantidadCalculada = items[0].cantidadPorPorcion;
            // No sobreescribir unidadMedida con la de la receta: usar la unidad enviada por el usuario
          }
        } catch (error) {
          console.warn(
            `⚠️ No se encontró ItemReceta para insumo ${detalle.id_insumo} en jornada ${id_jornada}`
          );
        }

        // Si no se encontró ItemReceta, usar la cantidad utilizada como fallback
        if (cantidadCalculada === null) {
          cantidadCalculada = detalle.cantidad_utilizada;
        }

        // Insertar el detalle de consumo CON la unidad de medida
        try {
          await connection.query(
            `INSERT INTO DetalleConsumo (id_consumo, id_insumo, id_itemReceta, cantidadUtilizada, cantidadCalculada, unidadMedida)
                     VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?);`,
            [
              id_consumo,
              detalle.id_insumo,
              id_itemReceta,
              parseFloat(detalle.cantidad_utilizada),
              parseFloat(cantidadCalculada),
              unidadMedida.toLowerCase(),
            ]
          );

          console.log(
            `✅ Detalle de consumo insertado: insumo ${detalle.id_insumo}, cantidad ${detalle.cantidad_utilizada} ${unidadMedida}`
          );
        } catch (insertError) {
          console.error(
            `❌ Error al insertar detalle: ${insertError.message}`,
            insertError
          );
          throw insertError;
        }

        // Registrar movimiento de inventario (resta de stock)
        if (id_usuario) {
          try {
            // Obtener la unidad en que está almacenado el inventario
            const [inventarioRows] = await connection.query(
              `SELECT ins.unidadMedida FROM Inventarios i JOIN Insumos ins ON i.id_insumo = ins.id_insumo WHERE i.id_insumo = ? LIMIT 1;`,
              [detalle.id_insumo]
            );
            const unidadInventario =
              inventarioRows.length > 0
                ? normalizarUnidad(inventarioRows[0].unidadMedida)
                : unidadMedida;

            // Convertir la cantidad consumida a la unidad del inventario
            const cantidadMovimiento = parseFloat(
              _convertirExacto(
                detalle.cantidad_utilizada,
                unidadMedida,
                unidadInventario
              ).toFixed(3)
            );

            // 1. Insertar en MovimientosInventarios (con la unidad del inventario)
            await connection.query(
              `INSERT INTO MovimientosInventarios 
               (id_insumo, id_usuario, id_consumo, tipoMovimiento, cantidadMovimiento, comentarioMovimiento)
               VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?);`,
              [
                detalle.id_insumo,
                id_usuario,
                id_consumo,
                "Salida",
                cantidadMovimiento,
                `Consumo registrado en servicio ${id_servicio}`,
              ]
            );

            // 2. Actualizar tabla Inventarios (restar en la unidad del inventario)
            await connection.query(
              `UPDATE Inventarios 
               SET cantidadActual = cantidadActual - ?, 
                   fechaUltimaActualizacion = CURDATE()
               WHERE id_insumo = ?;`,
              [cantidadMovimiento, detalle.id_insumo]
            );

            console.log(
              `📦 Movimiento de inventario registrado para insumo ${detalle.id_insumo}: ${cantidadMovimiento} ${unidadInventario} (original: ${detalle.cantidad_utilizada} ${unidadMedida})`
            );
            console.log(
              `💾 Stock actualizado en tabla Inventarios para insumo ${detalle.id_insumo}`
            );
          } catch (error) {
            console.error(
              `⚠️ Error al registrar movimiento de inventario para insumo ${detalle.id_insumo}:`,
              error
            );
            // Continuar aunque falle el movimiento
          }
        }
      }

      console.log(`✅ Detalles de consumo insertados exitosamente`);
    } catch (error) {
      console.error("Error al insertar detalles de consumo:", error);
      throw new Error("Error al insertar detalles de consumo");
    }
  }

  static async delete({ id }) {
    try {
      // Primero eliminar los detalles del consumo
      await connection.query(
        `DELETE FROM DetalleConsumo WHERE id_consumo = UUID_TO_BIN(?);`,
        [id]
      );

      // Luego eliminar el consumo
      await connection.query(
        `DELETE FROM Consumos WHERE id_consumo = UUID_TO_BIN(?);`,
        [id]
      );
      return true;
    } catch (error) {
      console.error("Error al eliminar consumo:", error);
      return false;
    }
  }

  static async update({ id, input }) {
    const { id_servicio, fecha, origenCalculo } = input;

    try {
      const updates = [];
      const values = [];

      if (id_servicio !== undefined) {
        updates.push("id_servicio = ?");
        values.push(id_servicio);
      }
      if (fecha !== undefined) {
        updates.push("fecha = ?");
        values.push(fecha);
      }
      if (origenCalculo !== undefined) {
        updates.push("origenCalculo = ?");
        values.push(origenCalculo);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      await connection.query(
        `UPDATE Consumos
                 SET ${updates.join(", ")}
                 WHERE id_consumo = UUID_TO_BIN(?);`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      console.error("Error al actualizar el consumo:", error);
      throw new Error("Error al actualizar el consumo");
    }
  }

  // Método para obtener el detalle de consumo con insumos utilizados
  static async getConsumoWithDetalles({ id }) {
    try {
      const [consumo] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(c.id_consumo) as id_consumo,
                    BIN_TO_UUID(c.id_jornada) as id_jornada,
                    c.id_servicio,
                    BIN_TO_UUID(c.id_usuario) as id_usuario,
                    c.fecha,
                    c.origenCalculo,
                    c.fechaHoraGeneracion,
                    s.nombre as nombreServicio,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario
                 FROM Consumos c
                 LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                 LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
                 LEFT JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE c.id_consumo = UUID_TO_BIN(?);`,
        [id]
      );

      if (consumo.length === 0) return null;

      const [detalles] = await connection.query(
        `SELECT 
                    dc.id_detalleConsumo,
                    dc.id_insumo,
                    i.nombre as nombreInsumo,
                    i.unidadMedida,
                    dc.cantidadUtilizada,
                    dc.cantidadCalcula
                 FROM DetalleConsumo dc
                 JOIN Insumos i ON dc.id_insumo = i.id_insumo
                 WHERE dc.id_consumo = UUID_TO_BIN(?);`,
        [id]
      );

      return {
        ...consumo[0],
        detalles,
      };
    } catch (error) {
      console.error("Error al obtener consumo con detalles:", error);
      throw new Error("Error al obtener consumo con detalles");
    }
  }
}
