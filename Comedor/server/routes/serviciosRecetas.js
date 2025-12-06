import express from "express";
import {
  getServiciosPorReceta,
  getRecetasPorServicio,
  crearServicioReceta,
  eliminarServicioReceta,
  actualizarServiciosReceta,
  getAll,
} from "../controllers/servicioRecetaController.js";

const router = express.Router();

/**
 * GET /api/recetas-servicios
 * Obtener todas las asociaciones receta-servicio
 */
router.get("/", getAll);

/**
 * GET /api/recetas-servicios/receta/:id_receta
 * Obtener todos los servicios de una receta específica
 */
router.get("/receta/:id_receta", getServiciosPorReceta);

/**
 * GET /api/recetas-servicios/servicio/:id_servicio
 * Obtener todas las recetas de un servicio específico
 */
router.get("/servicio/:id_servicio", getRecetasPorServicio);

/**
 * POST /api/recetas-servicios
 * Crear una nueva asociación entre receta y servicio
 * Body: { id_receta, id_servicio }
 */
router.post("/", crearServicioReceta);

/**
 * PATCH /api/recetas-servicios/receta/:id_receta
 * Actualizar los servicios de una receta (reemplaza todos)
 * Body: { servicios: [1, 2, 3] }
 */
router.patch("/receta/:id_receta", actualizarServiciosReceta);

/**
 * DELETE /api/recetas-servicios/:id_receta/:id_servicio
 * Eliminar una asociación específica entre receta y servicio
 */
router.delete("/:id_receta/:id_servicio", eliminarServicioReceta);

export default router;
