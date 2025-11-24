import EstadoPedidoModel from "../models/estadopedido.js";

class EstadoPedidoController {
  constructor() {
    this.estadoPedidoModel = new EstadoPedidoModel();
  }

  // Obtener todos los estados de pedido
  getAll = async (req, res) => {
    try {
      const estadosPedido = await this.estadoPedidoModel.getAll();
      res.json(estadosPedido);
    } catch (error) {
      console.error("Error al obtener estados de pedido:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Obtener estado de pedido por ID
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const estadoPedido = await this.estadoPedidoModel.getById(id);

      if (!estadoPedido) {
        return res.status(404).json({
          message: "Estado de pedido no encontrado",
        });
      }

      res.json(estadoPedido);
    } catch (error) {
      console.error("Error al obtener estado de pedido:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Crear nuevo estado de pedido
  create = async (req, res) => {
    try {
      const { nombre, descripcion, estado } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          message: "El nombre es requerido",
        });
      }

      if (nombre.length > 50) {
        return res.status(400).json({
          message: "El nombre no puede tener más de 50 caracteres",
        });
      }

      if (descripcion && descripcion.length > 200) {
        return res.status(400).json({
          message: "La descripción no puede tener más de 200 caracteres",
        });
      }

      // Verificar si ya existe un estado con el mismo nombre
      const exists = await this.estadoPedidoModel.existsByNombre(nombre);
      if (exists) {
        return res.status(409).json({
          message: "Ya existe un estado de pedido con ese nombre",
        });
      }

      const nuevoEstadoPedido = await this.estadoPedidoModel.create({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        estado: estado || "Activo",
      });

      res.status(201).json({
        message: "Estado de pedido creado exitosamente",
        data: nuevoEstadoPedido,
      });
    } catch (error) {
      console.error("Error al crear estado de pedido:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Actualizar estado de pedido
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, estado } = req.body;

      // Validaciones básicas
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          message: "El nombre es requerido",
        });
      }

      if (nombre.length > 50) {
        return res.status(400).json({
          message: "El nombre no puede tener más de 50 caracteres",
        });
      }

      if (descripcion && descripcion.length > 200) {
        return res.status(400).json({
          message: "La descripción no puede tener más de 200 caracteres",
        });
      }

      // Verificar si existe otro estado con el mismo nombre
      const exists = await this.estadoPedidoModel.existsByNombre(nombre, id);
      if (exists) {
        return res.status(409).json({
          message: "Ya existe un estado de pedido con ese nombre",
        });
      }

      const estadoPedidoActualizado = await this.estadoPedidoModel.update(id, {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        estado,
      });

      res.json({
        message: "Estado de pedido actualizado exitosamente",
        data: estadoPedidoActualizado,
      });
    } catch (error) {
      console.error("Error al actualizar estado de pedido:", error);

      if (error.message === "Estado de pedido no encontrado") {
        return res.status(404).json({ message: error.message });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };

  // Eliminar estado de pedido
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.estadoPedidoModel.delete(id);

      res.json(result);
    } catch (error) {
      console.error("Error al eliminar estado de pedido:", error);

      if (error.message === "Estado de pedido no encontrado") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message.includes("está siendo usado")) {
        return res.status(409).json({ message: error.message });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  };
}

export default EstadoPedidoController;
