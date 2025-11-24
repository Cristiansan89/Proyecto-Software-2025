import TipoMermaModel from "../models/tipomerma.js";

class TipoMermaController {
  constructor() {
    this.tipoMermaModel = new TipoMermaModel();
  }

  // Obtener todos los tipos de merma
  getAll = async (req, res) => {
    try {
      const tiposMerma = await this.tipoMermaModel.getAll();
      res.json(tiposMerma);
    } catch (error) {
      console.error("Error al obtener tipos de merma:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Obtener tipos de merma activos
  getActivos = async (req, res) => {
    try {
      const tiposMerma = await this.tipoMermaModel.getActivos();
      res.json(tiposMerma);
    } catch (error) {
      console.error("Error al obtener tipos de merma activos:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Obtener tipo de merma por ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const tipoMerma = await this.tipoMermaModel.getById(id);

      if (!tipoMerma) {
        return res.status(404).json({
          message: "Tipo de merma no encontrado",
        });
      }

      res.json(tipoMerma);
    } catch (error) {
      console.error("Error al obtener tipo de merma:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Crear nuevo tipo de merma
  create = async (req, res) => {
    try {
      const { nombre, descripcion, estado } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          message: "El nombre es requerido",
        });
      }

      if (nombre.length > 50) {
        return res.status(400).json({
          message: "El nombre no puede tener más de 50 caracteres",
        });
      }

      if (descripcion && descripcion.length > 200) {
        return res.status(400).json({
          message: "La descripción no puede tener más de 200 caracteres",
        });
      }

      // Verificar si ya existe un tipo con el mismo nombre
      const exists = await this.tipoMermaModel.existsByNombre(nombre);
      if (exists) {
        return res.status(409).json({
          message: "Ya existe un tipo de merma con ese nombre",
        });
      }

      const nuevoTipoMerma = await this.tipoMermaModel.create({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        estado: estado || "Activo",
      });

      res.status(201).json({
        message: "Tipo de merma creado exitosamente",
        data: nuevoTipoMerma,
      });
    } catch (error) {
      console.error("Error al crear tipo de merma:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Actualizar tipo de merma
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, estado } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          message: "El nombre es requerido",
        });
      }

      if (nombre.length > 50) {
        return res.status(400).json({
          message: "El nombre no puede tener más de 50 caracteres",
        });
      }

      if (descripcion && descripcion.length > 200) {
        return res.status(400).json({
          message: "La descripción no puede tener más de 200 caracteres",
        });
      }

      // Verificar si existe otro tipo con el mismo nombre
      const exists = await this.tipoMermaModel.existsByNombre(nombre, id);
      if (exists) {
        return res.status(409).json({
          message: "Ya existe un tipo de merma con ese nombre",
        });
      }

      const tipoMermaActualizado = await this.tipoMermaModel.update(id, {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        estado,
      });

      res.json({
        message: "Tipo de merma actualizado exitosamente",
        data: tipoMermaActualizado,
      });
    } catch (error) {
      console.error("Error al actualizar tipo de merma:", error);

      if (error.message === "Tipo de merma no encontrado") {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Eliminar tipo de merma
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.tipoMermaModel.delete(id);

      res.json(result);
    } catch (error) {
      console.error("Error al eliminar tipo de merma:", error);

      if (error.message === "Tipo de merma no encontrado") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("está siendo usado")) {
        return res.status(409).json({ message: error.message });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };
}

export default TipoMermaController;
