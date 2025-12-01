import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const planificacionMenuSchema = z.object({
  id_usuario: z
    .string({
      required_error: "El ID del usuario es requerido",
      invalid_type_error: "El ID del usuario debe ser un texto",
    })
    .regex(uuidRegex, "El ID del usuario debe ser un UUID válido"),
  fechaInicio: z
    .string({
      required_error: "La fecha de inicio es requerida",
      invalid_type_error: "La fecha debe ser un texto en formato YYYY-MM-DD",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
  fechaFin: z
    .string({
      required_error: "La fecha de fin es requerida",
      invalid_type_error: "La fecha debe ser un texto en formato YYYY-MM-DD",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
  comensalesEstimados: z
    .number({
      invalid_type_error: "Los comensales estimados deben ser un número",
    })
    .int()
    .min(0, "Los comensales estimados no pueden ser negativos")
    .default(0),
  estado: z
    .enum(["Pendiente", "Activo", "Cancelado", "Finalizado"], {
      invalid_type_error: "Estado inválido",
    })
    .default("Pendiente"),
});

export function validatePlanificacionMenu(input) {
  return planificacionMenuSchema.safeParse(input);
}

export function validatePartialPlanificacionMenu(input) {
  return planificacionMenuSchema.partial().safeParse(input);
}
