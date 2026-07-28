import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { corsMiddleware } from "./middlewares/cors.js";
import { cookieMiddleware } from "./middlewares/cookies.js";
import { auditoriaMiddleware } from "./middlewares/auditoria.js";
import { authRequired } from "./middlewares/auth.js";

// Importar todas las rutas
import { createAuthRouter } from "./routes/auth.js";
import { createAsistenciaRouter } from "./routes/asistencias.js";
import { createRolRouter } from "./routes/roles.js";
import { createGradoRouter } from "./routes/grados.js";
import { createInsumoRouter } from "./routes/insumos.js";
import { createInventarioRouter } from "./routes/inventarios.js";
import { createItemRecetaRouter } from "./routes/itemsrecetas.js";
import { createLineaPedidoRouter } from "./routes/lineaspedidos.js";
import { createMovimientoInventarioRouter } from "./routes/movimientosinventarios.js";
import { createParametroSistemaRouter } from "./routes/parametrossistemas.js";
import {
  createPedidoRouter,
  createPedidoPublicoRouter,
} from "./routes/pedidos.js";
import { createPermisoRouter } from "./routes/permisos.js";
import { createPersonaRouter } from "./routes/personas.js";
import { createPlanificacionMenuRouter } from "./routes/planificacionmenus.js";
import { createProveedorRouter } from "./routes/proveedores.js";
import { createRecetaRouter } from "./routes/recetas.js";
import { createRegistroAsistenciaRouter } from "./routes/registrosasistencias.js";
import { createRolPermisoRouter } from "./routes/rolpermisos.js";
import { createServicioRouter } from "./routes/servicios.js";
import { createServicioTurnoRouter } from "./routes/servicioturnos.js";
import { createTurnoRouter } from "./routes/turnos.js";
import { createUsuarioRouter } from "./routes/usuarios.js";
import { createConsumoRouter } from "./routes/consumos.js";
import { createProveedorInsumoRouter } from "./routes/proveedorinsumos.js";
import alumnoGradoRouter from "./routes/alumnogrado.js";
import docenteGradoRouter from "./routes/docentegrado.js";
import reemplazoDocenteRouter from "./routes/reemplazodocente.js";
import telegramRouter from "./routes/telegram.js";
import estadoPedidoRouter from "./routes/estadospedido.js";
import tipoMermaRouter from "./routes/tiposmerma.js";
import alertasInventarioRouter from "./routes/alertasInventario.js";
import generacionAutomaticaRouter from "./routes/generacionAutomaticaRoutes.js";
import escuelaRouter from "./routes/escuela.js";
import configuracionServicioAutomaticoRouter from "./routes/configuracionServicioAutomatico.js";
import serviciosRecetasRouter from "./routes/serviciosRecetas.js";
import auditoriaRouter from "./routes/auditoria.js";
import alertasService from "./services/alertasInventarioService.js";
import { schedulerService } from "./services/schedulerService.js";

