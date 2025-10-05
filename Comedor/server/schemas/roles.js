import z from "zod"

const rolesSchema = z.object({
    nombreRol: z.string({
        required_error: 'El nombre del rol es requerido',
        invalid_type_error: 'El nombre del rol debe ser un texto'
    }).min(1).max(50),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255).nullable()
})

export function validateRol(input) {
    return rolesSchema.safeParse(input)
}

export function validatePartialRol(input) {
    return rolesSchema.partial().safeParse(input)
}

