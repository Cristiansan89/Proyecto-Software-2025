import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const rolPermisoSchema = z.object({
    id_rol: z.string({
        required_error: 'El ID del rol es requerido',
        invalid_type_error: 'El ID del rol debe ser un texto'
    }).regex(uuidRegex, 'El ID del rol debe ser un UUID válido'),
    id_permiso: z.string({
        required_error: 'El ID del permiso es requerido',
        invalid_type_error: 'El ID del permiso debe ser un texto'
    }).regex(uuidRegex, 'El ID del permiso debe ser un UUID válido')
})

export function validateRolPermiso(input) {
    return rolPermisoSchema.safeParse(input)
}

export function validatePartialRolPermiso(input) {
    return rolPermisoSchema.partial().safeParse(input)
}