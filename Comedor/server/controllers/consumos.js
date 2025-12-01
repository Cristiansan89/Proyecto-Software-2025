import {
  validateConsumo,
  validatePartialConsumo,
} from "../schemas/consumos.js";

export class ConsumoController {
  constructor({ consumoModel }) {
    this.consumoModel = consumoModel;
  }

  getAll = async (req, res) => {
    try {
      const { fechaInicio, fechaFin, idServicio, idGrado } = req.query;

      console.log("🔍 Consultando consumos con filtros:", {
        fechaInicio,
        fechaFin,
        idServicio,
        idGrado,
      });

      // Intentar obtener todos los consumos del modelo
      const consumos = await this.consumoModel.getAll();
      console.log("📊 Consumos obtenidos del modelo:", consumos?.length || 0);

      // Aplicar filtros en el controlador si se recibieron
      let consumosFiltrados = consumos || [];

      if (fechaInicio || fechaFin || idServicio || idGrado) {
        consumosFiltrados = (consumos || []).filter((consumo) => {
          let cumpleFiltros = true;

          if (fechaInicio && (consumo.fecha_registro || consumo.fecha)) {
            const fechaConsumo = new Date(
              consumo.fecha_registro || consumo.fecha
            )
              .toISOString()
              .split("T")[0];
            cumpleFiltros = cumpleFiltros && fechaConsumo >= fechaInicio;
          }

          if (fechaFin && (consumo.fecha_registro || consumo.fecha)) {
            const fechaConsumo = new Date(
              consumo.fecha_registro || consumo.fecha
            )
              .toISOString()
              .split("T")[0];
            cumpleFiltros = cumpleFiltros && fechaConsumo <= fechaFin;
          }

          if (idServicio) {
            cumpleFiltros =
              cumpleFiltros &&
              String(consumo.id_servicio) === String(idServicio);
          }

          if (idGrado) {
            cumpleFiltros =
              cumpleFiltros && String(consumo.id_grado) === String(idGrado);
          }

          return cumpleFiltros;
        });
      }

      console.log(
        `✅ Encontrados ${consumosFiltrados.length} consumos después de filtros`
      );

      res.json({
        success: true,
        data: consumosFiltrados,
        message: "Consumos obtenidos exitosamente",
      });
    } catch (error) {
      console.error("❌ Error completo al obtener consumos:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        data: [],
        message: "Error interno del servidor",
      });
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const consumo = await this.consumoModel.getById({ id });

      if (!consumo) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Consumo no encontrado",
        });
      }

      res.json({
        success: true,
        data: consumo,
        message: "Consumo obtenido exitosamente",
      });
    } catch (error) {
      console.error("❌ Error al obtener consumo por ID:", error);
      res.status(500).json({
        success: false,
        data: null,
        message: "Error interno del servidor",
      });
    }
  };

  create = async (req, res) => {
    try {
      const result = validateConsumo(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const newConsumo = await this.consumoModel.create({ input: result.data });

      res.status(201).json({
        success: true,
        data: newConsumo,
        message: "Consumo creado exitosamente",
      });
    } catch (error) {
      console.error("❌ Error al crear consumo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.consumoModel.delete({ id });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Consumo no encontrado",
        });
      }

      return res.json({
        success: true,
        message: "Consumo eliminado exitosamente",
      });
    } catch (error) {
      console.error("❌ Error al eliminar consumo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  update = async (req, res) => {
    try {
      const result = validatePartialConsumo(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const { id } = req.params;
      const updatedConsumo = await this.consumoModel.update({
        id,
        input: result.data,
      });

      if (!updatedConsumo) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Consumo no encontrado",
        });
      }

      return res.json({
        success: true,
        data: updatedConsumo,
        message: "Consumo actualizado exitosamente",
      });
    } catch (error) {
      console.error("❌ Error al actualizar consumo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  // Obtener consumos por fecha
  getByFecha = async (req, res) => {
    try {
      const { fecha } = req.params;
      const consumos = await this.consumoModel.getByFecha({ fecha });
      res.json(consumos);
    } catch (error) {
      console.error("Error al obtener consumos por fecha:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener consumos por persona
  getByPersona = async (req, res) => {
    try {
      const { id_persona } = req.params;
      const consumos = await this.consumoModel.getByPersona({ id_persona });
      res.json(consumos);
    } catch (error) {
      console.error("Error al obtener consumos por persona:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener estadísticas de consumo
  getEstadisticas = async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      if (typeof this.consumoModel.getEstadisticas === "function") {
        const estadisticas = await this.consumoModel.getEstadisticas({
          fecha_inicio,
          fecha_fin,
        });

        res.json({
          success: true,
          data: estadisticas,
          message: "Estadísticas obtenidas exitosamente",
        });
      } else {
        // Calcular estadísticas básicas desde todos los consumos
        const todosConsumos = await this.consumoModel.getAll();

        const consumosFiltrados = todosConsumos.filter((consumo) => {
          if (!consumo.fecha_registro) return false;

          const fechaConsumo = new Date(consumo.fecha_registro)
            .toISOString()
            .split("T")[0];

          if (fecha_inicio && fechaConsumo < fecha_inicio) return false;
          if (fecha_fin && fechaConsumo > fecha_fin) return false;

          return true;
        });

        const estadisticas = {
          totalRegistros: consumosFiltrados.length,
          totalConsumos: consumosFiltrados.length,
          promedioConsumos: consumosFiltrados.length > 0 ? 1 : 0,
          servicioMasConsumido:
            this.calcularServicioMasConsumido(consumosFiltrados),
        };

        res.json({
          success: true,
          data: estadisticas,
          message: "Estadísticas calculadas exitosamente",
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener estadísticas de consumo:", error);
      res.status(500).json({
        success: false,
        data: {},
        message: "Error interno del servidor",
      });
    }
  };

  // Método auxiliar para calcular el servicio más consumido
  calcularServicioMasConsumido = (consumos) => {
    const conteoServicios = {};

    consumos.forEach((consumo) => {
      const servicio =
        consumo.nombreServicio || consumo.nombre_servicio || "Sin especificar";
      conteoServicios[servicio] = (conteoServicios[servicio] || 0) + 1;
    });

    let servicioMasConsumido = "";
    let maxConsumos = 0;

    Object.entries(conteoServicios).forEach(([servicio, count]) => {
      if (count > maxConsumos) {
        maxConsumos = count;
        servicioMasConsumido = servicio;
      }
    });

    return servicioMasConsumido;
  };

  // Método para obtener consumo con detalles (insumos)
  getConsumoWithDetalles = async (req, res) => {
    try {
      const { id } = req.params;

      if (typeof this.consumoModel.getConsumoWithDetalles === "function") {
        const consumoConDetalles =
          await this.consumoModel.getConsumoWithDetalles({ id });

        if (!consumoConDetalles) {
          return res.status(404).json({
            success: false,
            data: null,
            message: "Consumo no encontrado",
          });
        }

        res.json({
          success: true,
          data: consumoConDetalles,
          message: "Consumo con detalles obtenido exitosamente",
        });
      } else {
        // Fallback al método básico
        return this.getById(req, res);
      }
    } catch (error) {
      console.error("❌ Error al obtener consumo con detalles:", error);
      res.status(500).json({
        success: false,
        data: null,
        message: "Error interno del servidor",
      });
    }
  };

  // Obtener consumos por servicio y fecha
  getByServicioFecha = async (req, res) => {
    try {
      const { id_servicio, fecha } = req.params;
      const consumos = await this.consumoModel.getByServicioFecha({
        id_servicio,
        fecha,
      });
      res.json(consumos);
    } catch (error) {
      console.error("Error al obtener consumos por servicio y fecha:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}
