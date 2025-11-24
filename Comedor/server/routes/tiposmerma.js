import express from "express";
import TipoMermaController from "../controllers/tiposmerma.js";
import { authRequired } from "../middlewares/auth.js";

const router = express.Router();
const controller = new TipoMermaController();

// Rutas públicas (solo lectura)
router.get("/", controller.getAll);
router.get("/activos", controller.getActivos);
router.get("/:id", controller.getById);

// Rutas protegidas (requieren autenticación)
router.post("/", authRequired, controller.create);
router.patch("/:id", authRequired, controller.update);
router.delete("/:id", authRequired, controller.delete);

export default router;
