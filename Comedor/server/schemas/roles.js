import z from "zod"

const rolesSchema = z.object({
    nombreRol: z.string({
        required_error: 'El nombre del rol es requerido',
        invalid_type_error: 'El nombre del rol debe ser un texto'
    }).min(1, 'El nombre del rol no puede estar vacío').max(50, 'El nombre del rol no puede tener más de 50 caracteres'),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255, 'La descripción no puede tener más de 255 caracteres').optional().nullable(),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateRol(input) {
    return rolesSchema.safeParse(input)
}

export function validatePartialRol(input) {
    return rolesSchema.partial().safeParse(input)
}

