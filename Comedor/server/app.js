import express from "express";
import { corsMiddleware } from "./middlewares/cors.js";
import { createAuthRouter } from "./routes/auth.js";

// Importar todas las rutas
import { createAsistenciaRouter } from "./routes/asistencias.js";
import { createRolRouter } from "./routes/roles.js";
import { createGradoRouter } from "./routes/grados.js";
import { createInsumoRouter } from "./routes/insumos.js";
import { createInventarioRouter } from "./routes/inventarios.js";
import { createItemRecetaRouter } from "./routes/itemsrecetas.js";
import { createLineaPedidoRouter } from "./routes/lineaspedidos.js";
import { createMovimientoInventarioRouter } from "./routes/movimientosinventarios.js";
import { createParametroSistemaRouter } from "./routes/parametrossistemas.js";
import { createPedidoRouter } from "./routes/pedidos.js";
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
import alertasService from "./services/alertasInventarioService.js";

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

  // Middlewares
  app.use(express.json());
  app.use(corsMiddleware());
  app.disable("x-powered-by");

  // Rutas públicas (no requieren autenticación)
  app.use("/api/auth", createAuthRouter({ usuarioModel }));
  app.use("/api/asistencias", createAsistenciaRouter({ asistenciaModel }));

  // Comentamos temporalmente el middleware de autenticación
  // app.use(authRequired)

  // Todas las rutas ahora son públicas
  app.use("/api/roles", createRolRouter({ rolModel }));
  app.use("/api/usuarios", createUsuarioRouter({ usuarioModel }));
  app.use("/api/consumos", createConsumoRouter({ consumoModel }));
  app.use("/api/grados", createGradoRouter({ gradoModel }));
  app.use("/api/insumos", createInsumoRouter({ insumoModel }));
  app.use("/api/inventarios", createInventarioRouter({ inventarioModel }));
  app.use("/api/items-recetas", createItemRecetaRouter({ itemRecetaModel }));
  app.use("/api/lineas-pedidos", createLineaPedidoRouter({ lineaPedidoModel }));
  app.use(
    "/api/movimientos-inventarios",
    createMovimientoInventarioRouter({ movimientoInventarioModel })
  );
  app.use(
    "/api/parametros-sistemas",
    createParametroSistemaRouter({ parametroSistemaModel })
  );
  app.use("/api/pedidos", createPedidoRouter({ pedidoModel }));
  app.use("/api/permisos", createPermisoRouter({ permisoModel }));
  app.use("/api/personas", createPersonaRouter({ personaModel }));
  app.use(
    "/api/planificacion-menus",
    createPlanificacionMenuRouter({ planificacionMenuModel })
  );
  app.use("/api/proveedores", createProveedorRouter({ proveedorModel }));
  app.use("/api/recetas", createRecetaRouter({ recetaModel }));
  app.use(
    "/api/registros-asistencias",
    createRegistroAsistenciaRouter({ registroAsistenciaModel })
  );
  app.use("/api/rol-permisos", createRolPermisoRouter({ rolPermisoModel }));
  app.use("/api/servicios", createServicioRouter({ servicioModel }));
  app.use(
    "/api/servicio-turnos",
    createServicioTurnoRouter({ servicioTurnoModel })
  );
  app.use("/api/turnos", createTurnoRouter({ turnoModel }));
  app.use(
    "/api/proveedor-insumos",
    createProveedorInsumoRouter({ proveedorInsumoModel })
  );
  app.use("/api/telegram", telegramRouter);
  app.use("/api/alumno-grados", alumnoGradoRouter);
  app.use("/api/docente-grados", docenteGradoRouter);
  app.use("/api/reemplazo-docentes", reemplazoDocenteRouter);
  app.use("/api/estado-pedidos", estadoPedidoRouter);
  app.use("/api/tipos-merma", tipoMermaRouter);
  app.use("/api/alertas-inventario", alertasInventarioRouter);

  // Inicializar servicio de alertas
  alertasService
    .inicializar()
    .catch((err) =>
      console.error("Error al inicializar servicio de alertas:", err)
    );

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
      console.error("Error al obtener alumnos por grado:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  });

  return app;
};
