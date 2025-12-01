import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const consumoSchema = z.object({
  id_servicio: z
    .string({
      required_error: "El ID del servicio es requerido",
      invalid_type_error: "El ID del servicio debe ser un texto",
    })
    .regex(uuidRegex, "El ID del servicio debe ser un UUID válido"),

  id_turno: z
    .string({
      required_error: "El ID del turno es requerido",
      invalid_type_error: "El ID del turno debe ser un texto",
    })
    .regex(uuidRegex, "El ID del turno debe ser un UUID válido"),

  id_usuario: z
    .string({
      required_error: "El ID del usuario es requerido",
      invalid_type_error: "El ID del usuario debe ser un texto",
    })
    .regex(uuidRegex, "El ID del usuario debe ser un UUID válido"),

  fecha: z
    .string({
      required_error: "La fecha es requerida",
      invalid_type_error: "La fecha debe ser un texto en formato YYYY-MM-DD",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),

  fecha_registro: z
    .string({
      invalid_type_error: "La fecha de registro debe ser un texto",
    })
    .optional()
    .nullable(),

  observaciones: z
    .string({
      invalid_type_error: "Las observaciones deben ser un texto",
    })
    .max(500, "Las observaciones no pueden tener más de 500 caracteres")
    .optional()
    .nullable(),

  estado: z
    .enum(["activo", "inactivo"], {
      invalid_type_error: "El estado debe ser activo o inactivo",
    })
    .optional()
    .default("activo"),

  // Campos opcionales para recibir datos del frontend
  nombreServicio: z.string().optional(),
  nombreTurno: z.string().optional(),
  nombreUsuario: z.string().optional(),
  nombrePersona: z.string().optional(),

  // Para crear detalles de consumo (insumos)
  detalles: z
    .array(
      z.object({
        id_insumo: z
          .string()
          .regex(uuidRegex, "El ID del insumo debe ser un UUID válido"),
        cantidad_utilizada: z
          .number()
          .positive("La cantidad debe ser positiva"),
        unidad_medida: z.string().optional(),
        costo_unitario: z.number().optional(),
        observaciones_detalle: z.string().max(255).optional(),
      })
    )
    .optional()
    .default([]),
});

export function validateConsumo(input) {
  return consumoSchema.safeParse(input);
}

export function validatePartialConsumo(input) {
  return consumoSchema.partial().safeParse(input);
}
