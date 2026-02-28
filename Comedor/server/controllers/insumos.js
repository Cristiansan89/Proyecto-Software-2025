// Importa las funciones de validación para los datos del Insumo
import { validateInsumo, validatePartialInsumo } from "../schemas/insumos.js";

// Controlador para manejar las operaciones relacionadas con los Insumos
export class InsumoController {
  // Recibe el modelo de Insumo por inyección de dependencias
  constructor({ insumoModel }) {
    this.insumoModel = insumoModel;
  }

  // Obtiene todos los Insumos
  getAll = async (req, res) => {
    try {
      const insumos = await this.insumoModel.getAll();
      res.json(insumos);
    } catch (error) {
      console.error("Error al obtener insumos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un Insumo por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const insumo = await this.insumoModel.getById({ id });
      if (insumo) return res.json(insumo);
      res.status(404).json({ message: "Insumo no encontrado" });
    } catch (error) {
      console.error("Error al obtener insumo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crea un nuevo Insumo después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validateInsumo(req.body);

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

      const newInsumo = await this.insumoModel.create({ input: result.data });
      res.status(201).json(newInsumo);
    } catch (error) {
      console.error("Error al crear insumo:", error);
      if (error.message.toLowerCase().includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Elimina un Insumo por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`[InsumoController.delete] Iniciando eliminación de insumo ${id}`);

      // Verificar si el insumo tiene relaciones activas
      const hasActiveRelations = await this.insumoModel.hasActiveRelations({
        id,
      });
      
      console.log(
        `[InsumoController.delete] hasActiveRelations=${hasActiveRelations}`
      );

      if (hasActiveRelations) {
        console.log(
          `[InsumoController.delete] Insumo ${id} tiene relaciones activas`
        );
        
        // Obtener detalles de las relaciones activas
        const relations = await this.insumoModel.getActiveRelationsDetails({ id });
        
        const recipeNames = relations.recetas.map(r => r.nombreReceta).join(", ");
        const providerNames = relations.proveedores.map(p => p.razonSocial).join(", ");
        
        let details = [];
        if (recipeNames) details.push(`Recetas: ${recipeNames}`);
        if (providerNames) details.push(`Proveedores: ${providerNames}`);
        
        const detailsText = details.length > 0 ? `\n\nRelaciones activas:\n${details.join("\n")}` : "";
        
        return res.status(409).json({
          message: `No se puede eliminar el insumo porque está vinculado a recetas o proveedores activos.${detailsText}`,
          details: {
            recetas: relations.recetas,
            proveedores: relations.proveedores,
          }
        });
      }

      const deleted = await this.insumoModel.delete({ id });

      if (!deleted) {
        console.log(`[InsumoController.delete] Insumo ${id} no encontrado`);
        return res.status(404).json({ message: "Insumo no encontrado" });
      }

      console.log(`[InsumoController.delete] Insumo ${id} eliminado exitosamente`);
      return res.json({ message: "Insumo eliminado correctamente" });
    } catch (error) {
      console.error(
        `[InsumoController.delete] Error al eliminar insumo ${req.params.id}:`,
        error
      );
      if (
        error.message.includes("referencia") ||
        error.message.includes("usado")
      ) {
        return res.status(409).json({
          message: "No se puede eliminar el insumo porque está en uso",
        });
      }
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Actualiza un Insumo parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialInsumo(req.body);

      if (!result.success) {
        const errors = result.error.issues || result.error.errors || [];
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: errors.map((err) => ({
            field: err.path?.join(".") || "desconocido",
            message: err.message,
          })),
          receivedData: req.body,
          validationDetails: result.error,
        });
      }

      const { id } = req.params;
      const updatedInsumo = await this.insumoModel.update({
        id,
        input: result.data,
      });

      if (!updatedInsumo) {
        return res.status(404).json({ message: "Insumo no encontrado" });
      }

      res.json(updatedInsumo);
    } catch (error) {
      console.error("Error al actualizar insumo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener insumos activos
  getActivos = async (req, res) => {
    try {
      const insumos = await this.insumoModel.getInsumosActivos();
      res.json(insumos);
    } catch (error) {
      console.error("Error al obtener insumos activos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener insumos con stock bajo
  getStockBajo = async (req, res) => {
    try {
      // El modelo expone `getBajoStock()`; usar ese método
      const insumos = await this.insumoModel.getBajoStock();
      res.json(insumos);
    } catch (error) {
      console.error("Error al obtener insumos con stock bajo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Buscar insumos por nombre
  searchByName = async (req, res) => {
    try {
      const { nombre } = req.query;
      if (!nombre) {
        return res
          .status(400)
          .json({ message: "El parámetro nombre es requerido" });
      }
      const insumos = await this.insumoModel.searchByName({ nombre });
      res.json(insumos);
    } catch (error) {
      console.error("Error al buscar insumos por nombre:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Buscar insumos por nombre (alias)
  searchByNombre = async (req, res) => {
    try {
      const { nombre } = req.query;
      if (!nombre) {
        return res
          .status(400)
          .json({ message: "El parámetro nombre es requerido" });
      }
      const insumos = await this.insumoModel.searchByName({ nombre });
      res.json(insumos);
    } catch (error) {
      console.error("Error al buscar insumos por nombre:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener insumos por categoría
  getByCategoria = async (req, res) => {
    try {
      const { categoria } = req.params;
      const insumos = await this.insumoModel.getByCategoria({ categoria });
      res.json(insumos);
    } catch (error) {
      console.error("Error al obtener insumos por categoría:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Cambiar estado del insumo
  cambiarEstado = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (estado === undefined) {
        return res.status(400).json({ message: "El estado es requerido" });
      }

      const updated = await this.insumoModel.cambiarEstado({ id, estado });

      if (!updated) {
        return res.status(404).json({ message: "Insumo no encontrado" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error al cambiar estado del insumo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}
