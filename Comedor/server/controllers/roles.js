// Importa las funciones de validación para los datos del rol
import { validateRol, validatePartialRol } from "../schemas/roles.js";

// Controlador para manejar las operaciones relacionadas con los roles
export class RolController {
  // Recibe el modelo de rol por inyección de dependencias
  constructor({ rolModel }) {
    this.rolModel = rolModel;
  }

  // Obtiene todos los roles
  getAll = async (req, res) => {
    try {
      const roles = await this.rolModel.getAll();
      res.json(roles);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un rol por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const rol = await this.rolModel.getById({ id });
      if (rol) return res.json(rol);
      res.status(404).json({ message: "Rol no encontrado" });
    } catch (error) {
      console.error("Error al obtener rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Función para normalizar los datos de entrada
  normalizeRolData = (data) => {
    const normalized = { ...data };

    // Normalizar habilitaCuentaUsuario: convertir "Sí" a "Si"
    if (normalized.habilitaCuentaUsuario === "Sí") {
      normalized.habilitaCuentaUsuario = "Si";
    }

    return normalized;
  };

  // Crea un nuevo rol después de validar los datos recibidos
  create = async (req, res) => {
    try {
      console.log("RolController: Datos recibidos:", req.body);

      // Normalizar datos antes de validar
      const normalizedData = this.normalizeRolData(req.body);
      console.log("RolController: Datos normalizados:", normalizedData);

      const result = validateRol(normalizedData);
      console.log("RolController: Resultado de validación:", result);

      if (!result.success) {
        console.log(
          "RolController: Errores de validación:",
          result.error.issues
        );
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const newRol = await this.rolModel.create({ input: result.data });
      res.status(201).json(newRol);
    } catch (error) {
      console.error("Error al crear rol:", error);
      if (error.message.includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un rol por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.rolModel.delete({ id });

      if (!deleted) {
        return res.status(404).json({ message: "Rol no encontrado" });
      }

      return res.json({ message: "Rol eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      // Detectar error de constraint (rol con relaciones pendientes)
      const code = error && error.code ? error.code : "";
      const msg = error && error.message ? error.message : "";

      if (
        code.includes("ER_ROW_IS_REFERENCED") ||
        msg.toLowerCase().includes("foreign key") ||
        msg.toLowerCase().includes("referenced")
      ) {
        return res.status(409).json({
          message:
            "No se puede eliminar el rol porque tiene permisos o relaciones vinculadas. Revocar las asignaciones de permisos antes de eliminar.",
        });
      }

      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un rol parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      // Normalizar datos antes de validar
      const normalizedData = this.normalizeRolData(req.body);
      const result = validatePartialRol(normalizedData);

      if (!result.success) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const { id } = req.params;
      const updatedRol = await this.rolModel.update({ id, input: result.data });

      if (!updatedRol) {
        return res.status(404).json({ message: "Rol no encontrado" });
      }

      res.json(updatedRol);
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener roles activos
  getActivos = async (req, res) => {
    try {
      const allRoles = await this.rolModel.getAll();
      const rolesActivos = allRoles.filter((rol) => rol.estado === "Activo");
      res.json(rolesActivos);
    } catch (error) {
      console.error("Error al obtener roles activos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Buscar roles por nombre
  searchByNombre = async (req, res) => {
    try {
      const { nombre } = req.query;
      if (!nombre) {
        return res
          .status(400)
          .json({ message: "El parámetro nombre es requerido" });
      }
      const allRoles = await this.rolModel.getAll();
      const rolesFiltrados = allRoles.filter(
        (rol) =>
          rol.nombreRol.toLowerCase().includes(nombre.toLowerCase()) ||
          rol.descripcionRol.toLowerCase().includes(nombre.toLowerCase())
      );
      res.json(rolesFiltrados);
    } catch (error) {
      console.error("Error al buscar roles por nombre:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener rol con sus permisos (por implementar cuando tengamos RolPermisos)
  getConPermisos = async (req, res) => {
    try {
      const { id } = req.params;
      const rol = await this.rolModel.getById({ id });
      if (!rol) {
        return res.status(404).json({ message: "Rol no encontrado" });
      }
      // Por ahora solo devolvemos el rol, luego implementaremos la relación con permisos
      res.json({ ...rol, permisos: [] });
    } catch (error) {
      console.error("Error al obtener rol con permisos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Cambiar estado del rol
  cambiarEstado = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (estado === undefined) {
        return res.status(400).json({ message: "El estado es requerido" });
      }

      if (!["Activo", "Inactivo"].includes(estado)) {
        return res.status(400).json({ message: "Estado inválido" });
      }

      const rolActualizado = await this.rolModel.update({
        id,
        input: { estado },
      });
      if (!rolActualizado) {
        return res.status(404).json({ message: "Rol no encontrado" });
      }

      res.json(rolActualizado);
    } catch (error) {
      console.error("Error al cambiar estado del rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}
