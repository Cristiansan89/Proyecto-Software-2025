import {
  validateAsistencia,
  validatePartialAsistencia,
} from "../schemas/asistencias.js";
import { connection } from "../models/db.js";

export class AsistenciaController {
  constructor({ asistenciaModel }) {
    this.asistenciaModel = asistenciaModel;
  }

  getAll = async (req, res) => {
    try {
      const asistencias = await this.asistenciaModel.getAll();
      res.json(asistencias);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const asistencia = await this.asistenciaModel.getById({ id });

      if (!asistencia) {
        return res.status(404).json({ message: "Asistencia no encontrada" });
      }

      res.json(asistencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  getByToken = async (req, res) => {
    try {
      const { token } = req.params;

      // Validar token
      const tokenData = await this.asistenciaModel.validateToken(token);

      // Obtener alumnos del grado del docente
      const alumnos = await this.asistenciaModel.getAlumnosByDocenteGrado({
        idPersonaDocente: tokenData.idPersonaDocente,
        nombreGrado: tokenData.nombreGrado,
        fecha: tokenData.fecha,
        idServicio: tokenData.idServicio,
      });

      // Obtener información del servicio
      const [servicios] = await connection.query(
        "SELECT nombre, descripcion FROM Servicios WHERE id_servicio = ?",
        [tokenData.idServicio]
      );

      const servicio = servicios?.[0] || {
        nombre: "Servicio",
        descripcion: "",
      };

      res.json({
        tokenData,
        alumnos,
        servicio,
      });
    } catch (error) {
      console.error(error);
      if (
        error.message === "Token expirado" ||
        error.message === "Token inválido"
      ) {
        return res.status(401).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  registrarAsistencias = async (req, res) => {
    try {
      const { token } = req.params;
      const { asistencias } = req.body;

      console.log("📝 Iniciando registro de asistencias...");
      console.log("Token:", token.substring(0, 20) + "...");
      console.log("Asistencias recibidas:", asistencias);

      // Validar token
      const tokenData = await this.asistenciaModel.validateToken(token);
      console.log("✅ Token validado:", tokenData);

      if (!asistencias || !Array.isArray(asistencias)) {
        return res
          .status(400)
          .json({ message: "Datos de asistencias inválidos" });
      }

      const resultados = [];

      // Procesar cada asistencia
      for (const asistencia of asistencias) {
        const { idAlumnoGrado, tipoAsistencia } = asistencia;

        console.log(
          `Procesando alumno ${idAlumnoGrado} con tipo ${tipoAsistencia}`
        );

        if (!["Si", "No", "Ausente"].includes(tipoAsistencia)) {
          return res.status(400).json({
            message: `Tipo de asistencia inválido: ${tipoAsistencia}. Debe ser 'Si', 'No' o 'Ausente'`,
          });
        }

        const resultado = await this.asistenciaModel.upsertAsistencia({
          idServicio: parseInt(tokenData.idServicio),
          idAlumnoGrado: parseInt(idAlumnoGrado),
          fecha: tokenData.fecha,
          tipoAsistencia,
          estado: "Completado", // Cambiar a Completado cuando se registra desde el token
        });

        console.log(
          `✅ Asistencia registrada para alumno ${idAlumnoGrado}:`,
          resultado
        );
        resultados.push(resultado);
      }

      console.log(
        "🎉 Todas las asistencias procesadas exitosamente:",
        resultados.length
      );
      res.json({
        message: "Asistencias registradas correctamente",
        registradas: resultados.length,
        asistencias: resultados,
      });
    } catch (error) {
      console.error("❌ ERROR EN REGISTRAR ASISTENCIAS:");
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
      console.error("Código:", error.code);

      if (
        error.message === "Token expirado" ||
        error.message === "Token inválido"
      ) {
        return res.status(401).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  generateTokenForDocente = async (req, res) => {
    try {
      const { idPersonaDocente, nombreGrado, fecha, idServicio } = req.body;

      if (!idPersonaDocente || !nombreGrado || !fecha || !idServicio) {
        return res.status(400).json({
          message:
            "Faltan datos requeridos: idPersonaDocente, nombreGrado, fecha, idServicio",
        });
      }

      const token = await this.asistenciaModel.generateTokenForDocente({
        idPersonaDocente,
        nombreGrado,
        fecha,
        idServicio,
      });

      // Usar URL base de variable de entorno (debe ser HTTPS para Telegram)
      const baseUrl =
        process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
      const link = `${baseUrl}/asistencias/registro/${token}`;

      res.json({
        message: "Token generado correctamente",
        token,
        link,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  create = async (req, res) => {
    try {
      const result = validateAsistencia(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: JSON.parse(result.error.message) });
      }

      const nuevaAsistencia = await this.asistenciaModel.create({
        input: result.data,
      });
      res.status(201).json(nuevaAsistencia);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  update = async (req, res) => {
    try {
      const result = validatePartialAsistencia(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: JSON.parse(result.error.message) });
      }

      const { id } = req.params;
      const asistenciaActualizada = await this.asistenciaModel.update({
        id,
        input: result.data,
      });

      if (!asistenciaActualizada) {
        return res.status(404).json({ message: "Asistencia no encontrada" });
      }

      res.json(asistenciaActualizada);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const resultado = await this.asistenciaModel.delete({ id });

      if (!resultado) {
        return res.status(404).json({ message: "Asistencia no encontrada" });
      }

      res.json({ message: "Asistencia eliminada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  registrarAsistenciasDocente = async (req, res) => {
    try {
      const { asistencias, fecha, idServicio, nombreGrado } = req.body;

      // Validar que se enviaron los datos requeridos
      if (
        !asistencias ||
        !Array.isArray(asistencias) ||
        !fecha ||
        !idServicio ||
        !nombreGrado
      ) {
        return res.status(400).json({
          message:
            "Datos requeridos: asistencias (array), fecha, idServicio, nombreGrado",
        });
      }

      const resultados = [];

      // Procesar cada asistencia
      for (const asistencia of asistencias) {
        const { idAlumnoGrado, estado } = asistencia;

        if (!["Si", "No", "Ausente"].includes(estado)) {
          return res.status(400).json({
            message: `Estado inválido: ${estado}. Debe ser 'Si', 'No' o 'Ausente'`,
          });
        }

        const resultado = await this.asistenciaModel.upsertAsistencia({
          idServicio,
          idAlumnoGrado,
          fecha,
          estado,
        });

        resultados.push(resultado);
      }

      res.json({
        message: "Asistencias registradas correctamente",
        registradas: resultados.length,
        asistencias: resultados,
      });
    } catch (error) {
      console.error("Error en registrarAsistenciasDocente:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Inicializar asistencias en estado Pendiente cuando se envía por Telegram
  initializePendingAsistencias = async (req, res) => {
    try {
      const { id_grado, id_servicio, fecha, idDocente } = req.body;

      // idDocente es opcional, pero id_grado, id_servicio y fecha son obligatorios
      if (!id_grado || !id_servicio || !fecha) {
        return res.status(400).json({
          message: "Datos requeridos: id_grado, id_servicio, fecha",
        });
      }

      console.log("📝 Inicializando asistencias en estado Pendiente...");
      console.log({
        id_grado,
        id_servicio,
        fecha,
        idDocente,
      });

      // Obtener el nombreGrado basado en id_grado
      const [grados] = await connection.query(
        "SELECT nombreGrado FROM Grados WHERE id_grado = ?",
        [id_grado]
      );

      if (!grados || grados.length === 0) {
        return res.status(404).json({
          message: "Grado no encontrado",
        });
      }

      const nombreGrado = grados[0].nombreGrado;

      // Obtener alumnos del grado usando nombreGrado
      const query = `
        SELECT id_alumnoGrado 
        FROM AlumnoGrado 
        WHERE nombreGrado = ?
      `;

      const [alumnos] = await connection.query(query, [nombreGrado]);

      console.log(`Found ${alumnos.length} students in grade ${nombreGrado}`);

      if (alumnos.length === 0) {
        return res.status(404).json({
          message: "No se encontraron alumnos para este grado",
        });
      }

      const resultados = [];

      // Crear registros de asistencia en estado Pendiente
      for (const alumno of alumnos) {
        try {
          const resultado = await this.asistenciaModel.upsertAsistencia({
            idServicio: parseInt(id_servicio),
            idAlumnoGrado: alumno.id_alumnoGrado,
            fecha,
            estado: "Pendiente", // Estado inicial Pendiente
          });

          resultados.push(resultado);
          console.log(
            `✅ Asistencia inicializada para alumno ${alumno.id_alumnoGrado}`
          );
        } catch (error) {
          console.warn(
            `⚠️ Error al inicializar asistencia para alumno ${alumno.id_alumnoGrado}:`,
            error.message
          );
          // Continuar con otros alumnos si uno falla
        }
      }

      console.log(
        `🎉 Asistencias inicializadas: ${resultados.length} registros`
      );
      res.status(201).json({
        message: "Asistencias inicializadas en estado Pendiente correctamente",
        inicializadas: resultados.length,
        asistencias: resultados,
      });
    } catch (error) {
      console.error("❌ Error en initializePendingAsistencias:");
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);

      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  obtenerRegistrosAsistencias = async (req, res) => {
    try {
      const { fecha, idServicio, idGrado } = req.query;

      let query = `
        SELECT 
          a.id_asistencia,
          a.id_servicio,
          a.id_alumnoGrado,
          a.fecha,
          a.tipoAsistencia,
          a.estado,
          g.id_grado,
          g.nombreGrado as nombreGrado,
          p.nombre,
          p.apellido,
          s.nombre as nombreServicio
        FROM Asistencias a
        JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
        JOIN Grados g ON ag.nombreGrado = g.nombreGrado
        JOIN Personas p ON ag.id_persona = p.id_persona
        JOIN Servicios s ON a.id_servicio = s.id_servicio
        WHERE 1=1
      `;

      const params = [];

      if (fecha) {
        query += " AND a.fecha = ?";
        params.push(fecha);
      }

      if (idServicio) {
        query += " AND a.id_servicio = ?";
        params.push(idServicio);
      }

      if (idGrado) {
        query += " AND g.id_grado = ?";
        params.push(idGrado);
      }

      query += " ORDER BY a.fecha DESC, s.nombre, g.nombreGrado, p.nombre";

      const [asistencias] = await connection.query(query, params);

      // Reformatear datos para que coincidan con lo esperado en el frontend
      const registrosFormateados = asistencias.map((asistencia) => ({
        id_asistencia: asistencia.id_asistencia,
        id_servicio: asistencia.id_servicio,
        id_alumnoGrado: asistencia.id_alumnoGrado,
        id_grado: asistencia.id_grado,
        fecha: asistencia.fecha,
        tipoAsistencia: asistencia.tipoAsistencia,
        estado: asistencia.estado,
        nombreGrado: asistencia.nombreGrado,
        nombreServicio: asistencia.nombreServicio,
        nombreAlumno: `${asistencia.nombre} ${asistencia.apellido}`,
      }));

      res.json({
        success: true,
        data: registrosFormateados,
        message: "Registros obtenidos exitosamente",
      });
    } catch (error) {
      console.error("Error al obtener registros de asistencias:", error);
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };

  obtenerRegistrosAsistenciasServicio = async (req, res) => {
    try {
      const { fecha, idServicio, idGrado } = req.query;

      let query = `
        SELECT 
          a.id_asistencia,
          a.id_servicio,
          a.id_grado,
          a.cantidadPresentes,
          a.fecha,
          a.fecha_creacion,
          a.fecha_actualizacion,
          g.nombreGrado,
          s.nombre as nombreServicio
        FROM RegistrosAsistencias a
        LEFT JOIN Grados g ON a.id_grado = g.id_grado
        LEFT JOIN Servicios s ON a.id_servicio = s.id_servicio
        WHERE 1=1
      `;

      const params = [];

      if (fecha) {
        query += " AND DATE(a.fecha) = ?";
        params.push(fecha);
      }

      if (idServicio) {
        query += " AND a.id_servicio = ?";
        params.push(idServicio);
      }

      if (idGrado) {
        query += " AND a.id_grado = ?";
        params.push(idGrado);
      }

      query += " ORDER BY a.fecha DESC, s.nombre, g.nombreGrado";

      const [registros] = await connection.query(query, params);

      res.json({
        success: true,
        data: registros || [],
        message: "Registros de asistencia por servicio obtenidos exitosamente",
      });
    } catch (error) {
      console.error(
        "Error al obtener registros de asistencias por servicio:",
        error
      );
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };
}