export const createApp = ({
  usuarioModel,
  asistenciaModel,
  consumoModel,
  rolModel,
  gradoModel,
  insumoModel,
  inventarioModel,
  itemRecetaModel,
  lineaPedidoModel,
  movimientoInventarioModel,
  parametroSistemaModel,
  pedidoModel,
  permisoModel,
  personaModel,
  planificacionMenuModel,
  proveedorModel,
  proveedorInsumoModel,
  recetaModel,
  registroAsistenciaModel,
  rolPermisoModel,
  servicioModel,
  servicioTurnoModel,
  turnoModel,
}) => {
  const app = express();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, "../client/dist");

  // ==========================================
  // 1. PRIMER PASO ABSOLUTO: CORS Y PREFLIGHT
  // ==========================================
  app.use(corsMiddleware());

  // ==========================================
  // 2. MIDDLEWARES BÁSICOS
  // ==========================================
  app.use(express.json());
  app.use(cookieMiddleware());
  app.disable("x-powered-by");

  // ==========================================
  // 3. RUTAS PÚBLICAS DE LA API
  // ==========================================
  app.use("/api/auth", createAuthRouter({ usuarioModel }));
  app.use("/api/asistencias", createAsistenciaRouter({ asistenciaModel }));
  app.use("/api/alertas-inventario", alertasInventarioRouter);
  app.use("/api/pedidos", createPedidoPublicoRouter({ pedidoModel }));

  // Endpoint específico para obtener alumnos de un grado
  app.get("/api/alumnos-grado", async (req, res) => {
    try {
      const { nombreGrado } = req.query;

      if (!nombreGrado) {
        return res.status(400).json({
          message: "El parámetro nombreGrado es requerido",
        });
      }

      const { AlumnoGradoModel } = await import("./models/alumnogrado.js");
      const alumnos = await AlumnoGradoModel.getByGrado({ nombreGrado });
      res.json(alumnos);
    } catch (error) {
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  });

  // ==========================================
  // 4. AUTENTICACIÓN Y AUDITORÍA DE LA API
  // ==========================================
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return authRequired(req, res, next);
    }
    next();
  });

  app.use(auditoriaMiddleware());

  // ==========================================
  // 5. RUTAS PROTEGIDAS DE LA API
  // ==========================================
  app.use("/api/roles", createRolRouter({ rolModel }));
  app.use("/api/usuarios", createUsuarioRouter({ usuarioModel }));
  app.use("/api/consumos", createConsumoRouter({ consumoModel }));
  app.use("/api/grados", createGradoRouter({ gradoModel }));
  app.use("/api/insumos", createInsumoRouter({ insumoModel }));
  app.use("/api/inventarios", createInventarioRouter({ inventarioModel }));
  app.use("/api/items-recetas", createItemRecetaRouter({ itemRecetaModel }));
  app.use("/api/lineaspedidos", createLineaPedidoRouter({ lineaPedidoModel }));
  app.use(
    "/api/movimientos-inventarios",
    createMovimientoInventarioRouter({ movimientoInventarioModel }),
  );
  app.use(
    "/api/parametros-sistemas",
    createParametroSistemaRouter({ parametroSistemaModel }),
  );
  app.use("/api/pedidos", createPedidoRouter({ pedidoModel }));
  app.use("/api/permisos", createPermisoRouter({ permisoModel }));
  app.use("/api/personas", createPersonaRouter({ personaModel }));
  app.use(
    "/api/planificacion-menus",
    createPlanificacionMenuRouter({ planificacionMenuModel }),
  );
  app.use(
    "/api/proveedores",
    createProveedorRouter({ proveedorModel, usuarioModel, personaModel }),
  );
  app.use("/api/recetas", createRecetaRouter({ recetaModel }));
  app.use(
    "/api/registros-asistencias",
    createRegistroAsistenciaRouter({ registroAsistenciaModel }),
  );
  app.use("/api/rol-permisos", createRolPermisoRouter({ rolPermisoModel }));
  app.use("/api/servicios", createServicioRouter({ servicioModel }));
  app.use(
    "/api/servicio-turnos",
    createServicioTurnoRouter({ servicioTurnoModel }),
  );
  app.use("/api/recetas-servicios", serviciosRecetasRouter);
  app.use("/api/turnos", createTurnoRouter({ turnoModel }));
  app.use(
    "/api/proveedor-insumos",
    createProveedorInsumoRouter({ proveedorInsumoModel }),
  );
  app.use("/api/telegram", telegramRouter);
  app.use("/api/alumno-grados", alumnoGradoRouter);
  app.use("/api/docente-grados", docenteGradoRouter);
  app.use("/api/reemplazo-docentes", reemplazoDocenteRouter);
  app.use("/api/estado-pedidos", estadoPedidoRouter);
  app.use("/api/tipos-merma", tipoMermaRouter);
  app.use("/api/generacion-automatica", generacionAutomaticaRouter);
  app.use("/api/escuela", escuelaRouter);
  app.use(
    "/api/configuracion-servicios-automaticos",
    configuracionServicioAutomaticoRouter,
  );
  app.use("/api/auditoria", auditoriaRouter);

  // Inicialización de servicios en segundo plano
  alertasService.inicializar();
  schedulerService.inicializar();

  // ==========================================
  // 6. ARCHIVOS ESTÁTICOS Y FALLBACK (FRONTEND)
  // ==========================================
  // Servir archivos estáticos únicamente si la solicitud NO es para la API
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    express.static(distPath)(req, res, next);
  });

  // SPA Fallback: servir index.html para rutas de navegación Web
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api") && !req.path.includes(".")) {
      const indexPath = path.join(distPath, "index.html");
      return res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).json({ message: "Página no encontrada" });
        }
      });
    }
    next();
  });

  // ==========================================
  // 7. MANEJADOR GLOBAL DE ERRORES (MANDATORIO)
  // ==========================================
  app.use((err, req, res, next) => {
    console.error("❌ Error en el servidor:", err.stack || err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
};
