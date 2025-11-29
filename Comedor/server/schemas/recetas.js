import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const recetaSchema = z.object({
  nombreReceta: z
    .string({
      required_error: "El nombre de la receta es requerido",
      invalid_type_error: "El nombre de la receta debe ser un texto",
    })
    .min(1, "El nombre de la receta no puede estar vacío")
    .max(100, "El nombre de la receta no puede tener más de 100 caracteres"),
  instrucciones: z
    .string({
      required_error: "Las instrucciones son requeridas",
      invalid_type_error: "Las instrucciones deben ser texto",
    })
    .min(10, "Las instrucciones deben tener al menos 10 caracteres"),
  unidadSalida: z
    .enum(
      [
        "Bandeja",
        "Gramo",
        "Litro",
        "Litros",
        "Plato",
        "Porcion",
        "Porciones",
        "Racion",
        "Kilogramo",
        "Kilogramos",
        "Unidad",
        "Unidades",
      ],
      {
        invalid_type_error:
          "Unidad de salida inválida. Debe ser: Bandeja, Gramo, Litro, Litros, Plato, Porcion, Porciones, Racion, Kilogramo, Kilogramos, Unidad o Unidades",
      }
    )
    .default("Porcion"),
  estado: z
    .enum(["Activo", "Inactivo"], {
      invalid_type_error: "Estado inválido",
    })
    .default("Activo"),
});

export function validateReceta(input) {
  return recetaSchema.safeParse(input);
}

export function validatePartialReceta(input) {
  return recetaSchema.partial().safeParse(input);
}
