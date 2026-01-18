import { connection } from "./db.js";

export class ServicioModel {
  static async getAll() {
    const [servicios] = await connection.query(
      `SELECT 
                id_servicio as idServicio,
                nombre,
                descripcion,
                fechaAlta,
                fecha_modificacion as fechaModificacion,
                estado
             FROM Servicios
             ORDER BY nombre;`
    );
    return servicios;
  }

  static async getById({ id }) {
    const [servicios] = await connection.query(
      `SELECT 
                id_servicio as idServicio,
                nombre,
                descripcion,
                fechaAlta,
                fecha_modificacion as fechaModificacion,
                estado
             FROM Servicios
             WHERE id_servicio = ?;`,
      [id]
    );
    if (servicios.length === 0) return null;
    return servicios[0];
  }

  static async create({ input }) {
    const { nombre, descripcion, estado = "Activo" } = input;

    try {
      const [result] = await connection.query(
        `INSERT INTO Servicios (nombre, descripcion, estado)
                 VALUES (?, ?, ?);`,
        [nombre, descripcion, estado]
      );

      return this.getById({ id: result.insertId });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe un servicio con ese nombre");
      }
      throw new Error("Error al crear el servicio");
    }
  }

  static async delete({ id }) {
    try {
      console.log("ServicioModel: Ejecutando DELETE para ID:", id);
      const [result] = await connection.query(
        `DELETE FROM Servicios
                 WHERE id_servicio = ?;`,
        [id]
      );
      console.log("ServicioModel: Resultado de DELETE:", result);
      console.log("ServicioModel: Filas afectadas:", result.affectedRows);

      // Verificar si se eliminó alguna fila
      return result.affectedRows > 0;
    } catch (error) {
      console.error("ServicioModel: Error en DELETE:", error);
      throw error;
    }
  }

  static async hasActiveRelations({ id }) {
    const [result] = await connection.query(
      `SELECT COUNT(*) as count
       FROM ConfiguracionServiciosAutomaticos
       WHERE id_servicio = ?
       UNION ALL
       SELECT COUNT(*) as count
       FROM ServicioTurno
       WHERE id_servicio = ?`,
      [id, id]
    );
    return result.some((r) => r.count > 0);
  }

  static async update({ id, input }) {
    const { nombre, descripcion, estado } = input;

    try {
      const updates = [];
      const values = [];

      if (nombre) {
        updates.push("nombre = ?");
        values.push(nombre);
      }
      if (descripcion) {
        updates.push("descripcion = ?");
        values.push(descripcion);
      }
      if (estado) {
        updates.push("estado = ?");
        values.push(estado);
      }

      if (updates.length === 0) return this.getById({ id });

      updates.push("fecha_modificacion = NOW()");
      values.push(id);

      await connection.query(
        `UPDATE Servicios
                 SET ${updates.join(", ")}
                 WHERE id_servicio = ?;`,
        values
      );

      return this.getById({ id });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe un servicio con ese nombre");
      }
      throw new Error("Error al actualizar el servicio");
    }
  }

  static async getActivos() {
    const [servicios] = await connection.query(
      `SELECT 
                id_servicio as idServicio,
                nombre,
                descripcion
             FROM Servicios
             WHERE estado = 'Activo'
             ORDER BY nombre;`
    );
    return servicios;
  }

  static async getConTurnos() {
    const [servicios] = await connection.query(
      `SELECT DISTINCT
                s.id_servicio as idServicio,
                s.nombre,
                s.descripcion,
                GROUP_CONCAT(
                    CONCAT(t.nombre, ' (', t.horaInicio, ' - ', t.horaFin, ')')
                    ORDER BY t.horaInicio SEPARATOR ', '
                ) as turnos
             FROM Servicios s
             JOIN ServicioTurno st ON s.id_servicio = st.id_servicio
             JOIN Turnos t ON st.id_turno = t.id_turno
             WHERE s.estado = 'Activo' AND t.estado = 'Activo'
             GROUP BY s.id_servicio, s.nombre, s.descripcion
             ORDER BY s.nombre;`
    );
    return servicios;
  }

  // Marcar un servicio como completado en una fecha específica
  static async marcarCompletado({
    fecha,
    id_servicio,
    completado,
    comensales_total = 0,
  }) {
    try {
      // Primero, verificar si existe el registro
      const [exists] = await connection.query(
        `SELECT id FROM ServiciosCompletados 
                 WHERE fecha = ? AND id_servicio = ?`,
        [fecha, id_servicio]
      );

      if (exists.length > 0) {
        // Actualizar registro existente
        await connection.query(
          `UPDATE ServiciosCompletados 
                     SET completado = ?, comensales_total = ?, fecha_actualizacion = NOW()
                     WHERE fecha = ? AND id_servicio = ?`,
          [completado ? 1 : 0, comensales_total, fecha, id_servicio]
        );
      } else {
        // Crear nuevo registro
        await connection.query(
          `INSERT INTO ServiciosCompletados (fecha, id_servicio, completado, comensales_total, fecha_creacion)
                     VALUES (?, ?, ?, ?, NOW())`,
          [fecha, id_servicio, completado ? 1 : 0, comensales_total]
        );
      }

      console.log(
        `✅ Servicio ${id_servicio} marcado como ${
          completado ? "completado" : "pendiente"
        } en ${fecha} con ${comensales_total} comensales`
      );

      return {
        success: true,
        message: `Servicio marcado como ${
          completado ? "completado" : "pendiente"
        }`,
        fecha,
        id_servicio,
        completado,
        comensales_total,
      };
    } catch (error) {
      console.error("Error al marcar servicio como completado:", error);
      throw error;
    }
  }

  // Obtener estado de completado para los servicios de una fecha
  static async obtenerEstadoCompletado(fecha) {
    try {
      const [registros] = await connection.query(
        `SELECT id_servicio, completado
                 FROM ServiciosCompletados
                 WHERE fecha = ?`,
        [fecha]
      );

      // Convertir a objeto para fácil acceso {id_servicio: completado}
      const estado = {};
      registros.forEach((reg) => {
        estado[reg.id_servicio] = Boolean(reg.completado);
      });

      return estado;
    } catch (error) {
      console.error("Error al obtener estado de servicios:", error);
      throw error;
    }
  }

  // Obtener comensales totales por servicio para una fecha específica
  static async obtenerComensalesPorServicio(fecha) {
    try {
      const [registros] = await connection.query(
        `SELECT 
          id_servicio,
          completado,
          fecha_creacion,
          fecha_actualizacion
         FROM ServiciosCompletados
         WHERE fecha = ?
         ORDER BY id_servicio`,
        [fecha]
      );

      // Convertir a objeto para fácil acceso {id_servicio: {completado, comensales_total}}
      const comensales = {};
      registros.forEach((reg) => {
        // Obtener comensales reales de la tabla RegistrosAsistencias
        // Por ahora retornamos el estado de completado
        comensales[reg.id_servicio] = {
          comensales_total: 0, // Se calculará desde RegistrosAsistencias
          completado: Boolean(reg.completado),
          fecha_creacion: reg.fecha_creacion,
          fecha_actualizacion: reg.fecha_actualizacion,
        };
      });

      return comensales;
    } catch (error) {
      console.error("Error al obtener comensales por servicio:", error);
      throw error;
    }
  }
}
