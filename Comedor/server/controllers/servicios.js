// Importa las funciones de validación para los datos de los Servicios
import {
  validateServicio,
  validatePartialServicio,
} from "../schemas/servicios.js";
import { ConsumoModel } from "../models/consumo.js";
import { MovimientoInventarioModel } from "../models/movimientoinventario.js";
import { PlanificacionMenuModel } from "../models/planificacionmenu.js";
import { ItemRecetaModel } from "../models/itemreceta.js";

// Controlador para manejar las operaciones relacionadas con los Servicios
export class ServicioController {
  // Recibe el modelo de Servicio por inyección de dependencias
  constructor({ servicioModel }) {
    this.servicioModel = servicioModel;
  }

  // Obtiene todos los Servicios
  getAll = async (req, res) => {
    try {
      const servicios = await this.servicioModel.getAll();
      res.json(servicios);
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un Servicio por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const servicio = await this.servicioModel.getById({ id });
      if (servicio) return res.json(servicio);
      res.status(404).json({ message: "Servicio no encontrado" });
    } catch (error) {
      console.error("Error al obtener servicio:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crea un nuevo Servicio después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validateServicio(req.body);

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

      // Crea el nuevo Servicio y responde con el objeto creado
      const newServicio = await this.servicioModel.create({
        input: result.data,
      });
      res.status(201).json(newServicio);
    } catch (error) {
      console.error("Error al crear servicio:", error);
      if (error.message.includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un Servicio por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      console.log("ServicioController: Eliminando servicio con ID:", id);

      // Verificar si el servicio tiene relaciones activas
      const hasActiveRelations = await this.servicioModel.hasActiveRelations({
        id,
      });
      if (hasActiveRelations) {
        return res.status(409).json({
          message:
            "No se puede eliminar el servicio porque está vinculado a registros activos",
        });
      }

      const deleted = await this.servicioModel.delete({ id });
      console.log("ServicioController: Resultado de eliminación:", deleted);

      if (!deleted) {
        console.log("ServicioController: Servicio no found");
        return res.status(404).json({ message: "Servicio no encontrado" });
      }
      console.log("ServicioController: Servicio eliminado exitosamente");
      return res.json({ message: "Servicio eliminado correctamente" });
    } catch (error) {
      console.error("ServicioController: Error al eliminar servicio:", error);
      if (
        error.message.includes("referencia") ||
        error.message.includes("usado")
      ) {
        return res.status(409).json({
          message: "No se puede eliminar el servicio porque está en uso",
        });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un Servicio parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialServicio(req.body);

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
      const updatedServicio = await this.servicioModel.update({
        id,
        input: result.data,
      });

      if (!updatedServicio) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      res.json(updatedServicio);
    } catch (error) {
      console.error("Error al actualizar servicio:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener servicios activos
  getActivos = async (req, res) => {
    try {
      const servicios = await this.servicioModel.getActivos();
      res.json(servicios);
    } catch (error) {
      console.error("Error al obtener servicios activos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Cambiar estado del servicio
  changeStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!["Activo", "Inactivo"].includes(estado)) {
        return res.status(400).json({ message: "Estado inválido" });
      }

      const updatedServicio = await this.servicioModel.update({
        id,
        input: { estado },
      });

      if (!updatedServicio) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }

      res.json({
        message: `Servicio ${estado.toLowerCase()} correctamente`,
        servicio: updatedServicio,
      });
    } catch (error) {
      console.error("Error al cambiar estado del servicio:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Marcar un servicio como completado en una fecha específica
  marcarCompletado = async (req, res) => {
    try {
      const { fecha, id_servicio, completado, id_usuario, comensales } =
        req.body;

      if (!fecha || !id_servicio) {
        return res.status(400).json({
          success: false,
          message: "Se requiere fecha e id_servicio",
        });
      }

      // Marcar servicio como completado con el número de comensales
      const result = await this.servicioModel.marcarCompletado({
        fecha,
        id_servicio,
        completado,
        comensales_total: comensales || 0,
      });

      // Si se marca como completado (no se desmarca), registrar consumos
      if (completado && id_usuario && comensales) {
        try {
          await this.registrarConsumosAutomatico({
            fecha,
            id_servicio,
            id_usuario,
            comensales,
          });
          console.log(
            `✅ Consumos registrados automáticamente para servicio ${id_servicio} en fecha ${fecha}`
          );
        } catch (consumoError) {
          console.error(
            "Error al registrar consumos automático:",
            consumoError
          );
          // No fallar la operación principal, solo loggear el error
        }
      }

      return res.json(result);
    } catch (error) {
      console.error("Error al marcar servicio como completado:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Obtener estado de completado para servicios de una fecha
  obtenerEstadoCompletado = async (req, res) => {
    try {
      const { fecha } = req.query;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: "Se requiere parámetro fecha",
        });
      }

      const result = await this.servicioModel.obtenerEstadoCompletado(fecha);

      return res.json(result);
    } catch (error) {
      console.error("Error al obtener estado de servicios:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Obtener comensales totales por servicio para una fecha específica
  obtenerComensalesPorServicio = async (req, res) => {
    try {
      const { fecha } = req.query;

      if (!fecha) {
        return res.status(400).json({
          success: false,
          message: "Se requiere parámetro fecha",
        });
      }

      const result = await this.servicioModel.obtenerComensalesPorServicio(
        fecha
      );

      return res.json(result);
    } catch (error) {
      console.error("Error al obtener comensales por servicio:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  // Método para registrar consumos automáticamente cuando se completa un servicio
  registrarConsumosAutomatico = async ({
    fecha,
    id_servicio,
    id_usuario,
    comensales,
  }) => {
    try {
      console.log(
        `🔄 Iniciando registro automático de consumos para servicio ${id_servicio}`
      );

      // 1. Obtener el día de la semana
      const fechaObj = new Date(fecha + "T00:00:00");
      const diasSemana = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
      ];
      const diaSemana = diasSemana[fechaObj.getDay()];

      console.log(`📅 Día de la semana: ${diaSemana}`);

      // 2. Buscar planificación activa para esta fecha
      const planificaciones = await PlanificacionMenuModel.getActivas();
      if (!planificaciones || planificaciones.length === 0) {
        throw new Error("No se encontró planificación activa");
      }

      const planificacionActiva = planificaciones[0]; // Tomar la primera activa
      console.log(
        `📋 Planificación activa encontrada: ${planificacionActiva.id_planificacion}`
      );

      // 3. Buscar jornada planificada
      const jornadas = await PlanificacionMenuModel.getJornadasByPlanificacion(
        planificacionActiva.id_planificacion
      );
      const jornadaDelDia = jornadas.find(
        (j) => j.id_servicio == id_servicio && j.diaSemana === diaSemana
      );

      if (!jornadaDelDia) {
        console.log(
          `⚠️ No se encontró jornada para ${diaSemana} - Servicio ${id_servicio}`
        );
        return;
      }

      console.log(
        `🍽️ Jornada encontrada: ${jornadaDelDia.id_jornada}, Receta: ${jornadaDelDia.nombreReceta}`
      );

      // 4. Crear registro de consumo
      const consumoData = {
        id_jornada: jornadaDelDia.id_jornada,
        id_servicio: id_servicio,
        id_turno: 1, // Turno por defecto (mañana)
        id_usuario: id_usuario,
        fecha: fecha,
        origenCalculo: "Calculado",
      };

      const nuevoConsumo = await ConsumoModel.create({ input: consumoData });
      console.log(`✅ Consumo creado: ${nuevoConsumo.id_consumo}`);

      // 5. Obtener ingredientes de la receta
      const ingredientes = await ItemRecetaModel.getByReceta({
        id_receta: jornadaDelDia.id_receta,
      });
      console.log(`🥘 Ingredientes encontrados: ${ingredientes.length}`);

      // 6. Registrar movimientos de inventario para cada ingrediente
      for (const ingrediente of ingredientes) {
        const cantidadTotal = ingrediente.cantidadPorPorcion * comensales;

        const movimientoData = {
          id_insumo: ingrediente.id_insumo,
          id_usuario: id_usuario,
          id_consumo: nuevoConsumo.id_consumo,
          tipoMovimiento: "Salida",
          cantidadMovimiento: cantidadTotal,
          comentarioMovimiento: `Consumo automático - ${jornadaDelDia.nombreReceta} - ${comensales} comensales`,
        };

        await MovimientoInventarioModel.create({ input: movimientoData });
        console.log(
          `📦 Movimiento registrado: ${ingrediente.nombreInsumo} - ${cantidadTotal} ${ingrediente.unidadMedida}`
        );
      }

      console.log(`🎉 Registro automático completado exitosamente`);
    } catch (error) {
      console.error("❌ Error en registrarConsumosAutomatico:", error);
      throw error;
    }
  };
}
