// Importa las funciones de validación para los datos del ParametroSistema
import {
  validateParametroSistema,
  validatePartialParametroSistema,
} from "../schemas/parametrossistemas.js";
import { validatePedido, validatePartialPedido } from "../schemas/pedidos.js";
import {
  generarPDFConfirmacionProveedor,
  enviarPDFConfirmacionMail,
} from "../services/pdfService.js";
import { connection } from "../models/db.js";
import { construirMensajePedidoTelegram, construirBotonesPedidoTelegram } from "../utils/mensajesTelegram.js";
import { formatearFechaLocal } from "../utils/formatoFechas.js";

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
      
      // Obtener la información del pedido antes de actualizar
      const pedidoAnterior = await this.pedidoModel.getById({ id });
      
      const updatedPedido = await this.pedidoModel.update({
        id,
        input: result.data,
      });

      if (!updatedPedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      // Si se actualizaron los insumos (hay detalles), enviar notificación al proveedor
      if (result.data.insumos && Array.isArray(result.data.insumos) && result.data.insumos.length > 0) {
        try {
          const id_proveedor = result.data.insumos[0]?.id_proveedor || pedidoAnterior?.id_proveedor;
          
          if (id_proveedor) {
            // Generar nuevo token de confirmación
            const tokenPedido = await this.pedidoModel.generateTokenForProveedor({
              idPedido: id,
              idProveedor: id_proveedor,
            });

            const enlaceConfirmacion = `${process.env.FRONTEND_URL}/proveedor/confirmacion/${tokenPedido}`;

            // Enviar notificación por Telegram
            await this.pedidoModel.enviarNotificacionTelegramProveedor({
              idPedido: id,
              idProveedor: id_proveedor,
              enlaceConfirmacion,
              esActualizacion: true,
            });
          }
        } catch (telegramError) {
          console.warn("⚠️ Error al enviar notificación por Telegram al actualizar pedido:", telegramError.message);
          // No bloquear la respuesta por error en Telegram
        }
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

      // Enviar enlace de confirmación por Telegram al proveedor (el email se envía después de que el proveedor confirma)
      for (const pedido of pedidosCreados) {
        try {
          const idPedido = pedido.id_pedido;
          const idProveedor = pedido.id_proveedor;

          // Generar token de confirmación
          const token = await this.pedidoModel.generateTokenForProveedor({ idPedido, idProveedor });
          const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
          const enlace = `${baseUrl}/proveedor/confirmacion/${token}`;

          // Obtener insumos del pedido para contar
          const [insumosPedido] = await connection.query(
            `SELECT COUNT(*) as cantidad FROM DetallePedido WHERE id_pedido = UUID_TO_BIN(?)`,
            [idPedido]
          );
          const cantidadInsumos = insumosPedido[0]?.cantidad || 0;

          // Formatear fecha sin conversión UTC
          const fecha = formatearFechaLocal(pedido.fechaEmision);

          // Obtener Telegram chat ID del proveedor
          const [configTelegram] = await connection.query(
            `SELECT telegramChatId FROM ProveedorConfiguracionTelegram WHERE id_proveedor = UUID_TO_BIN(?) AND notificacionesTelegram = 'Activo' LIMIT 1`,
            [idProveedor]
          );
          const chatIdProveedor = configTelegram?.[0]?.telegramChatId;

          if (chatIdProveedor) {
            const { default: telegramSvc } = await import("../services/telegramService.js");
            const mensaje = construirMensajePedidoTelegram({
              idPedido,
              fecha,
              cantidadInsumos,
              enlace
            });
            const botones = construirBotonesPedidoTelegram(enlace);
            await telegramSvc.sendMessageWithButtons(chatIdProveedor, mensaje, botones, "proveedor");
            console.log(`✅ Enlace de confirmación enviado por Telegram al proveedor del pedido ${idPedido}`);
          } else {
            console.warn(`⚠️ El proveedor del pedido ${idPedido} no tiene Telegram configurado. No se pudo enviar notificación.`);
          }
        } catch (commErr) {
          console.warn(`⚠️ Error en comunicaciones del pedido ${pedido.id_pedido}:`, commErr.message);
        }
      }

      res.status(201).json({
        message: `Se crearon ${pedidosCreados.length} pedido(s) aprobados automáticamente`,
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
        `🚀 Iniciando generación automática de pedidos: ${fechaInicio} - ${fechaFin}`,
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

      console.log(`🔍 Verificando estado del pedido ${id}:`, {
        id_estadoPedido: pedido.id_estadoPedido,
        estadoPedido: pedido.estadoPedido,
        tipo: typeof pedido.id_estadoPedido,
      });

      // 2. Verificar que esté en estado "Aprobado" (ID: 2) — ya no existe Pendiente
      if (pedido.id_estadoPedido !== 2 && pedido.estadoPedido !== "Aprobado") {
        console.error(
          `❌ Pedido no en estado Aprobado. Estado actual: ${pedido.estadoPedido} (ID: ${pedido.id_estadoPedido})`,
        );
        return res.status(400).json({
          success: false,
          message: `Solo se pueden procesar pedidos en estado Aprobado. Estado actual: ${pedido.estadoPedido}`,
          estadoActual: pedido.estadoPedido,
          id_estadoPedido: pedido.id_estadoPedido,
        });
      }

      // 3. Calcular fecha de aprobación
      const fechaAprobacion = new Date();

      console.log(
        `📅 Fecha de aprobación: ${fechaAprobacion.toISOString().split("T")[0]}`,
      );

      // 4. Cambiar estado a "Aprobado" (ID: 2)
      console.log("🔄 Actualizando estado del pedido a Aprobado...");
      console.log("Parámetros:", {
        id,
        id_estadoPedido: 2,
        fechaAprobacion: fechaAprobacion.toISOString().split("T")[0],
      });

      const pedidoAprobado = await this.pedidoModel.update({
        id,
        input: {
          id_estadoPedido: 2, // Aprobado
          fechaAprobacion: fechaAprobacion.toISOString().split("T")[0],
        },
      });

      console.log("✅ Pedido aprobado exitosamente en la BD", pedidoAprobado);

      // 5. Intentar obtener detalles y enviar comunicaciones (opcionales)
      let pdfGenerado = false;
      let emailEnviado = false;

      try {
        // Obtener detalles del pedido para el PDF
        const { LineaPedidoModel } = await import("../models/lineapedido.js");
        const detalles = await LineaPedidoModel.getByPedido({ id_pedido: id });

        // 6. Generar PDF del pedido
        console.log("🔄 Generando PDF del pedido...");
        const { generarPDFPedido } = await import("../services/pdfService.js");
        const pdfBuffer = await generarPDFPedido(pedido, detalles);
        console.log(
          "✅ PDF generado exitosamente. Tamaño:",
          pdfBuffer.length,
          "bytes",
        );
        pdfGenerado = true;

        // 7. Intentar enviar email al proveedor
        try {
          console.log("📧 Enviando email al proveedor...");
          const { emailService } = await import("../services/emailService.js");
          await emailService.enviarPedidoProveedor(pedido, pdfBuffer);
          console.log("✅ Email enviado exitosamente");
          emailEnviado = true;
        } catch (emailError) {
          console.warn("⚠️ Error al enviar email:", emailError.message);
          // El pedido ya está aprobado, continuamos sin el email
        }
      } catch (pdfError) {
        console.warn(
          "⚠️ Error al generar PDF o comunicaciones:",
          pdfError.message,
        );
        // El pedido ya está aprobado, continuamos sin el PDF/email
      }

      res.json({
        success: true,
        message: "Pedido aprobado exitosamente",
        pedido: pedidoAprobado,
        comunicaciones: {
          pdfGenerado,
          emailEnviado,
        },
      });
    } catch (error) {
      console.error("❌ Error al aprobar pedido:", error);
      console.error("❌ Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        message: "Error al aprobar pedido: " + error.message,
        detalles: error.toString(),
      });
    }
  };

  // Generar token para confirmación de proveedor
  generateTokenForProveedor = async (req, res) => {
    try {
      const { idPedido, idProveedor } = req.body;

      if (!idPedido || !idProveedor) {
        return res.status(400).json({
          message: "Faltan datos requeridos: idPedido, idProveedor",
        });
      }

      const token = await this.pedidoModel.generateTokenForProveedor({
        idPedido,
        idProveedor,
      });

      // Usar URL base de variable de entorno
      const baseUrl =
        process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
      const link = `${baseUrl}/proveedor/confirmacion/${token}`;

      res.json({
        message: "Token generado correctamente",
        token,
        link,
      });
    } catch (error) {
      console.error("❌ Error al generar token para proveedor:", error);
      res.status(500).json({
        message: "Error interno del servidor: " + error.message,
      });
    }
  };

  // Obtener datos del pedido por token (para proveedor)
  getByTokenProveedor = async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          message: "Token es requerido",
        });
      }

      const datos = await this.pedidoModel.getByTokenProveedor({ token });

      res.json(datos);
    } catch (error) {
      console.error("❌ Error al obtener datos por token:", error);

      if (error.message.includes("Token")) {
        return res.status(401).json({
          message: error.message,
        });
      }

      // VALIDACIÓN DE SEGURIDAD: Acceso denegado (proveedor no autorizado)
      if (
        error.message.includes("No tiene pedidos asignados") ||
        error.message.includes("Proveedor no encontrado")
      ) {
        return res.status(403).json({
          message:
            "No tiene pedidos asignados. Contacte al administrador si cree que es un error.",
        });
      }

      res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  };

  // Confirmar disponibilidad de insumos por proveedor
  confirmarInsumosProveedor = async (req, res) => {
    try {
      const { token } = req.params;
      const { confirmaciones } = req.body;

      if (!token || !confirmaciones || !Array.isArray(confirmaciones)) {
        return res.status(400).json({
          message: "Token y confirmaciones son requeridos",
        });
      }

      const resultado = await this.pedidoModel.confirmarInsumosProveedor({
        token,
        confirmaciones,
      });

      // Generar y enviar PDF con confirmación
      try {
        await this.enviarConfirmacionPDFProveedor(resultado, token);
      } catch (error) {
        console.warn(
          "⚠️ Advertencia: No se pudo enviar el PDF:",
          error.message,
        );
        // No rechazar la respuesta, solo avisar
      }

      // Si se creó un nuevo pedido por redistribución, enviar notificación por Telegram
      if (resultado.nuevoPedidoCreado && resultado.nuevoPedidoData) {
        try {
          const { id_pedido, id_proveedor, proveedorRazonSocial } = resultado.nuevoPedidoData;
          
          // Generar token de confirmación para el nuevo pedido
          const tokenNuevoPedido = await this.pedidoModel.generateTokenForProveedor({
            idPedido: id_pedido,
            idProveedor: id_proveedor,
          });

          const enlaceConfirmacion = `${process.env.FRONTEND_URL}/proveedor/confirmacion/${tokenNuevoPedido}`;

          // Enviar notificación por Telegram
          await this.pedidoModel.enviarNotificacionTelegramProveedor({
            idPedido: id_pedido,
            idProveedor: id_proveedor,
            enlaceConfirmacion,
          });

          console.log(
            `✅ Notificación por Telegram enviada para el nuevo pedido ${id_pedido} a ${proveedorRazonSocial}`,
          );
        } catch (telegramError) {
          console.warn(
            "⚠️ Error al enviar notificación por Telegram para nuevo pedido:",
            telegramError.message,
          );
          // No rechazar la respuesta si falla Telegram
        }
      }

      res.json({
        message: "Confirmación procesada correctamente",
        ...resultado,
      });
    } catch (error) {
      console.error("❌ Error al confirmar insumos:", error);

      if (error.message.includes("Token")) {
        return res.status(401).json({
          message: error.message,
        });
      }

      if (error.message.includes("ya fue procesado")) {
        return res.status(409).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Error interno del servidor: " + error.message,
      });
    }
  };

  // Enviar email de confirmación al proveedor
  enviarEmailConfirmacion = async (req, res) => {
    try {
      const { idPedido, idProveedor, enlaceConfirmacion, datosAdicionales } =
        req.body;

      if (!idPedido || !idProveedor || !enlaceConfirmacion) {
        return res.status(400).json({
          message:
            "Faltan datos requeridos: idPedido, idProveedor, enlaceConfirmacion",
        });
      }

      const resultado = await this.pedidoModel.enviarEmailConfirmacion({
        idPedido,
        idProveedor,
        enlaceConfirmacion,
        datosAdicionales: datosAdicionales || {},
      });

      res.json({
        message: "Email enviado correctamente",
        ...resultado,
      });
    } catch (error) {
      console.error("❌ Error al enviar email de confirmación:", error);
      res.status(500).json({
        message: "Error al enviar email: " + error.message,
      });
    }
  };

  // Enviar PDF de confirmación al proveedor
  enviarConfirmacionPDFProveedor = async (resultado, token) => {
    try {
      // Obtener datos del token y pedido
      const tokenData = await this.pedidoModel.validateTokenProveedor(token);
      const { idPedido, idProveedor } = tokenData;

      // Obtener datos completos del pedido
      const [pedidos] = await connection.query(
        `SELECT 
          p.id_pedido,
          BIN_TO_UUID(p.id_proveedor) as id_proveedor,
          p.fechaEmision,
          pr.razonSocial,
          pr.mail,
          pr.telefono
         FROM Pedidos p
         JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
         WHERE BIN_TO_UUID(p.id_pedido) = ?`,
        [idPedido],
      );

      if (pedidos.length === 0) {
        throw new Error("Pedido no encontrado");
      }

      const pedido = pedidos[0];

      // Obtener detalles del pedido original
      const [detalles] = await connection.query(
        `SELECT 
          dp.id_detallePedido,
          i.nombreInsumo,
          i.unidadMedida,
          dp.cantidadSolicitada,
          dp.estadoConfirmacion
         FROM DetallePedido dp
         JOIN Insumos i ON dp.id_insumo = i.id_insumo
         WHERE BIN_TO_UUID(dp.id_pedido) = ? AND BIN_TO_UUID(dp.id_proveedor) = ?`,
        [idPedido, idProveedor],
      );

      // Separar insumos confirmados y rechazados
      const insumosConfirmados = detalles.filter(
        (d) => d.estadoConfirmacion === "Disponible",
      );
      const insumosRechazados = detalles.filter(
        (d) => d.estadoConfirmacion === "No Disponible",
      );

      // CASO 1: Hay insumos confirmados - enviar PDF al proveedor original
      if (insumosConfirmados.length > 0) {
        // Generar PDF solo con insumos confirmados
        const pdfBuffer = await generarPDFConfirmacionProveedor({
          numeroPedido: `PEDIDO-${idPedido.substring(0, 8).toUpperCase()}`,
          proveedor: {
            razonSocial: pedido.razonSocial,
            mail: pedido.mail,
            telefono: pedido.telefono,
          },
          fechaPedido: pedido.fechaEmision,
          insumosConfirmados,
        });

        // Intentar enviar correo con PDF, pero no fallar si el email no se puede enviar
        try {
          await enviarPDFConfirmacionMail(
            pedido.mail,
            pedido.razonSocial,
            pdfBuffer,
            idPedido.substring(0, 8).toUpperCase(),
            insumosRechazados.length > 0,  // Indicar que hay rechazados
          );

          console.log(
            `✅ PDF de confirmación enviado a ${pedido.mail} con ${insumosConfirmados.length} insumos confirmados`,
          );
        } catch (emailError) {
          console.warn(
            `⚠️ No se pudo enviar el PDF por email a ${pedido.mail}, pero el pedido fue confirmado correctamente.`,
            emailError.message,
          );
          // No re-lanzar el error - permitir que la confirmación del pedido continúe
          // El PDF se puede enviar manualmente posteriormente si es necesario
        }
      }

      // CASO 2: Hay insumos rechazados y fueron redistribuidos
      if (
        insumosRechazados.length > 0 &&
        resultado.nuevoPedidoCreado &&
        resultado.nuevoPedidoId
      ) {
        console.log(
          `✅ Insumos rechazados redistribuidos. Nuevo pedido creado: ${resultado.nuevoPedidoId}`,
        );

        // El nuevo pedido será procesado por el sistema automáticamente
        // Los proveedores alternativos recibirán notificaciones por el sistema normal
      }

      // CASO 3: Hay insumos rechazados pero NO se pudieron redistribuir
      if (insumosRechazados.length > 0 && !resultado.nuevoPedidoCreado) {
        console.warn(
          `⚠️ ${insumosRechazados.length} insumo(s) no pudieron ser redistribuidos a otros proveedores:`,
          insumosRechazados.map((i) => i.nombreInsumo),
        );
        // TODO: Notificar al administrador que estos insumos no tienen proveedores alternativos
      }
    } catch (error) {
      console.error("❌ Error al enviar PDF de confirmación:", error.message);
      throw error;
    }
  };

  // Enviar notificación por Telegram al proveedor para confirmar pedido
  enviarNotificacionTelegramProveedor = async (req, res) => {
    try {
      const { idPedido, idProveedor, enlaceConfirmacion } = req.body;

      if (!idPedido || !idProveedor || !enlaceConfirmacion) {
        return res.status(400).json({
          message:
            "Faltan datos requeridos: idPedido, idProveedor, enlaceConfirmacion",
        });
      }

      const resultado =
        await this.pedidoModel.enviarNotificacionTelegramProveedor({
          idPedido,
          idProveedor,
          enlaceConfirmacion,
        });

      res.json({
        message: "Notificación enviada correctamente",
        ...resultado,
      });
    } catch (error) {
      console.error("❌ Error al enviar notificación por Telegram:", error);
      res.status(500).json({
        message: "Error al enviar notificación: " + error.message,
      });
    }
  };

  // Obtener pedidos confirmados agrupados por proveedor
  getPedidosConfirmados = async (req, res) => {
    try {
      const [result] = await connection.query(
        `SELECT 
          p.id_pedido,
          BIN_TO_UUID(p.id_pedido) as id_pedido_uuid,
          p.fechaEmision,
          pr.id_proveedor,
          BIN_TO_UUID(pr.id_proveedor) as id_proveedor_uuid,
          pr.razonSocial,
          pr.mail,
          pr.telefono,
          ep.nombreEstado as estadoPedido,
          COUNT(CASE WHEN dp.estadoConfirmacion = 'Disponible' THEN 1 END) as insumosConfirmados,
          COUNT(CASE WHEN dp.estadoConfirmacion = 'No Disponible' THEN 1 END) as insumosRechazados,
          COUNT(CASE WHEN dp.estadoConfirmacion = 'Pendiente' THEN 1 END) as insumosPendientes
         FROM Pedidos p
         JOIN Proveedores pr ON p.id_proveedor = pr.id_proveedor
         JOIN EstadoPedido ep ON p.id_estadoPedido = ep.id_estadoPedido
         JOIN DetallePedido dp ON p.id_pedido = dp.id_pedido
         WHERE dp.estadoConfirmacion IN ('Disponible', 'No Disponible')
         AND p.id_estadoPedido != (SELECT id_estadoPedido FROM EstadoPedido WHERE nombreEstado = 'Cancelado' LIMIT 1)
         GROUP BY p.id_pedido, pr.id_proveedor
         ORDER BY p.fechaEmision DESC`,
      );

      res.json(result);
    } catch (error) {
      console.error("❌ Error al obtener pedidos confirmados:", error);
      res.status(500).json({
        message: "Error al obtener pedidos confirmados: " + error.message,
      });
    }
  };

  // Obtener detalles de confirmación de un pedido específico
  getDetallesPedidoConfirmacion = async (req, res) => {
    try {
      const { idPedido } = req.params;

      // Debug: Validar que el UUID es válido
      console.log("📋 Parámetro idPedido recibido:", idPedido);
      console.log("📋 Longitud del parámetro:", idPedido.length);

      // Validar que sea un UUID válido (36 caracteres con guiones)
      if (!idPedido || idPedido.length < 36) {
        return res.status(400).json({
          message: "ID de pedido inválido. Debe ser un UUID válido.",
          received: idPedido,
        });
      }

      const [detalles] = await connection.query(
        `SELECT 
          HEX(dp.id_detallePedido) as id_detallePedido_hex,
          i.nombreInsumo,
          i.unidadMedida,
          dp.cantidadSolicitada,
          dp.estadoConfirmacion,
          dp.fechaConfirmacion,
          BIN_TO_UUID(dp.id_proveedor) as id_proveedor_uuid,
          pr.razonSocial
         FROM DetallePedido dp
         JOIN Insumos i ON dp.id_insumo = i.id_insumo
         JOIN Proveedores pr ON dp.id_proveedor = pr.id_proveedor
         WHERE dp.id_pedido = UUID_TO_BIN(?)
         AND dp.estadoConfirmacion IN ('Disponible', 'No Disponible')
         ORDER BY i.nombreInsumo`,
        [idPedido],
      );

      res.json(detalles);
    } catch (error) {
      console.error("❌ Error al obtener detalles de confirmación:", error);
      res.status(500).json({
        message: "Error al obtener detalles: " + error.message,
      });
    }
  };
}
