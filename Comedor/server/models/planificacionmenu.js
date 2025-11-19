import { connection } from "./db.js";

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

    try {
      const [result] = await connection.execute(
        `INSERT INTO PlanificacionMenus (id_usuario, fechaInicio, fechaFin, comensalesEstimados, estado) 
                 VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)`,
        [id_usuario, fechaInicio, fechaFin, comensalesEstimados, estado]
      );

      // Obtener el ID de la planificación creada
      const [newPlan] = await connection.query(
        `SELECT BIN_TO_UUID(id_planificacion) as id_planificacion 
                 FROM PlanificacionMenus 
                 WHERE id_usuario = UUID_TO_BIN(?) AND fechaInicio = ?
                 ORDER BY id_planificacion DESC LIMIT 1;`,
        [id_usuario, fechaInicio]
      );

      return this.getById({ id: newPlan[0].id_planificacion });
    } catch (error) {
      throw new Error("Error al crear la planificación del menú");
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
                    FIELD(jp.diaSemana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'),
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
      const [menus] = await connection.query(
        `SELECT 
                    jp.diaSemana,
                    jp.id_servicio,
                    s.nombre as nombreServicio,
                    BIN_TO_UUID(psr.id_receta) as id_receta,
                    r.nombreReceta,
                    BIN_TO_UUID(psr.id_recetaAsignada) as id_recetaAsignada,
                    pm.fechaInicio,
                    pm.fechaFin
                 FROM PlanificacionMenus pm
                 JOIN JornadaPlanificada jp ON pm.id_planificacion = jp.id_planificacion
                 JOIN Servicios s ON jp.id_servicio = s.id_servicio
                 LEFT JOIN PlanificacionServicioReceta psr ON jp.id_jornada = psr.id_jornada
                 LEFT JOIN Recetas r ON psr.id_receta = r.id_receta
                                 WHERE pm.fechaInicio <= ? AND pm.fechaFin >= ? 
                                     AND pm.estado = 'Activo'
                 ORDER BY jp.id_servicio;`,
        [fechaFin, fechaInicio]
      );

      // Convertir los días de la semana a fechas específicas
      const resultados = [];

      menus.forEach((menu) => {
        // Calcular la fecha específica basada en el día de la semana
        const fechaInicio = new Date(menu.fechaInicio);
        const diasMap = {
          Lunes: 1,
          Martes: 2,
          Miércoles: 3,
          Jueves: 4,
          Viernes: 5,
          Sábado: 6,
          Domingo: 0,
        };

        // Encontrar el día específico en la semana de la planificación
        const diaObjetivo = diasMap[menu.diaSemana];
        const fechaMenu = new Date(fechaInicio);

        // Ajustar a la fecha correcta del día de la semana
        const diaActual = fechaMenu.getDay();
        const diferencia = diaObjetivo - diaActual;
        fechaMenu.setDate(fechaMenu.getDate() + diferencia);

        resultados.push({
          fecha: fechaMenu.toISOString().split("T")[0],
          id_servicio: menu.id_servicio,
          nombreServicio: menu.nombreServicio,
          id_receta: menu.id_receta,
          nombreReceta: menu.nombreReceta,
          id_recetaAsignada: menu.id_recetaAsignada,
        });
      });
      return resultados;
    } catch (error) {
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
}
