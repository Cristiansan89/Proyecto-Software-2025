import { connection } from "./db.js";

export class ConsumoModel {
  static async getAll() {
    try {
      console.log("🔍 Ejecutando consulta getAll en modelo Consumo...");

      const [consumos] = await connection.query(
        `SELECT 
                    BIN_TO_UUID(c.id_consumo) as id_consumo,
                    BIN_TO_UUID(c.id_jornada) as id_jornada,
                    c.id_servicio,
                    c.id_turno,
                    BIN_TO_UUID(c.id_usuario) as id_usuario,
                    c.fecha,
                    c.origenCalculo,
                    c.fechaHoraGeneracion,
                    COALESCE(s.nombre, 'Servicio no especificado') as nombreServicio,
                    COALESCE(t.nombre, 'Turno no especificado') as nombreTurno,
                    COALESCE(CONCAT(p.nombre, ' ', p.apellido), u.nombreUsuario, 'Usuario no especificado') as nombreUsuario
                 FROM Consumos c
                 LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                 LEFT JOIN Turnos t ON c.id_turno = t.id_turno
                 LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
                 LEFT JOIN Personas p ON u.id_persona = p.id_persona
                 ORDER BY c.fechaHoraGeneracion DESC;`
      );

      console.log(
        `✅ Consulta exitosa, ${consumos.length} registros encontrados`
      );
      return consumos;
    } catch (error) {
      console.error("❌ Error al obtener consumos:", error);
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
                    c.id_turno,
                    BIN_TO_UUID(c.id_usuario) as id_usuario,
                    c.fecha,
                    c.origenCalculo,
                    c.fechaHoraGeneracion,
                    s.nombreServicio,
                    t.nombreTurno,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario
                 FROM Consumos c
                 LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                 LEFT JOIN Turnos t ON c.id_turno = t.id_turno
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

    try {
      const [result] = await connection.query(
        `INSERT INTO Consumos (id_jornada, id_servicio, id_turno, id_usuario, fecha, origenCalculo)
                 VALUES (UUID_TO_BIN(?), ?, ?, UUID_TO_BIN(?), ?, ?);`,
        [id_jornada, id_servicio, id_turno, id_usuario, fecha, origenCalculo]
      );

      const [newConsumo] = await connection.query(
        `SELECT BIN_TO_UUID(id_consumo) as id_consumo 
                 FROM Consumos 
                 WHERE id_jornada = UUID_TO_BIN(?) AND id_servicio = ? AND id_turno = ? AND fecha = ?
                 ORDER BY fechaHoraGeneracion DESC LIMIT 1;`,
        [id_jornada, id_servicio, id_turno, fecha]
      );

      return this.getById({ id: newConsumo[0].id_consumo });
    } catch (error) {
      console.error("Error al crear el consumo:", error);
      throw new Error("Error al crear el consumo");
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
    const { id_servicio, id_turno, fecha, origenCalculo } = input;

    try {
      const updates = [];
      const values = [];

      if (id_servicio !== undefined) {
        updates.push("id_servicio = ?");
        values.push(id_servicio);
      }
      if (id_turno !== undefined) {
        updates.push("id_turno = ?");
        values.push(id_turno);
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
                    c.id_turno,
                    BIN_TO_UUID(c.id_usuario) as id_usuario,
                    c.fecha,
                    c.origenCalculo,
                    c.fechaHoraGeneracion,
                    s.nombreServicio,
                    t.nombreTurno,
                    CONCAT(p.nombres, ' ', p.apellidos) as nombreUsuario
                 FROM Consumos c
                 LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                 LEFT JOIN Turnos t ON c.id_turno = t.id_turno
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
