import { Router } from "express";
import { EscuelaService } from "../services/escuelaService.js";

const router = Router();

// GET /api/escuela - Obtener datos de la escuela
router.get("/", async (req, res) => {
  try {
    const datos = await EscuelaService.getDatosEscuela();
    res.json(datos);
  } catch (error) {
    console.error("Error al obtener datos de la escuela:", error);
    res.status(500).json({
      message: "Error al obtener datos de la escuela",
      error: error.message,
    });
  }
});

// PUT /api/escuela - Actualizar datos de la escuela
router.put("/", async (req, res) => {
  try {
    const resultado = await EscuelaService.actualizarDatosEscuela(req.body);
    res.json({
      message: "Datos de la escuela actualizados exitosamente",
      ...resultado,
    });
  } catch (error) {
    console.error("Error al actualizar datos de la escuela:", error);
    res.status(500).json({
      message: "Error al actualizar datos de la escuela",
      error: error.message,
    });
  }
});

export default router;
