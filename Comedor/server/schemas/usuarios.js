import z from 'zod'

const usuariosSchema = z.object({
    idRol: z.string({
        required_error: 'El ID del rol es requerido',
        invalid_type_error: 'El ID del rol debe ser un texto'
    }),
    nombreUsuario: z.string({
        required_error: 'El nombre de usuario es requerido',
        invalid_type_error: 'El nombre de usuario debe ser un texto'
    }).min(4).max(50),
    contrasena: z.string({
        required_error: 'La contraseña es requerida',
        invalid_type_error: 'La contraseña debe ser un texto'
    }).min(6).max(255),
    mail: z.string({
        invalid_type_error: 'El email debe ser un texto'
    }).email('Email inválido').max(100).nullable(),
    telefono: z.string({
        invalid_type_error: 'El teléfono debe ser un texto'
    }).max(20).nullable(),
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