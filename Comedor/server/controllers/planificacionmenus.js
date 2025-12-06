// Importa las funciones de validación para los datos del planificacionmenu
import {
  validatePlanificacionMenu,
  validatePartialPlanificacionMenu,
} from "../schemas/planificacionmenus.js";

// Controlador para manejar las operaciones relacionadas con los PlanificacionMenus
export class PlanificacionMenuController {
  // Recibe el modelo de PlanificacionMenu por inyección de dependencias
  constructor({ planificacionMenuModel }) {
    this.planificacionMenuModel = planificacionMenuModel;
  }

  // Obtiene todos los PlanificacionMenus
  getAll = async (req, res) => {
    try {
      const planificacionMenus = await this.planificacionMenuModel.getAll();
      res.json(planificacionMenus);
    } catch (error) {
      console.error("Error al obtener planificaciones de menú:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un PlanificacionMenu por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;

      // Validar que el ID esté presente
      if (!id || id.trim() === "") {
        return res
          .status(400)
          .json({ message: "ID de planificación requerido" });
      }

      const planificacionMenu = await this.planificacionMenuModel.getById({
        id,
      });
      if (planificacionMenu) return res.json(planificacionMenu);
      // Si no existe, responde con 404
      res.status(404).json({ message: "Planificación de menú no encontrada" });
    } catch (error) {
      console.error("Error al obtener planificación de menú por ID:", error);
      res
        .status(500)
        .json({ message: "Error interno del servidor", error: error.message });
    }
  };

  // Crea un nuevo PlanificacionMenu después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validatePlanificacionMenu(req.body);

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

      // Crea el nuevo PlanificacionMenu y responde con el objeto creado
      const newPlanificacionMenu = await this.planificacionMenuModel.create({
        input: result.data,
      });
      res.status(201).json(newPlanificacionMenu);
    } catch (error) {
      console.error("Error al crear planificación de menú:", error);
      if (error.message.includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un PlanificacionMenu por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.planificacionMenuModel.delete({ id });

      // Si no se encuentra el PlanificacionMenu, responde con 404
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Planificación de menú no encontrada" });
      }
      // Si se elimina correctamente, responde con mensaje de éxito
      return res.json({
        message: "Planificación de menú eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar planificación de menú:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un PlanificacionMenu parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialPlanificacionMenu(req.body);

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
      // Actualiza el PlanificacionMenu y responde con el objeto actualizado
      const updatedPlanificacionMenu = await this.planificacionMenuModel.update(
        { id, input: result.data }
      );

      if (!updatedPlanificacionMenu) {
        return res
          .status(404)
          .json({ message: "Planificación de menú no encontrada" });
      }

      return res.json(updatedPlanificacionMenu);
    } catch (error) {
      console.error("Error al actualizar planificación de menú:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener planificaciones por fecha
  getByFecha = async (req, res) => {
    try {
      const { fecha } = req.params;
      const planificaciones = await this.planificacionMenuModel.getByFecha({
        fecha,
      });
      res.json(planificaciones);
    } catch (error) {
      console.error("Error al obtener planificaciones por fecha:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener planificaciones por servicio
  getByServicio = async (req, res) => {
    try {
      const { id_servicio } = req.params;
      const planificaciones = await this.planificacionMenuModel.getByServicio({
        id_servicio,
      });
      res.json(planificaciones);
    } catch (error) {
      console.error("Error al obtener planificaciones por servicio:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener planificaciones por rango de fechas
  getByRangoFechas = async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const planificaciones =
        await this.planificacionMenuModel.getByRangoFechas({
          fecha_inicio,
          fecha_fin,
        });
      res.json(planificaciones);
    } catch (error) {
      console.error(
        "Error al obtener planificaciones por rango de fechas:",
        error
      );
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener menú del día
  getMenuDelDia = async (req, res) => {
    try {
      const { fecha, id_servicio } = req.params;
      const menu = await this.planificacionMenuModel.getMenuDelDia({
        fecha,
        id_servicio,
      });
      if (menu) return res.json(menu);
      res.status(404).json({
        message: "No hay menú planificado para esta fecha y servicio",
      });
    } catch (error) {
      console.error("Error al obtener menú del día:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener planificación completa con jornadas
  getPlanificacionCompleta = async (req, res) => {
    try {
      const { id } = req.params;
      const planificacion =
        await this.planificacionMenuModel.getPlanificacionCompleta({ id });
      if (planificacion) return res.json(planificacion);
      res.status(404).json({ message: "Planificación no encontrada" });
    } catch (error) {
      console.error("Error al obtener planificación completa:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crear jornada en planificación
  crearJornada = async (req, res) => {
    try {
      const jornada = await this.planificacionMenuModel.crearJornada({
        input: req.body,
      });
      res.status(201).json(jornada);
    } catch (error) {
      console.error("Error al crear jornada:", error);
      res.status(500).json({ message: error.message });
    }
  };

  // Asignar receta a jornada
  asignarReceta = async (req, res) => {
    try {
      // Si viene con fecha e id_servicio, usar el método directo
      if (req.body.fecha && req.body.id_servicio && req.body.id_receta) {
        // Agregar el id_usuario del usuario autenticado
        const inputWithUser = {
          ...req.body,
          id_usuario: req.user?.id || req.body.id_usuario,
        };

        if (!inputWithUser.id_usuario) {
          return res.status(400).json({
            message: "Se requiere un usuario autenticado para asignar recetas",
          });
        }

        const asignacion =
          await this.planificacionMenuModel.asignarRecetaPorFechaServicio({
            input: inputWithUser,
          });
        res.status(201).json(asignacion);
      }
      // Si viene con id_jornada, usar el método original
      else if (req.body.id_jornada && req.body.id_receta) {
        const asignacion =
          await this.planificacionMenuModel.asignarRecetaAJornada({
            input: req.body,
          });
        res.status(201).json(asignacion);
      } else {
        res.status(400).json({
          message:
            "Faltan datos requeridos. Se necesita (fecha + id_servicio + id_receta) o (id_jornada + id_receta)",
        });
      }
    } catch (error) {
      console.error("Error al asignar receta:", error);

      // 🔧 NUEVO: Manejo específico de errores
      // Si es un error de duplicate key (restricción única violada)
      if (
        error.code === "ER_DUP_ENTRY" ||
        error.message?.includes("Duplicate entry")
      ) {
        return res.status(409).json({
          success: false,
          message:
            "No se permite agregar esta receta en el servicio seleccionado para esta fecha. Ya existe una planificación de menú para esta combinación.",
        });
      }

      res.status(500).json({ message: error.message });
    }
  };

  // Obtener recetas por jornada
  getRecetasPorJornada = async (req, res) => {
    try {
      const { id_jornada } = req.params;
      const recetas = await this.planificacionMenuModel.getRecetasPorJornada({
        id_jornada,
      });
      res.json(recetas);
    } catch (error) {
      console.error("Error al obtener recetas por jornada:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener planificaciones por usuario
  getByUsuario = async (req, res) => {
    try {
      const { id_usuario } = req.params;
      const planificaciones = await this.planificacionMenuModel.getByUsuario({
        id_usuario,
      });
      res.json(planificaciones);
    } catch (error) {
      console.error("Error al obtener planificaciones por usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener planificaciones por estado
  getByEstado = async (req, res) => {
    try {
      const { estado } = req.params;
      const planificaciones = await this.planificacionMenuModel.getByEstado({
        estado,
      });
      res.json(planificaciones);
    } catch (error) {
      console.error("Error al obtener planificaciones por estado:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Finalizar planificación
  finalizar = async (req, res) => {
    try {
      const { id } = req.params;
      const planificacion = await this.planificacionMenuModel.finalizar({ id });
      res.json(planificacion);
    } catch (error) {
      console.error("Error al finalizar planificación:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener menús de la semana
  getMenusSemana = async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res
          .status(400)
          .json({ message: "Se requieren fechaInicio y fechaFin" });
      }
      const menus = await this.planificacionMenuModel.getMenusSemana({
        fechaInicio,
        fechaFin,
      });
      res.json(menus);
    } catch (error) {
      console.error("Error al obtener menús de la semana:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Eliminar receta asignada
  eliminarReceta = async (req, res) => {
    try {
      const { fecha, id_servicio } = req.body;
      if (!fecha || !id_servicio) {
        return res.status(400).json({
          message: "Se requieren fecha e id_servicio",
        });
      }

      const resultado =
        await this.planificacionMenuModel.eliminarRecetaPorFechaServicio({
          input: req.body,
        });
      res.json(resultado);
    } catch (error) {
      console.error("Error al eliminar receta:", error);
      res.status(500).json({ message: error.message });
    }
  };

  // Calcular comensales por turno y servicio
  calcularComensalesPorTurnoYServicio = async (req, res) => {
    try {
      const { id_turno, id_servicio } = req.query;

      if (!id_turno || !id_servicio) {
        return res.status(400).json({
          message: "id_turno e id_servicio son requeridos",
        });
      }

      const comensales =
        await this.planificacionMenuModel.calcularComensalesPorTurnoYServicio({
          id_turno: parseInt(id_turno),
          id_servicio: parseInt(id_servicio),
        });

      res.json(comensales);
    } catch (error) {
      console.error(
        "Error al calcular comensales por turno y servicio:",
        error
      );
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Calcular comensales por servicio y fecha
  calcularComensalesPorServicioYFecha = async (req, res) => {
    try {
      const { fecha } = req.query;

      if (!fecha) {
        return res.status(400).json({
          message: "La fecha es requerida (formato: YYYY-MM-DD)",
        });
      }

      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({
          message: "Formato de fecha inválido. Use YYYY-MM-DD",
        });
      }

      const comensales =
        await this.planificacionMenuModel.calcularComensalesPorServicioYFecha({
          fecha,
        });

      res.json(comensales);
    } catch (error) {
      console.error(
        "Error al calcular comensales por servicio y fecha:",
        error
      );
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Obtener resumen de comensales para un rango de fechas
  obtenerResumenComensales = async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          message:
            "fechaInicio y fechaFin son requeridas (formato: YYYY-MM-DD)",
        });
      }

      // Validar formato de fechas
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)
      ) {
        return res.status(400).json({
          message: "Formato de fecha inválido. Use YYYY-MM-DD",
        });
      }

      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);
      const resumen = [];

      // Iterar por cada fecha en el rango
      for (
        let fecha = new Date(fechaInicioObj);
        fecha <= fechaFinObj;
        fecha.setDate(fecha.getDate() + 1)
      ) {
        const fechaStr = fecha.toISOString().split("T")[0];

        try {
          const comensalesDia =
            await this.planificacionMenuModel.calcularComensalesPorServicioYFecha(
              {
                fecha: fechaStr,
              }
            );
          resumen.push(comensalesDia);
        } catch (error) {
          console.warn(
            `Error calculando comensales para ${fechaStr}:`,
            error.message
          );
          resumen.push({
            fecha: fechaStr,
            servicios: [],
            resumen: { totalDia: 0 },
            error: error.message,
          });
        }
      }

      res.json({
        fechaInicio,
        fechaFin,
        resumen,
        totalGeneral: resumen.reduce(
          (sum, dia) => sum + (dia.resumen?.totalDia || 0),
          0
        ),
      });
    } catch (error) {
      console.error("Error al obtener resumen de comensales:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };
}
