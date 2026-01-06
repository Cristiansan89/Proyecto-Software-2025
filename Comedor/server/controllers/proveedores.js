// Importa las funciones de validación para los datos del Proveedor
import {
  validateProveedor,
  validatePartialProveedor,
  validateAsignarInsumos,
} from "../schemas/proveedores.js";

// Controlador para manejar las operaciones relacionadas con los Proveedores
export class ProveedorController {
  // Recibe el modelo de Proveedor por inyección de dependencias
  constructor({ proveedorModel }) {
    this.proveedorModel = proveedorModel;
  }

  // Obtiene todos los Proveedores
  getAll = async (req, res) => {
    try {
      const proveedores = await this.proveedorModel.getAllWithInsumos();
      res.json(proveedores);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene las calificaciones disponibles para insumos
  getCalificaciones = async (req, res) => {
    try {
      const calificaciones = [
        { value: "Excelente", label: "Excelente", color: "success" },
        { value: "Bueno", label: "Bueno", color: "info" },
        { value: "Regular", label: "Regular", color: "warning" },
        { value: "Malo", label: "Malo", color: "danger" },
      ];
      res.json(calificaciones);
    } catch (error) {
      console.error("Error al obtener calificaciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un Proveedor por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const proveedor = await this.proveedorModel.getById({ id });
      if (proveedor) return res.json(proveedor);
      res.status(404).json({ message: "Proveedor no encontrado" });
    } catch (error) {
      console.error("Error al obtener proveedor:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crea un nuevo Proveedor después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validateProveedor(req.body);

      if (!result.success) {
        const errors = result.error.issues || result.error.errors || [];
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: errors.map((err) => ({
            field: err.path?.join(".") || "desconocido",
            message: err.message,
          })),
        });
      }

      const newProveedor = await this.proveedorModel.create({
        input: result.data,
      });
      res.status(201).json(newProveedor);
    } catch (error) {
      console.error("Error al crear proveedor:", error);
      if (error.message.toLowerCase().includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un Proveedor por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si el proveedor tiene insumos activos asignados
      const hasActiveInsumos = await this.proveedorModel.hasActiveInsumos({
        id,
      });
      if (hasActiveInsumos) {
        return res.status(409).json({
          message:
            "No se puede eliminar el proveedor porque está vinculado a registros activos",
        });
      }

      const deleted = await this.proveedorModel.delete({ id });

      if (!deleted) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }
      return res.json({ message: "Proveedor eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      if (
        error.message.includes("referencia") ||
        error.message.includes("usado")
      ) {
        return res.status(409).json({
          message: "No se puede eliminar el proveedor porque está en uso",
        });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un Proveedor parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialProveedor(req.body);

      if (!result.success) {
        const errors = result.error.issues || result.error.errors || [];
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: errors.map((err) => ({
            field: err.path?.join(".") || "desconocido",
            message: err.message,
          })),
        });
      }

      const { id } = req.params;
      const updatedProveedor = await this.proveedorModel.update({
        id,
        input: result.data,
      });

      if (!updatedProveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      res.json(updatedProveedor);
    } catch (error) {
      console.error("Error al actualizar proveedor:", error);
      if (error.message.toLowerCase().includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener proveedores activos
  getActivos = async (req, res) => {
    try {
      const proveedores = await this.proveedorModel.getProveedoresActivos();
      res.json(proveedores);
    } catch (error) {
      console.error("Error al obtener proveedores activos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Buscar proveedores por RUC
  getByRuc = async (req, res) => {
    try {
      const { ruc } = req.params;
      const proveedor = await this.proveedorModel.getProveedorByRuc({ ruc });
      if (proveedor) return res.json(proveedor);
      res.status(404).json({ message: "Proveedor no encontrado" });
    } catch (error) {
      console.error("Error al buscar proveedor por RUC:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Buscar proveedores por nombre
  searchByName = async (req, res) => {
    try {
      const { nombre } = req.query;
      if (!nombre) {
        return res
          .status(400)
          .json({ message: "El parámetro nombre es requerido" });
      }
      const proveedores = await this.proveedorModel.searchProveedoresByName({
        nombre,
      });
      res.json(proveedores);
    } catch (error) {
      console.error("Error al buscar proveedor por nombre:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Cambiar estado del proveedor
  cambiarEstado = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (estado === undefined) {
        return res.status(400).json({ message: "El estado es requerido" });
      }

      const proveedor = await this.proveedorModel.getById({ id });
      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      const updated = await this.proveedorModel.update({
        id,
        input: { estado },
      });
      res.json(updated);
    } catch (error) {
      console.error("Error al cambiar estado del proveedor:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener insumos asignados a un proveedor
  getInsumosAsignados = async (req, res) => {
    try {
      const { id } = req.params;
      const insumos = await this.proveedorModel.getInsumosAsignados({ id });
      res.json(insumos);
    } catch (error) {
      console.error("Error al obtener insumos asignados:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Asignar insumos a un proveedor
  asignarInsumos = async (req, res) => {
    try {
      const { id } = req.params;
      const result = validateAsignarInsumos(req.body);

      if (!result.success) {
        const errors = result.error.issues || result.error.errors || [];
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: errors.map((err) => ({
            field: err.path?.join(".") || "desconocido",
            message: err.message,
          })),
        });
      }

      const proveedor = await this.proveedorModel.getById({ id });
      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      await this.proveedorModel.asignarInsumos({
        idProveedor: id,
        insumos: result.data.insumos,
      });

      const insumosAsignados = await this.proveedorModel.getInsumosAsignados({
        id,
      });
      res.json({
        message: "Insumos asignados correctamente",
        insumos: insumosAsignados,
      });
    } catch (error) {
      console.error("Error al asignar insumos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}
