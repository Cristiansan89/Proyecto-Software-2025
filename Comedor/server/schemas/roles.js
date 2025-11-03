import z from "zod"

const rolesSchema = z.object({
    nombreRol: z.string({
        required_error: 'El nombre del rol es requerido',
        invalid_type_error: 'El nombre del rol debe ser un texto'
    }).min(1, 'El nombre del rol no puede estar vacío').max(100, 'El nombre del rol no puede tener más de 100 caracteres'),
    descripcionRol: z.string({
        required_error: 'La descripción del rol es requerida',
        invalid_type_error: 'La descripción debe ser un texto'
    }).min(1, 'La descripción no puede estar vacía').max(100, 'La descripción no puede tener más de 100 caracteres'),
    habilitaCuentaUsuario: z.enum(['Si', 'No'], {
        invalid_type_error: 'Valor inválido para habilita cuenta usuario'
    }).default('No'),
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

