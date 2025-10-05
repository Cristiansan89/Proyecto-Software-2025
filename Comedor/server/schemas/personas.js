import z from "zod"

const personasSchema = z.object({
    nombre: z.string().min(4, { message: "El nombre de la persona es obligatorio" }),
    apellido: z.string().min(4, { message: "El apellido de la persona es obligatorio" }),
    estado: z.enum(['activo', 'inactivo'], { message: "El estado debe ser 'activo' o 'inactivo'" }),
    idGrado: z.number().min(1, { message: "El ID del grado es obligatorio" })
})

export function validatePersona(input) {
    return personasSchema.safeParse(input)
}

export function validatePartialPersona(input) {
    return personasSchema.partial().safeParse(input)
}