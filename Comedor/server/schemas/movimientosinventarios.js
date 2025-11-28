import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const movimientoInventarioSchema = z.object({
  id_insumo: z
    .number({
      required_error: "El ID del insumo es requerido",
      invalid_type_error: "El ID del insumo debe ser un número",
    })
    .positive("El ID del insumo debe ser positivo"),
  id_usuario: z
    .string({
      required_error: "El ID del usuario es requerido",
      invalid_type_error: "El ID del usuario debe ser un texto",
    })
    .regex(uuidRegex, "El ID del usuario debe ser un UUID válido"),
  id_consumo: z
    .string({
      invalid_type_error: "El ID del consumo debe ser un texto",
    })
    .regex(uuidRegex, "El ID del consumo debe ser un UUID válido")
    .optional()
    .nullable(),
  id_tipoMerma: z
    .number({
      invalid_type_error: "El ID del tipo de merma debe ser un número",
    })
    .positive("El ID del tipo de merma debe ser positivo")
    .optional()
    .nullable(),
  tipoMovimiento: z.enum(["Entrada", "Salida", "Ajuste", "Merma"], {
    required_error: "El tipo de movimiento es requerido",
    invalid_type_error: "Tipo de movimiento inválido",
  }),
  cantidadMovimiento: z
    .number({
      required_error: "La cantidad es requerida",
      invalid_type_error: "La cantidad debe ser un número",
    })
    .positive("La cantidad debe ser positiva"),
  comentarioMovimiento: z
    .string({
      invalid_type_error: "El comentario debe ser un texto",
    })
    .max(255, "El comentario no puede tener más de 255 caracteres")
    .optional()
    .nullable(),
});

export function validateMovimientosInvetarios(input) {
  return movimientoInventarioSchema.safeParse(input);
}

export function validatePartialMovimientosInvetarios(input) {
  return movimientoInventarioSchema.partial().safeParse(input);
}
