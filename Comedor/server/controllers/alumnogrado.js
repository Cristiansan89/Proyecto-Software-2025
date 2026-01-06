import { AlumnoGradoModel } from "../models/alumnogrado.js";
import {
  validateAlumnoGrado,
  validatePartialAlumnoGrado,
} from "../schemas/alumnogrado.js";

export class AlumnoGradoController {
  // Función para normalizar fechas de timestamp a YYYY-MM-DD
  static normalizeFecha(fecha) {
    if (!fecha) return fecha;

    // Convertir a string si no lo es
    const fechaStr = String(fecha);

    // Si es un timestamp completo, convertir a fecha
    if (fechaStr.includes("T")) {
      return fechaStr.split("T")[0];
    }

    return fechaStr;
  }

  static async getAll(req, res) {
    try {
      const alumnos = await AlumnoGradoModel.getAll();
      res.json(alumnos);
    } catch (error) {
      console.error("Error al obtener alumnos-grados:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const alumno = await AlumnoGradoModel.getById({ id });

      if (!alumno) {
        return res.status(404).json({
          message: "Asignación de alumno-grado no encontrada",
        });
      }

      res.json(alumno);
    } catch (error) {
      console.error("Error al obtener alumno-grado:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async getByGrado(req, res) {
    try {
      const { nombreGrado } = req.params;
      const alumnos = await AlumnoGradoModel.getByGrado({ nombreGrado });
      res.json(alumnos);
    } catch (error) {
      console.error("Error al obtener alumnos por grado:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async create(req, res) {
    try {
      // Normalizar fechas antes de validar
      const normalizedData = {
        ...req.body,
        cicloLectivo: AlumnoGradoController.normalizeFecha(
          req.body.cicloLectivo
        ),
      };

      const result = validateAlumnoGrado(normalizedData);

      if (!result.success) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const alumno = await AlumnoGradoModel.create({ input: result.data });
      res.status(201).json(alumno);
    } catch (error) {
      console.error("Error al crear asignación alumno-grado:", error);

      if (error.message.includes("Ya existe")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      if (error.message.includes("no tiene el rol")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const result = validatePartialAlumnoGrado(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      const alumno = await AlumnoGradoModel.update({ id, input: result.data });

      if (!alumno) {
        return res.status(404).json({
          message: "Asignación de alumno-grado no encontrada",
        });
      }

      res.json(alumno);
    } catch (error) {
      console.error("Error al actualizar asignación alumno-grado:", error);

      if (error.message.includes("no tiene el rol")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await AlumnoGradoModel.delete({ id });

      if (!deleted) {
        return res.status(404).json({
          message: "Asignación de alumno-grado no encontrada",
        });
      }

      res.json({
        message: "Asignación de alumno-grado eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar asignación alumno-grado:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  static async getAlumnosDisponibles(req, res) {
    try {
      const { cicloLectivo } = req.query;
      const alumnos = await AlumnoGradoModel.getAlumnosDisponibles({
        cicloLectivo: cicloLectivo || new Date().getFullYear(),
      });
      res.json(alumnos);
    } catch (error) {
      console.error("Error al obtener alumnos disponibles:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
}
