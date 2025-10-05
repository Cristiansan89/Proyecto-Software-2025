import z from 'zod'

const rolPermisoSchema = z.object({
    idRol: z.string({
        required_error: 'El ID del rol es requerido',
        invalid_type_error: 'El ID del rol debe ser un texto'
    }),
    idPermiso: z.string({
        required_error: 'El ID del permiso es requerido',
        invalid_type_error: 'El ID del permiso debe ser un texto'
    })
})

export function validateRolPermiso(input) {
    return rolPermisoSchema.safeParse(input)
}

export function validatePartialRolPermiso(input) {
    return rolPermisoSchema.partial().safeParse(input)
}