import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const itemRecetaSchema = z.object({
  id_receta: z
    .string({
      required_error: "El ID de la receta es requerido",
      invalid_type_error: "El ID de la receta debe ser un texto",
    })
    .regex(uuidRegex, "El ID de la receta debe ser un UUID válido"),
  id_insumo: z.union(
    [
      z.number().int().positive("El ID del insumo debe ser un número positivo"),
      z
        .string()
        .transform((val) => parseInt(val))
        .refine(
          (val) => !isNaN(val) && val > 0,
          "El ID del insumo debe ser un número positivo"
        ),
    ],
    {
      required_error: "El ID del insumo es requerido",
      invalid_type_error: "El ID del insumo debe ser un número",
    }
  ),
  cantidadPorPorcion: z
    .number({
      required_error: "La cantidad por porción es requerida",
      invalid_type_error: "La cantidad por porción debe ser un número",
    })
    .positive("La cantidad por porción debe ser positiva"),
  unidadPorPorcion: z.enum(
    [
      "Gramo",
      "Gramos",
      "Kilogramo",
      "Kilogramos",
      "Mililitro",
      "Mililitros",
      "Litro",
      "Litros",
      "Unidad",
      "Unidades",
      "Pizca",
      "Cucharadita",
      "Cucharada",
      "Taza",
    ],
    {
      required_error: "La unidad por porción es requerida",
      invalid_type_error: "La unidad por porción no es válida",
    }
  ),
});

export function validateItemsReceta(input) {
  return itemRecetaSchema.safeParse(input);
}

export function validatePartialItemsReceta(input) {
  return itemRecetaSchema.partial().safeParse(input);
}
