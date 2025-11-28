import axiosInstance from "./axiosConfig";

const pedidoService = {
  // ===== OPERACIONES BÁSICAS =====

  // Obtener todos los pedidos
  getAll: async () => {
    try {
      const response = await axiosInstance.get("/pedidos");
      // Normalizar la respuesta para siempre devolver un array de pedidos
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.pedidos)) return data.pedidos;
      if (data && Array.isArray(data.data)) return data.data;
      // Si no se reconoce el formato, devolver un array vacío y loggear
      console.log(
        "pedidoService.getAll: formato de respuesta inesperado",
        data
      );
      return [];
    } catch (error) {
      throw error;
    }
  },

  // Obtener pedido por ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear un nuevo pedido
  create: async (datos) => {
    try {
      const response = await axiosInstance.post("/pedidos", datos);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar pedido
  update: async (id, datos) => {
    try {
      const response = await axiosInstance.patch(`/pedidos/${id}`, datos);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar pedido
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== OPERACIONES ESPECIALIZADAS =====

  // Obtener pedidos por estado
  getByEstado: async (estado) => {
    try {
      const response = await axiosInstance.get(`/pedidos/estado/${estado}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener pedidos por proveedor
  getByProveedor: async (idProveedor) => {
    try {
      const response = await axiosInstance.get(
        `/pedidos/proveedor/${idProveedor}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cambiar estado de pedido
  cambiarEstado: async (id, estado) => {
    try {
      const response = await axiosInstance.patch(`/pedidos/${id}/estado`, {
        estado,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Aprobar pedido
  aprobar: async (id) => {
    try {
      const response = await axiosInstance.patch(`/pedidos/${id}/estado`, {
        estado: "Aprobado",
        fechaAprobacion: new Date().toISOString().split("T")[0],
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancelar pedido
  cancelar: async (id, motivoCancelacion) => {
    try {
      const response = await axiosInstance.patch(`/pedidos/${id}/estado`, {
        estado: "Cancelado",
        motivoCancelacion,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ===== FUNCIONALIDADES AVANZADAS =====

  // Crear pedido manual con múltiples insumos y proveedores
  crearPedidoManual: async (datosPedido) => {
    try {
      const {
        insumos, // Array de { id_insumo, id_proveedor, cantidad }
        fechaEntregaEsperada,
        observaciones,
        id_usuario,
      } = datosPedido;

      // Agrupar insumos por proveedor
      const pedidosPorProveedor = {};

      insumos.forEach((item) => {
        if (!pedidosPorProveedor[item.id_proveedor]) {
          pedidosPorProveedor[item.id_proveedor] = [];
        }
        pedidosPorProveedor[item.id_proveedor].push(item);
      });

      const pedidosCreados = [];

      // Crear un pedido por cada proveedor
      for (const [idProveedor, insumosProveedor] of Object.entries(
        pedidosPorProveedor
      )) {
        const pedido = {
          id_proveedor: idProveedor,
          id_usuario,
          fechaPedido: new Date().toISOString().split("T")[0],
          fechaEntregaEsperada,
          observaciones,
          estado: "Pendiente",
          origen: "Manual",
        };

        // Crear el pedido principal
        const pedidoCreado = await this.create(pedido);

        // Agregar los detalles del pedido (líneas)
        for (const insumo of insumosProveedor) {
          await axiosInstance.post("/lineaspedidos", {
            id_pedido: pedidoCreado.id_pedido,
            id_proveedor: idProveedor,
            id_insumo: insumo.id_insumo,
            cantidadSolicitada: insumo.cantidad,
          });
        }

        pedidosCreados.push(pedidoCreado);
      }

      return pedidosCreados;
    } catch (error) {
      throw error;
    }
  },

  // Generar pedido automático basado en planificación y stock
  generarPedidoAutomatico: async (fechaInicio, fechaFin) => {
    try {
      const response = await axiosInstance.post("/pedidos/automatico", {
        fechaInicio,
        fechaFin,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener resumen de pedidos por período
  getResumenPorPeriodo: async (fechaInicio, fechaFin) => {
    try {
      const response = await axiosInstance.get(
        `/pedidos/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener pedido completo con detalles
  getPedidoCompleto: async (id) => {
    try {
      const [pedido, detalles] = await Promise.all([
        axiosInstance.get(`/pedidos/${id}`),
        axiosInstance.get(`/lineaspedidos/pedido/${id}`),
      ]);

      return {
        ...pedido.data,
        detalles: detalles.data,
      };
    } catch (error) {
      throw error;
    }
  },

  // ===== GENERACIÓN AUTOMÁTICA =====

  // Generar pedidos automáticamente basado en planificación
  generarAutomatico: async (fechaInicio, fechaFin) => {
    try {
      console.log(
        `🤖 Iniciando generación automática: ${fechaInicio} - ${fechaFin}`
      );

      const response = await axiosInstance.post("/pedidos/automatico", {
        fechaInicio,
        fechaFin,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Enviar pedido por email a proveedor
  enviarPorEmail: async (id, emailProveedor) => {
    try {
      const response = await axiosInstance.post(`/pedidos/${id}/enviar`, {
        email: emailProveedor,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default pedidoService;
