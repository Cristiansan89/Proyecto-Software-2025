// Importa las funciones de validación para los datos del ParametroSistema
import {
  validateParametroSistema,
  validatePartialParametroSistema,
} from "../schemas/parametrossistemas.js";
import { validatePedido, validatePartialPedido } from "../schemas/pedidos.js";

// Controlador para manejar las operaciones relacionadas con los ParametrosSistemas
export class ParametroSistemaController {
  // Recibe el modelo de ParametroSistema por inyección de dependencias
  constructor({ parametroSistemaModel }) {
    this.parametroSistemaModel = parametroSistemaModel;
  }

  // Obtiene todos los ParametrosSistemas
  getAll = async (req, res) => {
    try {
      const parametrosSistemas = await this.parametroSistemaModel.getAll();
      res.json(parametrosSistemas);
    } catch (error) {
      console.error("Error al obtener parámetros del sistema:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un ParametroSistema por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const parametroSistema = await this.parametroSistemaModel.getById({ id });
      if (parametroSistema) return res.json(parametroSistema);
      // Si no existe, responde con 404
      res.status(404).json({ message: "Parámetro del sistema no encontrado" });
    } catch (error) {
      console.error("Error al obtener parámetro del sistema por ID:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crea un nuevo ParametroSistema después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validateParametroSistema(req.body);

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

      // Crea el nuevo ParametroSistema y responde con el objeto creado
      const newParametroSistema = await this.parametroSistemaModel.create({
        input: result.data,
      });
      res.status(201).json(newParametroSistema);
    } catch (error) {
      console.error("Error al crear parámetro del sistema:", error);
      if (error.message.includes("ya existe")) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un ParametroSistema por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.parametroSistemaModel.delete({ id });

      // Si no se encuentra el ParametroSistema, responde con 404
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Parámetro del sistema no encontrado" });
      }
      // Si se elimina correctamente, responde con mensaje de éxito
      return res.json({
        message: "Parámetro del sistema eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar parámetro del sistema:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un ParametroSistema parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialParametroSistema(req.body);

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
      // Actualiza el ParametroSistema y responde con el objeto actualizado
      const updatedParametroSistema = await this.parametroSistemaModel.update({
        id,
        input: result.data,
      });

      if (!updatedParametroSistema) {
        return res
          .status(404)
          .json({ message: "Parámetro del sistema no encontrado" });
      }

      return res.json(updatedParametroSistema);
    } catch (error) {
      console.error("Error al actualizar parámetro del sistema:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener parámetro por clave
  getByClave = async (req, res) => {
    try {
      const { clave } = req.params;
      const parametro = await this.parametroSistemaModel.getByClave({ clave });
      if (parametro) return res.json(parametro);
      res.status(404).json({ message: "Parámetro no encontrado" });
    } catch (error) {
      console.error("Error al obtener parámetro por clave:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualizar valor de parámetro por clave
  updateByClave = async (req, res) => {
    try {
      const { clave } = req.params;
      const { valor } = req.body;

      const parametroActualizado =
        await this.parametroSistemaModel.updateByClave({ clave, valor });

      if (!parametroActualizado) {
        return res.status(404).json({ message: "Parámetro no encontrado" });
      }

      res.json(parametroActualizado);
    } catch (error) {
      console.error("Error al actualizar parámetro por clave:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
}

// Controlador para manejar las operaciones relacionadas con los Pedidos
export class PedidoController {
  // Recibe el modelo de Pedido por inyección de dependencias
  constructor({ pedidoModel }) {
    this.pedidoModel = pedidoModel;
  }

  // Obtiene todos los Pedidos
  getAll = async (req, res) => {
    try {
      const pedidos = await this.pedidoModel.getAll();
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtiene un Pedido por su ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await this.pedidoModel.getById({ id });

      if (pedido) return res.json(pedido);
      res.status(404).json({ message: "Pedido no encontrado" });
    } catch (error) {
      console.error("Error al obtener pedido por ID:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crea un nuevo Pedido después de validar los datos recibidos
  create = async (req, res) => {
    try {
      const result = validatePedido(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: result.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      const newPedido = await this.pedidoModel.create({ input: result.data });
      res.status(201).json(newPedido);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Elimina un Pedido por su ID
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.pedidoModel.delete({ id });

      if (!deleted) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      return res.json({ message: "Pedido eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Actualiza un Pedido parcialmente después de validar los datos recibidos
  update = async (req, res) => {
    try {
      const result = validatePartialPedido(req.body);

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
      const updatedPedido = await this.pedidoModel.update({
        id,
        input: result.data,
      });

      if (!updatedPedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      return res.json(updatedPedido);
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener pedidos por estado
  getByEstado = async (req, res) => {
    try {
      const { estado } = req.params;
      const pedidos = await this.pedidoModel.getByEstado({ estado });
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener pedidos por estado:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener pedidos por proveedor
  getByProveedor = async (req, res) => {
    try {
      const { id_proveedor } = req.params;
      const pedidos = await this.pedidoModel.getByProveedor({ id_proveedor });
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener pedidos por proveedor:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Cambiar estado del pedido
  cambiarEstado = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const pedidoActualizado = await this.pedidoModel.cambiarEstado({
        id,
        estado,
      });

      if (!pedidoActualizado) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json(pedidoActualizado);
    } catch (error) {
      console.error("Error al cambiar estado del pedido:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Crear pedido manual con múltiples insumos y proveedores
  crearPedidoManual = async (req, res) => {
    try {
      const {
        insumos, // Array de { id_insumo, id_proveedor, cantidad }
        fechaEntregaEsperada,
        observaciones,
        id_usuario,
      } = req.body;

      if (!insumos || !Array.isArray(insumos) || insumos.length === 0) {
        return res.status(400).json({
          message: "Se requiere al menos un insumo en el pedido",
        });
      }

      if (!id_usuario) {
        return res.status(400).json({
          message: "Se requiere el ID del usuario que crea el pedido",
        });
      }

      const pedidosCreados = await this.pedidoModel.crearPedidoManual({
        insumos,
        fechaEntregaEsperada,
        observaciones,
        id_usuario,
      });

      res.status(201).json({
        message: `Se crearon ${pedidosCreados.length} pedido(s) por proveedor`,
        pedidos: pedidosCreados,
      });
    } catch (error) {
      console.error("Error al crear pedido manual:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Aprobar pedido
  aprobar = async (req, res) => {
    try {
      const { id } = req.params;
      const { id_usuario_aprobador } = req.body;

      const pedidoAprobado = await this.pedidoModel.aprobar({
        id,
        id_usuario_aprobador,
      });

      if (!pedidoAprobado) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json({
        message: "Pedido aprobado exitosamente",
        pedido: pedidoAprobado,
      });
    } catch (error) {
      console.error("Error al aprobar pedido:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Cancelar pedido
  cancelar = async (req, res) => {
    try {
      const { id } = req.params;
      const { motivoCancelacion } = req.body;

      if (!motivoCancelacion) {
        return res.status(400).json({
          message: "Se requiere el motivo de cancelación",
        });
      }

      const pedidoCancelado = await this.pedidoModel.cancelar({
        id,
        motivoCancelacion,
      });

      if (!pedidoCancelado) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json({
        message: "Pedido cancelado exitosamente",
        pedido: pedidoCancelado,
      });
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener pedido completo con detalles
  getPedidoCompleto = async (req, res) => {
    try {
      const { id } = req.params;
      const pedidoCompleto = await this.pedidoModel.getPedidoCompleto({ id });

      if (!pedidoCompleto) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json(pedidoCompleto);
    } catch (error) {
      console.error("Error al obtener pedido completo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Obtener resumen de pedidos por período
  getResumenPorPeriodo = async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          message: "Se requieren fechaInicio y fechaFin",
        });
      }

      const resumen = await this.pedidoModel.getResumenPorPeriodo({
        fechaInicio,
        fechaFin,
      });

      res.json(resumen);
    } catch (error) {
      console.error("Error al obtener resumen por período:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };

  // Generar pedido automático
  generarPedidoAutomatico = async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.body;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          message:
            "Se requieren fechaInicio y fechaFin para el período de planificación",
        });
      }

      console.log(
        `🚀 Iniciando generación automática de pedidos: ${fechaInicio} - ${fechaFin}`
      );

      const resultado = await this.pedidoModel.generarPedidoAutomatico({
        fechaInicio,
        fechaFin,
      });

      const statusCode = resultado.pedidosCreados.length > 0 ? 201 : 200;

      res.status(statusCode).json({
        success: true,
        message: resultado.mensaje,
        totalPedidosCreados: resultado.pedidosCreados.length,
        pedidos: resultado.pedidosCreados,
        analisis: resultado.detalleAnalisis,
      });
    } catch (error) {
      console.error("❌ Error al generar pedido automático:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar pedido automático: " + error.message,
      });
    }
  };

  // Aprobar pedido y enviar por email
  aprobarPedido = async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Obtener el pedido con todos sus detalles
      const pedido = await this.pedidoModel.getById({ id });
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: "Pedido no encontrado",
        });
      }

      // 2. Verificar que esté en estado "Pendiente" (ID: 15)
      if (pedido.id_estadoPedido !== 15) {
        return res.status(400).json({
          success: false,
          message: "Solo se pueden aprobar pedidos en estado Pendiente",
        });
      }

      // 3. Calcular fecha de aprobación
      const fechaAprobacion = new Date();

      console.log(
        `📅 Fecha de aprobación: ${fechaAprobacion.toISOString().split("T")[0]}`
      );

      // 4. Cambiar estado a "Aprobado" (ID: 16) y establecer fecha de aprobación
      await this.pedidoModel.aprobar({
        id,
        estado: 16,
        fechaAprobacion: fechaAprobacion.toISOString().split("T")[0],
      });

      // 4. Obtener detalles del pedido para el PDF
      const { LineaPedidoModel } = await import("../models/lineapedido.js");
      const detalles = await LineaPedidoModel.getByPedido({ id_pedido: id });

      // 5. Generar PDF del pedido
      console.log("🔄 Generando PDF del pedido...");
      const { generarPDFPedido } = await import("../services/pdfService.js");
      const pdfBuffer = await generarPDFPedido(pedido, detalles);
      console.log(
        "✅ PDF generado exitosamente. Tamaño:",
        pdfBuffer.length,
        "bytes"
      );

      // 6. Enviar email al proveedor
      console.log("📧 Enviando email al proveedor...");
      const { emailService } = await import("../services/emailService.js");
      await emailService.enviarPedidoProveedor(pedido, pdfBuffer);
      console.log("✅ Email enviado exitosamente");

      res.json({
        success: true,
        message: "Pedido aprobado y enviado al proveedor exitosamente",
        pedido: {
          ...pedido,
          estado: "Aprobado",
        },
      });
    } catch (error) {
      console.error("❌ Error al aprobar pedido:", error);
      res.status(500).json({
        success: false,
        message: "Error al aprobar pedido: " + error.message,
      });
    }
  };
}
