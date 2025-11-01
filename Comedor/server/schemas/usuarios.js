import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const usuariosSchema = z.object({
    id_persona: z.string({
        required_error: 'El ID de la persona es requerido',
        invalid_type_error: 'El ID de la persona debe ser un texto'
    }).regex(uuidRegex, 'El ID de la persona debe ser un UUID válido'),
    id_rol: z.string({
        required_error: 'El ID del rol es requerido',
        invalid_type_error: 'El ID del rol debe ser un texto'
    }).regex(uuidRegex, 'El ID del rol debe ser un UUID válido'),
    nombreUsuario: z.string({
        required_error: 'El nombre de usuario es requerido',
        invalid_type_error: 'El nombre de usuario debe ser un texto'
    }).min(4, 'El nombre de usuario debe tener al menos 4 caracteres').max(50, 'El nombre de usuario no puede tener más de 50 caracteres'),
    contrasena: z.string({
        required_error: 'La contraseña es requerida',
        invalid_type_error: 'La contraseña debe ser un texto'
    }).min(6, 'La contraseña debe tener al menos 6 caracteres').max(255, 'La contraseña no puede tener más de 255 caracteres'),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateUsuario(input) {
    return usuariosSchema.safeParse(input)
}

export function validatePartialUsuario(input) {
    return usuariosSchema.partial().safeParse(input)
}