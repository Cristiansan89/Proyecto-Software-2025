import z from "zod";

// UUID validation regex
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const usuariosSchema = z.object({
  idPersona: z
    .number({
      invalid_type_error: "El ID de la persona debe ser un número",
    })
    .int("El ID de la persona debe ser un número entero")
    .positive("El ID de la persona debe ser positivo")
    .nullable()
    .optional(),
  idProveedor: z
    .union([
      z.string().uuid("El ID del proveedor debe ser un UUID válido"),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),
  nombreUsuario: z
    .string({
      required_error: "El nombre de usuario es requerido",
      invalid_type_error: "El nombre de usuario debe ser un texto",
    })
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(100, "El nombre de usuario no puede tener más de 100 caracteres"),
  contrasena: z
    .string({
      required_error: "La contraseña es requerida",
      invalid_type_error: "La contraseña debe ser un texto",
    })
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(255, "La contraseña no puede tener más de 255 caracteres"),
  mail: z
    .union([
      z
        .string()
        .email("Email inválido")
        .max(100, "El email no puede tener más de 100 caracteres"),
      z.string().length(0, "El email debe estar vacío o ser un email válido"),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),
  telefono: z
    .string({
      invalid_type_error: "El teléfono debe ser texto",
    })
    .max(20, "El teléfono no puede tener más de 20 caracteres")
    .optional()
    .nullable(),
  estado: z
    .enum(["Activo", "Inactivo"], {
      invalid_type_error: "Estado inválido",
    })
    .default("Activo"),
});

// Schema completo con validación de que debe haber idPersona o idProveedor
const usuariosSchemaCompleto = usuariosSchema.refine(
  (data) => data.idPersona || data.idProveedor,
  {
    message: "Debe proporcionar idPersona o idProveedor",
    path: ["idPersona", "idProveedor"],
  }
);

export function validateUsuario(input) {
  return usuariosSchemaCompleto.safeParse(input);
}

export function validatePartialUsuario(input) {
  return usuariosSchema.partial().safeParse(input);
}
