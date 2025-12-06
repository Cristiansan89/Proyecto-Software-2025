import { connection } from "./db.js";

const ServicioRecetaModel = {
  // Obtener todos los servicios de una receta
  async getServiciosPorReceta(id_receta) {
    try {
      const query = `
        SELECT 
          BIN_TO_UUID(sr.id_receta) as id_receta,
          sr.id_servicio,
          s.nombre,
          s.descripcion
        FROM RecetaServicio sr
        INNER JOIN Servicios s ON sr.id_servicio = s.id_servicio
        WHERE sr.id_receta = UUID_TO_BIN(?)
        ORDER BY s.nombre
      `;

      const [servicios] = await connection.query(query, [id_receta]);
      return servicios;
    } catch (error) {
      console.error("Error en getServiciosPorReceta:", error);
      throw error;
    }
  },

  // Obtener todas las recetas de un servicio
  async getRecetasPorServicio(id_servicio) {
    try {
      const query = `
        SELECT 
          BIN_TO_UUID(sr.id_receta) as id_receta,
          r.nombreReceta,
          r.instrucciones,
          r.unidadSalida,
          r.fechaAlta,
          r.estado,
          sr.id_servicio
        FROM RecetaServicio sr
        INNER JOIN Recetas r ON sr.id_receta = r.id_receta
        WHERE sr.id_servicio = ?
        ORDER BY r.nombreReceta
      `;

      const [recetas] = await connection.query(query, [id_servicio]);
      return recetas;
    } catch (error) {
      console.error("Error en getRecetasPorServicio:", error);
      throw error;
    }
  },

  // Asociar una receta a un servicio
  async criarServicioReceta(id_receta, id_servicio) {
    try {
      // Verificar que la receta existe
      const [receta] = await connection.query(
        "SELECT id_receta FROM Recetas WHERE id_receta = UUID_TO_BIN(?)",
        [id_receta]
      );
      if (receta.length === 0) {
        throw new Error("Receta no encontrada");
      }

      // Verificar que el servicio existe
      const [servicio] = await connection.query(
        "SELECT id_servicio FROM Servicios WHERE id_servicio = ?",
        [id_servicio]
      );
      if (servicio.length === 0) {
        throw new Error("Servicio no encontrado");
      }

      // Crear la asociación (PRIMARY KEY es (id_receta, id_servicio))
      const query = `
        INSERT INTO RecetaServicio (id_receta, id_servicio)
        VALUES (UUID_TO_BIN(?), ?)
      `;

      await connection.query(query, [id_receta, id_servicio]);
      return {
        id_receta,
        id_servicio,
      };
    } catch (error) {
      console.error("Error en criarServicioReceta:", error);
      throw error;
    }
  },

  // Eliminar la asociación entre receta y servicio
  async eliminarServicioReceta(id_receta, id_servicio) {
    try {
      const query =
        "DELETE FROM RecetaServicio WHERE id_receta = UUID_TO_BIN(?) AND id_servicio = ?";
      const [result] = await connection.query(query, [id_receta, id_servicio]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error en eliminarServicioReceta:", error);
      throw error;
    }
  },

  // Actualizar servicios de una receta (reemplaza todos)
  async actualizarServiciosReceta(id_receta, servicios) {
    try {
      // Iniciar transacción
      await connection.query("START TRANSACTION");

      // Eliminar asociaciones existentes
      await connection.query(
        "DELETE FROM RecetaServicio WHERE id_receta = UUID_TO_BIN(?)",
        [id_receta]
      );

      // Insertar nuevas asociaciones
      for (const id_servicio of servicios) {
        await connection.query(
          `INSERT INTO RecetaServicio (id_receta, id_servicio)
           VALUES (UUID_TO_BIN(?), ?)`,
          [id_receta, id_servicio]
        );
      }

      await connection.query("COMMIT");
      return true;
    } catch (error) {
      await connection.query("ROLLBACK");
      console.error("Error en actualizarServiciosReceta:", error);
      throw error;
    }
  },

  // Verificar si una receta está asociada a un servicio específico
  async verificarAsociacion(id_receta, id_servicio) {
    try {
      const query = `
        SELECT * FROM RecetaServicio
        WHERE id_receta = UUID_TO_BIN(?)
        AND id_servicio = ?
      `;

      const [result] = await connection.query(query, [id_receta, id_servicio]);
      return result.length > 0;
    } catch (error) {
      console.error("Error en verificarAsociacion:", error);
      throw error;
    }
  },

  // Obtener todas las asociaciones
  async getAll() {
    try {
      const query = `
        SELECT 
          BIN_TO_UUID(sr.id_receta) as id_receta,
          r.nombreReceta,
          sr.id_servicio,
          s.nombre as nombreServicio
        FROM RecetaServicio sr
        INNER JOIN Recetas r ON sr.id_receta = r.id_receta
        INNER JOIN Servicios s ON sr.id_servicio = s.id_servicio
        ORDER BY r.nombreReceta, s.nombre
      `;

      const [asociaciones] = await connection.query(query);
      return asociaciones;
    } catch (error) {
      console.error("Error en getAll:", error);
      throw error;
    }
  },
};

export default ServicioRecetaModel;
