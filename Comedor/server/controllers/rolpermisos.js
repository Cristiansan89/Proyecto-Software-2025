// Importa las funciones de validación para los datos del RolPermiso
import {
  validateRolPermiso,
  validatePartialRolPermiso,
} from "../schemas/rolpermisos.js";

// Controlador para manejar las operaciones relacionadas con los RolPermisos
export class RolPermisoController {
  // Recibe el modelo de RolPermiso por inyección de dependencias
  constructor({ rolPermisoModel }) {
    this.rolPermisoModel = rolPermisoModel;
  }

  // Obtiene todos los RolPermisos
  getAll = async (req, res) => {
    try {
      const rolPermisos = await this.rolPermisoModel.getAll();
      res.json(rolPermisos);
    } catch (error) {
      console.error("Error al obtener relaciones rol-permiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un RolPermiso por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const rolPermiso = await this.rolPermisoModel.getById({ id });
      if (rolPermiso) return res.json(rolPermiso);
      // Si no existe, responde con 404
      res.status(404).json({ message: "Relación rol-permiso no encontrada" });
    } catch (error) {
      console.error("Error al obtener relación rol-permiso por ID:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crea un nuevo RolPermiso después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validateRolPermiso(req.body);

      // Si la validación falla, responde con error 400
      if (!result.success) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      // Crea el nuevo RolPermiso y responde con el objeto creado
      const newRolPermiso = await this.rolPermisoModel.create({
        input: result.data,
      });
      res.status(201).json(newRolPermiso);
    } catch (error) {
      console.error("Error al crear relación rol-permiso:", error);
      if (error.message.includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un RolPermiso por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.rolPermisoModel.delete({ id });

      // Si no se encuentra el RolPermiso, responde con 404
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Relación rol-permiso no encontrada" });
      }
      // Si se elimina correctamente, responde con mensaje de éxito
      return res.json({
        message: "Relación rol-permiso eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar relación rol-permiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un RolPermiso parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialRolPermiso(req.body);

      // Si la validación falla, responde con error 400
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
      // Actualiza el RolPermiso y responde con el objeto actualizado
      const updatedRolPermiso = await this.rolPermisoModel.update({
        id,
        input: result.data,
      });

      if (!updatedRolPermiso) {
        return res
          .status(404)
          .json({ message: "Relación rol-permiso no encontrada" });
      }

      return res.json(updatedRolPermiso);
    } catch (error) {
      console.error("Error al actualizar relación rol-permiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener permisos por rol
  getPermisosByRol = async (req, res) => {
    try {
      const { id_rol } = req.params;
      const permisos = await this.rolPermisoModel.getPermisosByRol({ id_rol });
      res.json(permisos);
    } catch (error) {
      console.error("Error al obtener permisos por rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener roles por permiso
  getRolesByPermiso = async (req, res) => {
    try {
      const { id_permiso } = req.params;
      const roles = await this.rolPermisoModel.getRolesByPermiso({
        id_permiso,
      });
      res.json(roles);
    } catch (error) {
      console.error("Error al obtener roles por permiso:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Asignar permisos a rol
  asignarPermisosRol = async (req, res) => {
    try {
      const { id_rol } = req.params;
      const { permisos } = req.body;

      const resultado = await this.rolPermisoModel.asignarPermisosRol({
        id_rol,
        permisos,
      });
      res.json({ message: "Permisos asignados correctamente", resultado });
    } catch (error) {
      console.error("Error al asignar permisos a rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Revocar permiso de rol
  revocarPermisoRol = async (req, res) => {
    try {
      const { id_rol, id_permiso } = req.params;
      const revocado = await this.rolPermisoModel.revocarPermisoRol({
        id_rol,
        id_permiso,
      });

      if (!revocado) {
        return res
          .status(404)
          .json({ message: "Relación rol-permiso no encontrada" });
      }

      res.json({ message: "Permiso revocado correctamente" });
    } catch (error) {
      console.error("Error al revocar permiso de rol:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}
