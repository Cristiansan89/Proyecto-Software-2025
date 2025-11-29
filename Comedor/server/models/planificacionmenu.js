import { connection } from "./db.js";

// Mapa consistente de días de la semana (índice UTC -> nombre sin acentos para DB)
const DIAS_SEMANA_POR_INDICE = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

// Mapa para convertir nombre a índice (case-insensitive y sin acentos)
const NOMBRE_A_INDICE_DIA = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3, // Sin acento para matching
  miércoles: 3, // Con acento
  jueves: 4,
  viernes: 5,
  sabado: 6, // Sin acento
  sábado: 6, // Con acento
};

function normalizarDia(diaNombre) {
  if (!diaNombre) return null;
  const diaLower = diaNombre.toLowerCase().trim();
  return NOMBRE_A_INDICE_DIA[diaLower];
}

export class PlanificacionMenuModel {
  static async getAll() {
    try {
      const [planificaciones] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 ORDER BY pm.fechaInicio DESC;`
      );
      return planificaciones;
    } catch (error) {
      throw new Error("Error al obtener planificaciones de menú");
    }
  }

  static async getById({ id }) {
    try {
      // Validar que el ID no esté vacío
      if (!id) {
        throw new Error("ID de planificación requerido");
      }

      const [planificaciones] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE pm.id_planificacion = UUID_TO_BIN(?);`,
        [id]
      );
      if (planificaciones.length === 0) return null;
      return planificaciones[0];
    } catch (error) {
      console.error("Error en getById de PlanificacionMenuModel:", error);
      throw new Error(
        `Error al obtener planificación de menú: ${error.message}`
      );
    }
  }

  static async create({ input }) {
    const {
      id_usuario,
      fechaInicio,
      fechaFin,
      comensalesEstimados = 0,
      estado = "Activo",
    } = input;

    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // Crear la planificación
      const [result] = await conn.execute(
        `INSERT INTO PlanificacionMenus (id_usuario, fechaInicio, fechaFin, comensalesEstimados, estado) 
                 VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)`,
        [id_usuario, fechaInicio, fechaFin, comensalesEstimados, estado]
      );

      // Obtener el ID de la planificación creada
      const [newPlan] = await conn.query(
        `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion 
                 FROM PlanificacionMenus 
                 WHERE id_usuario = UUID_TO_BIN(?) AND fechaInicio = ?
                 ORDER BY id_planificacion DESC LIMIT 1;`,
        [id_usuario, fechaInicio]
      );

      const id_planificacion = newPlan[0].id_planificacion;

      // Obtener todos los servicios
      const [servicios] = await conn.query(
        `SELECT id_servicio FROM Servicios WHERE estado = 'Activo';`
      );

      // Crear jornadas solo para días de semana (lunes a viernes)
      const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

      for (const servicio of servicios) {
        for (const dia of diasSemana) {
          await conn.execute(
            `INSERT INTO JornadaPlanificada (id_planificacion, id_servicio, diaSemana)
             VALUES (UUID_TO_BIN(?), ?, ?)`,
            [id_planificacion, servicio.id_servicio, dia]
          );
        }
      }

      await conn.commit();

      return this.getById({ id: id_planificacion });
    } catch (error) {
      await conn.rollback();
      throw new Error(
        "Error al crear la planificación del menú: " + error.message
      );
    } finally {
      conn.release();
    }
  }

  static async delete({ id }) {
    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // Eliminar primero las asignaciones de recetas
      await conn.query(
        `DELETE psr FROM PlanificacionServicioReceta psr
                 JOIN JornadaPlanificada jp ON psr.id_jornada = jp.id_jornada
                 WHERE jp.id_planificacion = UUID_TO_BIN(?);`,
        [id]
      );

      // Eliminar jornadas planificadas
      await conn.query(
        `DELETE FROM JornadaPlanificada WHERE id_planificacion = UUID_TO_BIN(?);`,
        [id]
      );

      // Eliminar la planificación
      await conn.query(
        `DELETE FROM PlanificacionMenus WHERE id_planificacion = UUID_TO_BIN(?);`,
        [id]
      );

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      return false;
    } finally {
      conn.release();
    }
  }

  static async update({ id, input }) {
    const { fechaInicio, fechaFin, comensalesEstimados, estado } = input;

    try {
      const updates = [];
      const values = [];

      if (fechaInicio !== undefined) {
        updates.push("fechaInicio = ?");
        values.push(fechaInicio);
      }
      if (fechaFin !== undefined) {
        updates.push("fechaFin = ?");
        values.push(fechaFin);
      }
      if (comensalesEstimados !== undefined) {
        updates.push("comensalesEstimados = ?");
        values.push(comensalesEstimados);
      }
      if (estado !== undefined) {
        updates.push("estado = ?");
        values.push(estado);
      }

      if (updates.length === 0) return this.getById({ id });

      values.push(id);
      await connection.query(
        `UPDATE PlanificacionMenus
                 SET ${updates.join(", ")}
                 WHERE id_planificacion = UUID_TO_BIN(?);`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      throw new Error("Error al actualizar la planificación del menú");
    }
  }

  // Método para obtener planificación completa con jornadas
  static async getPlanificacionCompleta({ id }) {
    try {
      const planificacion = await this.getById({ id });
      if (!planificacion) return null;

      const [jornadas] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(jp.id_jornada) as id_jornada,
                    BIN_TO_UUID(jp.id_planificacion) as id_planificacion,
                    jp.id_servicio,
                    s.nombreServicio,
                    jp.diaSemana
                 FROM JornadaPlanificada jp
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 WHERE jp.id_planificacion = UUID_TO_BIN(?)
                 ORDER BY 
                    FIELD(jp.diaSemana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'),
                    s.nombreServicio;`,
        [id]
      );

      return {
        ...planificacion,
        jornadas,
      };
    } catch (error) {
      throw new Error("Error al obtener planificación completa");
    }
  }

  // Método para crear jornada en la planificación
  static async crearJornada({ input }) {
    const { id_planificacion, id_servicio, diaSemana } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO JornadaPlanificada (
                    id_planificacion,
                    id_servicio,
                    diaSemana
                ) VALUES (UUID_TO_BIN(?), ?, ?);`,
        [id_planificacion, id_servicio, diaSemana]
      );

      const [jornada] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(jp.id_jornada) as id_jornada,
                    BIN_TO_UUID(jp.id_planificacion) as id_planificacion,
                    jp.id_servicio,
                    s.nombreServicio,
                    jp.diaSemana
                 FROM JornadaPlanificada jp
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 WHERE jp.id_planificacion = UUID_TO_BIN(?) 
                   AND jp.id_servicio = ? 
                   AND jp.diaSemana = ?;`,
        [id_planificacion, id_servicio, diaSemana]
      );

      return jornada[0];
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe una jornada para este día y servicio");
      }
      throw new Error("Error al crear jornada");
    }
  }

  // Método para asignar receta a una jornada
  static async asignarRecetaAJornada({ input }) {
    const { id_jornada, id_receta } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO PlanificacionServicioReceta (
                    id_recetaAsignada,
                    id_jornada,
                    id_receta
                ) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?));`,
        [id_jornada, id_receta]
      );

      const [asignacion] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    BIN_TO_UUID(psr.id_jornada) as id_jornada,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombrePlato
                 FROM PlanificacionServicioReceta psr
                 JOIN Recetas r ON psr.id_receta = r.id_receta
                 WHERE psr.id_jornada = UUID_TO_BIN(?) AND psr.id_receta = UUID_TO_BIN(?);`,
        [id_jornada, id_receta]
      );

      return asignacion[0];
    } catch (error) {
      throw new Error("Error al asignar receta a jornada");
    }
  }

  // Método para obtener recetas asignadas a una jornada
  static async getRecetasPorJornada({ id_jornada }) {
    try {
      const [recetas] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    BIN_TO_UUID(psr.id_jornada) as id_jornada,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombrePlato,
                    r.descripcion
                 FROM PlanificacionServicioReceta psr
                 JOIN Recetas r ON psr.id_receta = r.id_receta
                 WHERE psr.id_jornada = UUID_TO_BIN(?)
                 ORDER BY r.nombrePlato;`,
        [id_jornada]
      );
      return recetas;
    } catch (error) {
      throw new Error("Error al obtener recetas por jornada");
    }
  }

  // Método para obtener planificaciones por usuario
  static async getByUsuario({ id_usuario }) {
    try {
      const [planificaciones] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE pm.id_usuario = UUID_TO_BIN(?)
                 ORDER BY pm.fechaInicio DESC;`,
        [id_usuario]
      );
      return planificaciones;
    } catch (error) {
      throw new Error("Error al obtener planificaciones por usuario");
    }
  }

  // Método para obtener planificaciones por estado
  static async getByEstado({ estado }) {
    try {
      const [planificaciones] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE pm.estado = ?
                 ORDER BY pm.fechaInicio DESC;`,
        [estado]
      );
      return planificaciones;
    } catch (error) {
      throw new Error("Error al obtener planificaciones por estado");
    }
  }

  // Método para finalizar una planificación
  static async finalizar({ id }) {
    try {
      await connection.query(
        `UPDATE PlanificacionMenus
                 SET estado = 'Finalizado'
                 WHERE id_planificacion = UUID_TO_BIN(?);`,
        [id]
      );
      return this.getById({ id });
    } catch (error) {
      throw new Error("Error al finalizar planificación");
    }
  }

  // Método para asignar receta directamente por fecha y servicio
  static async asignarRecetaPorFechaServicio({ input }) {
    const {
      fecha,
      id_servicio,
      id_receta,
      id_usuario,
      observaciones = "",
    } = input;

    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // Validar que tenemos un usuario válido
      if (!id_usuario) {
        throw new Error(
          "Se requiere un usuario válido para crear la planificación"
        );
      }

      // Obtener el día de la semana en español
      // Parsear la fecha en formato YYYY-MM-DD
      const [año, mes, día] = fecha.split("-").map(Number);
      const fechaObj = new Date(año, mes - 1, día); // mes es 0-indexed en JS
      const indiceLocal = fechaObj.getDay();
      const diaSemana = DIAS_SEMANA_POR_INDICE[indiceLocal];

      console.log(
        `📅 asignarRecetaPorFechaServicio: Fecha ${fecha} -> Día '${diaSemana}' (índice: ${indiceLocal})`
      );

      // Validar que no sea fin de semana (sábado=6, domingo=0)
      if (indiceLocal === 0 || indiceLocal === 6) {
        throw new Error(
          `No se pueden asignar recetas para ${diaSemana}. Las jornadas planificadas son solo de lunes a viernes.`
        );
      }

      // Buscar o crear una planificación para esta fecha
      let [planificaciones] = await conn.query(
        `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion
                 FROM PlanificacionMenus 
                 WHERE fechaInicio <= ? AND fechaFin >= ? AND estado = 'Activo'
                 LIMIT 1;`,
        [fecha, fecha]
      );

      let id_planificacion;
      if (planificaciones.length === 0) {
        // Crear una nueva planificación si no existe
        const [result] = await conn.query(
          `INSERT INTO PlanificacionMenus (
                        id_usuario,
                        fechaInicio,
                        fechaFin,
                        comensalesEstimados,
                        estado
                    ) VALUES (
                        UUID_TO_BIN(?),
                        ?, ?, 150, 'Activo'
                    );`,
          [id_usuario, fecha, fecha]
        );

        const [newPlan] = await conn.query(
          `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion 
                     FROM PlanificacionMenus 
                     WHERE fechaInicio = ? AND id_usuario = UUID_TO_BIN(?)
                     ORDER BY id_planificacion DESC LIMIT 1;`,
          [fecha, id_usuario]
        );
        id_planificacion = newPlan[0].id_planificacion;
      } else {
        id_planificacion = planificaciones[0].id_planificacion;
      }

      // Buscar o crear una jornada para este día y servicio
      let [jornadas] = await conn.query(
        `SELECT BIN_TO_UUID(id_jornada) as id_jornada
                 FROM JornadaPlanificada 
                 WHERE id_planificacion = UUID_TO_BIN(?) AND id_servicio = ? AND diaSemana = ?;`,
        [id_planificacion, id_servicio, diaSemana]
      );

      let id_jornada;
      if (jornadas.length === 0) {
        // Crear nueva jornada
        await conn.query(
          `INSERT INTO JornadaPlanificada (
                        id_planificacion,
                        id_servicio,
                        diaSemana
                    ) VALUES (UUID_TO_BIN(?), ?, ?);`,
          [id_planificacion, id_servicio, diaSemana]
        );

        const [newJornada] = await conn.query(
          `SELECT BIN_TO_UUID(id_jornada) as id_jornada
                     FROM JornadaPlanificada 
                     WHERE id_planificacion = UUID_TO_BIN(?) AND id_servicio = ? AND diaSemana = ?;`,
          [id_planificacion, id_servicio, diaSemana]
        );
        id_jornada = newJornada[0].id_jornada;
      } else {
        id_jornada = jornadas[0].id_jornada;
      }

      // Verificar si ya existe una asignación y eliminarla
      await conn.query(
        `DELETE FROM PlanificacionServicioReceta 
                 WHERE id_jornada = UUID_TO_BIN(?);`,
        [id_jornada]
      );

      // Crear nueva asignación
      await conn.query(
        `INSERT INTO PlanificacionServicioReceta (
                    id_recetaAsignada,
                    id_jornada,
                    id_receta
                ) VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?));`,
        [id_jornada, id_receta]
      );

      await conn.commit();

      // Obtener la asignación creada con información completa
      const [resultado] = await conn.query(
        `SELECT 
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    BIN_TO_UUID(psr.id_jornada) as id_jornada,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombreReceta,
                    ? as fecha,
                    ? as id_servicio,
                    s.nombre as nombreServicio
                 FROM PlanificacionServicioReceta psr
                 JOIN Recetas r ON psr.id_receta = r.id_receta
                 JOIN JornadaPlanificada jp ON psr.id_jornada = jp.id_jornada
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 WHERE psr.id_jornada = UUID_TO_BIN(?);`,
        [fecha, id_servicio, id_jornada]
      );

      return resultado[0];
    } catch (error) {
      await conn.rollback();
      throw new Error("Error al asignar receta: " + error.message);
    } finally {
      conn.release();
    }
  }

  // Método para obtener menús asignados por rango de fechas
  static async getMenusSemana({ fechaInicio, fechaFin }) {
    try {
      console.log(
        `🔍 getMenusSemana: Buscando menús entre ${fechaInicio} y ${fechaFin}`
      );

      const [menus] = await connection.query(
        `SELECT 
                    jp.diaSemana,
                    jp.id_servicio,
                    s.nombre as nombreServicio,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombreReceta,
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    BIN_TO_UUID(jp.id_jornada) as id_jornada,
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN JornadaPlanificada jp ON pm.id_planificacion = jp.id_planificacion
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 LEFT JOIN PlanificacionServicioReceta psr ON jp.id_jornada = psr.id_jornada
                 LEFT JOIN Recetas r ON psr.id_receta = r.id_receta
                 WHERE pm.fechaInicio <= ? AND pm.fechaFin >= ? 
                   AND pm.estado = 'Activo'
                 ORDER BY pm.fechaInicio, jp.id_servicio, jp.diaSemana;`,
        [fechaFin, fechaInicio]
      );

      console.log(`📊 Total de jornadas encontradas: ${menus.length}`);

      // Convertir los días de la semana a fechas específicas
      const resultados = [];
      const menusVistos = new Set(); // Para evitar duplicados

      menus.forEach((menu, index) => {
        console.log(
          `  [${index}] Día: '${menu.diaSemana}', Servicio: ${
            menu.id_servicio
          }, Receta: ${menu.id_receta ? "✅" : "❌"}`
        );

        // Solo procesar si hay una receta asignada
        if (menu.id_receta) {
          try {
            // Normalizar el nombre del día para obtener el índice
            const indiceNormalizado = normalizarDia(menu.diaSemana);

            if (indiceNormalizado === undefined || indiceNormalizado === null) {
              console.warn(
                `⚠️ Día desconocido/no válido: '${menu.diaSemana}'. Intenta: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo`
              );
              return; // Saltar este registro
            }

            // Calcular la fecha específica basada en el día de la semana
            const planificacionInicio = new Date(menu.fechaInicio);
            const fechaMenu = new Date(planificacionInicio);

            // Ajustar a la fecha correcta del día de la semana
            const diaActual = fechaMenu.getDay();
            const diferencia = indiceNormalizado - diaActual;
            fechaMenu.setDate(fechaMenu.getDate() + diferencia);

            const fechaFormato = fechaMenu.toISOString().split("T")[0];
            const clave = `${fechaFormato}_${menu.id_servicio}`;

            // Solo agregar si no lo hemos visto antes (evitar duplicados)
            if (!menusVistos.has(clave)) {
              menusVistos.add(clave);
              resultados.push({
                fecha: fechaFormato,
                id_servicio: menu.id_servicio,
                nombreServicio: menu.nombreServicio,
                id_receta: menu.id_receta,
                nombreReceta: menu.nombreReceta,
                id_recetaAsignada: menu.id_recetaAsignada,
                id_jornada: menu.id_jornada,
                id_planificacion: menu.id_planificacion,
              });
              console.log(
                `    ✅ Agregado: ${fechaFormato} - ${menu.nombreServicio} - ${menu.nombreReceta}`
              );
            }
          } catch (itemError) {
            console.warn(
              `⚠️ Error procesando menú para ${menu.diaSemana} servicio ${menu.id_servicio}:`,
              itemError.message
            );
          }
        }
      });

      console.log(
        `✅ getMenusSemana: ${resultados.length} menús encontrados entre ${fechaInicio} y ${fechaFin}`
      );
      return resultados;
    } catch (error) {
      console.error("❌ Error en getMenusSemana:", error.message);
      console.error("Stack:", error.stack);
      return [];
    }
  }

  // Método para eliminar receta asignada por fecha y servicio
  static async eliminarRecetaPorFechaServicio({ input }) {
    const { fecha, id_servicio } = input;

    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      // Obtener el día de la semana en español
      const fechaObj = new Date(fecha + "T00:00:00Z");
      const diasSemana = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];
      const diaSemana = diasSemana[fechaObj.getUTCDay()];

      // Buscar la planificación para esta fecha
      const [planificaciones] = await conn.query(
        `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion
                 FROM PlanificacionMenus 
                 WHERE fechaInicio <= ? AND fechaFin >= ? AND estado = 'Activo'
                 LIMIT 1;`,
        [fecha, fecha]
      );

      if (planificaciones.length === 0) {
        throw new Error(
          "No se encontró una planificación activa para esta fecha"
        );
      }

      const id_planificacion = planificaciones[0].id_planificacion;

      // Buscar la jornada para este día y servicio
      const [jornadas] = await conn.query(
        `SELECT BIN_TO_UUID(id_jornada) as id_jornada
                 FROM JornadaPlanificada 
                 WHERE id_planificacion = UUID_TO_BIN(?) AND id_servicio = ? AND diaSemana = ?;`,
        [id_planificacion, id_servicio, diaSemana]
      );

      if (jornadas.length === 0) {
        throw new Error("No se encontró una jornada para este día y servicio");
      }

      const id_jornada = jornadas[0].id_jornada;

      // Eliminar la asignación de receta
      const [result] = await conn.query(
        `DELETE FROM PlanificacionServicioReceta 
                 WHERE id_jornada = UUID_TO_BIN(?);`,
        [id_jornada]
      );

      await conn.commit();

      if (result.affectedRows === 0) {
        return {
          success: false,
          message: "No había una receta asignada para eliminar",
        };
      }

      return {
        success: true,
        message: "Receta eliminada exitosamente",
        fecha,
        id_servicio,
      };
    } catch (error) {
      await conn.rollback();
      throw new Error("Error al eliminar receta: " + error.message);
    } finally {
      conn.release();
    }
  }

  // Método para obtener planificaciones por rango de fechas
  static async getByRangoFechas({ fecha_inicio, fecha_fin }) {
    try {
      const [planificaciones] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(pm.id_planificacion) as id_planificacion,
                    BIN_TO_UUID(pm.id_usuario) as id_usuario,
                    CONCAT(p.nombre, ' ', p.apellido) as nombreUsuario,
                    pm.fechaInicio,
                    pm.fechaFin,
                    pm.comensalesEstimados,
                    pm.estado
                 FROM PlanificacionMenus pm
                 JOIN Usuarios u ON pm.id_usuario = u.id_usuario
                 JOIN Personas p ON u.id_persona = p.id_persona
                 WHERE (pm.fechaInicio <= ? AND pm.fechaFin >= ?) 
                    OR (pm.fechaInicio <= ? AND pm.fechaFin >= ?)
                    OR (pm.fechaInicio >= ? AND pm.fechaFin <= ?)
                 ORDER BY pm.fechaInicio DESC;`,
        [
          fecha_fin,
          fecha_inicio,
          fecha_inicio,
          fecha_fin,
          fecha_inicio,
          fecha_fin,
        ]
      );
      return planificaciones;
    } catch (error) {
      console.error("Error en getByRangoFechas:", error);
      throw new Error(
        "Error al obtener planificaciones por rango de fechas: " + error.message
      );
    }
  }

  // Método para calcular comensales automáticamente según matrícula por grado, turno y servicio
  static async calcularComensalesPorTurnoYServicio({ id_turno, id_servicio }) {
    try {
      // Validar que los parámetros requeridos estén presentes
      if (!id_turno || !id_servicio) {
        throw new Error("id_turno e id_servicio son requeridos");
      }

      // Verificar que el turno y servicio estén asociados
      const [servicioTurno] = await connection.query(
        `SELECT st.id_turno, st.id_servicio 
         FROM ServicioTurno st 
         WHERE st.id_turno = ? AND st.id_servicio = ?`,
        [id_turno, id_servicio]
      );

      if (servicioTurno.length === 0) {
        throw new Error(
          "El servicio no está disponible para el turno especificado"
        );
      }

      // Obtener todos los grados del turno especificado
      const [grados] = await connection.query(
        `SELECT g.id_grado, g.nombreGrado
         FROM Grados g 
         WHERE g.id_turno = ? AND g.estado = 'Activo'`,
        [id_turno]
      );

      let totalComensales = 0;
      const detalleComensales = [];

      // Para cada grado, contar los estudiantes matriculados
      for (const grado of grados) {
        const [estudiantes] = await connection.query(
          `SELECT COUNT(*) as cantidad
           FROM AlumnoGrado ag
           WHERE ag.nombreGrado = ?`,
          [grado.nombreGrado]
        );

        const cantidadEstudiantes = estudiantes[0].cantidad;
        totalComensales += cantidadEstudiantes;

        detalleComensales.push({
          grado: grado.nombreGrado,
          cantidadEstudiantes: cantidadEstudiantes,
        });
      }

      return {
        id_turno,
        id_servicio,
        totalComensales,
        detalleComensales,
      };
    } catch (error) {
      console.error("Error al calcular comensales:", error);
      throw new Error("Error al calcular comensales: " + error.message);
    }
  }

  // Método para obtener todos los comensales por servicio y fecha
  static async calcularComensalesPorServicioYFecha({ fecha }) {
    try {
      if (!fecha) {
        throw new Error("La fecha es requerida");
      }

      // Obtener todos los servicios activos
      const [servicios] = await connection.query(
        `SELECT s.id_servicio, s.nombre 
         FROM Servicios s 
         WHERE s.estado = 'Activo'`
      );

      const comensalesPorServicio = [];

      for (const servicio of servicios) {
        // Obtener turnos asociados al servicio
        const [turnos] = await connection.query(
          `SELECT DISTINCT t.id_turno, t.nombre as nombreTurno
           FROM Turnos t
           JOIN ServicioTurno st ON t.id_turno = st.id_turno
           WHERE st.id_servicio = ? AND t.estado = 'Activo'`,
          [servicio.id_servicio]
        );

        let totalServicio = 0;
        const detalleTurnos = [];

        for (const turno of turnos) {
          const comensales = await this.calcularComensalesPorTurnoYServicio({
            id_turno: turno.id_turno,
            id_servicio: servicio.id_servicio,
          });

          totalServicio += comensales.totalComensales;
          detalleTurnos.push({
            turno: turno.nombreTurno,
            comensales: comensales.totalComensales,
            grados: comensales.detalleComensales,
          });
        }

        comensalesPorServicio.push({
          id_servicio: servicio.id_servicio,
          nombreServicio: servicio.nombre,
          totalComensales: totalServicio,
          turnos: detalleTurnos,
        });
      }

      return {
        fecha,
        servicios: comensalesPorServicio,
        resumen: {
          totalDia: comensalesPorServicio.reduce(
            (sum, s) => sum + s.totalComensales,
            0
          ),
        },
      };
    } catch (error) {
      console.error(
        "Error al calcular comensales por servicio y fecha:",
        error
      );
      throw new Error(
        "Error al calcular comensales por servicio y fecha: " + error.message
      );
    }
  }
}
