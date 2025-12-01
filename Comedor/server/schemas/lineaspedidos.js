import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const lineaPedidoSchema = z.object({
  id_pedido: z
    .string({
      required_error: "El ID del pedido es requerido",
      invalid_type_error: "El ID del pedido debe ser un texto",
    })
    .regex(uuidRegex, "El ID del pedido debe ser un UUID válido"),
  id_proveedor: z
    .string({
      required_error: "El ID del proveedor es requerido",
      invalid_type_error: "El ID del proveedor debe ser un texto",
    })
    .regex(uuidRegex, "El ID del proveedor debe ser un UUID válido"),
  id_insumo: z.union([
    z
      .number({
        invalid_type_error: "El ID del insumo debe ser un número o UUID",
      })
      .positive("El ID del insumo debe ser positivo"),
    z
      .string({
        invalid_type_error: "El ID del insumo debe ser un número o UUID",
      })
      .regex(uuidRegex, "El ID del insumo debe ser un UUID válido"),
  ]),
  cantidadSolicitada: z
    .number({
      required_error: "La cantidad solicitada es requerida",
      invalid_type_error: "La cantidad solicitada debe ser un número",
    })
    .positive("La cantidad solicitada debe ser positiva"),
});

export function validateLineaPedido(input) {
  return lineaPedidoSchema.safeParse(input);
}

export function validatePartialLineaPedido(input) {
  return lineaPedidoSchema.partial().safeParse(input);
}
