import { z } from "zod";

// Esquema para crear estado de pedido
export const createEstadoPedidoSchema = z.object({
  body: z.object({
    nombre: z
      .string({
        required_error: "El nombre es requerido",
      })
      .min(1, "El nombre no puede estar vacío")
      .max(50, "El nombre no puede tener más de 50 caracteres"),
    descripcion: z
      .string()
      .max(200, "La descripción no puede tener más de 200 caracteres")
      .optional(),
    estado: z
      .enum(["Activo", "Inactivo"], {
        errorMap: () => ({
          message: "El estado debe ser 'Activo' o 'Inactivo'",
        }),
      })
      .optional(),
  }),
});

// Esquema para actualizar estado de pedido
export const updateEstadoPedidoSchema = z.object({
  body: z.object({
    nombre: z
      .string()
      .min(1, "El nombre no puede estar vacío")
      .max(50, "El nombre no puede tener más de 50 caracteres")
      .optional(),
    descripcion: z
      .string()
      .max(200, "La descripción no puede tener más de 200 caracteres")
      .optional(),
    estado: z
      .enum(["Activo", "Inactivo"], {
        errorMap: () => ({
          message: "El estado debe ser 'Activo' o 'Inactivo'",
        }),
      })
      .optional(),
  }),
  params: z.object({
    id: z.string().uuid("El ID debe ser un UUID válido"),
  }),
});

// Esquema para obtener estado de pedido por ID
export const getEstadoPedidoByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID debe ser un UUID válido"),
  }),
});

// Esquema para eliminar estado de pedido
export const deleteEstadoPedidoSchema = z.object({
  params: z.object({
    id: z.string().uuid("El ID debe ser un UUID válido"),
  }),
});
