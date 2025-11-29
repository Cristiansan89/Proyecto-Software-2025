import z from "zod";

const parametroSistemaSchema = z.object({
  nombreParametro: z
    .string({
      required_error: "El nombre del parámetro es requerido",
      invalid_type_error: "El nombre debe ser un texto",
    })
    .min(1, "El nombre no puede estar vacío")
    .max(100, "El nombre no puede tener más de 100 caracteres"),
  valor: z
    .string({
      required_error: "El valor es requerido",
      invalid_type_error: "El valor debe ser un texto",
    })
    .min(1, "El valor no puede estar vacío")
    .max(255, "El valor no puede tener más de 255 caracteres"),
  tipoParametro: z
    .enum(["Texto", "Numero", "Booleano", "Fecha"], {
      invalid_type_error: "Tipo inválido",
    })
    .default("Texto"),
  estado: z
    .enum(["Activo", "Inactivo"], {
      invalid_type_error: "Estado inválido",
    })
    .default("Activo"),
});

export function validateParametroSistema(input) {
  return parametroSistemaSchema.safeParse(input);
}

export function validatePartialParametroSistema(input) {
  return parametroSistemaSchema.partial().safeParse(input);
}
