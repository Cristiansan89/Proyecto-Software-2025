import { Router } from "express";
import { ProveedorController } from "../controllers/proveedores.js";

export const createProveedorRouter = ({
  proveedorModel,
  usuarioModel,
  personaModel,
}) => {
  const proveedoresRouter = Router();
  const proveedorController = new ProveedorController({
    proveedorModel,
    usuarioModel,
    personaModel,
  });

  // Endpoints generales
  proveedoresRouter.get("/", proveedorController.getAll);
  proveedoresRouter.post("/", proveedorController.create);

  // Endpoints especializados (ANTES de las rutas con :id)
  proveedoresRouter.get(
    "/calificaciones",
    proveedorController.getCalificaciones
  );
  proveedoresRouter.get("/activos/list", proveedorController.getActivos);
  proveedoresRouter.get("/search/by-nombre", proveedorController.searchByName);

  // Endpoints específicos por ID (DESPUÉS de los especializados)
  proveedoresRouter.get("/:id", proveedorController.getById);
  proveedoresRouter.delete("/:id", proveedorController.delete);
  proveedoresRouter.patch("/:id", proveedorController.update);
  proveedoresRouter.patch("/:id/estado", proveedorController.cambiarEstado);

  // Endpoints para gestión de insumos
  proveedoresRouter.get(
    "/:id/insumos",
    proveedorController.getInsumosAsignados
  );
  proveedoresRouter.post("/:id/insumos", proveedorController.asignarInsumos);

  return proveedoresRouter;
};
