import z from 'zod'

const permisoSchema = z.object({
    nombrePermiso: z.string({
        required_error: 'El nombre del permiso es requerido',
        invalid_type_error: 'El nombre del permiso debe ser un texto'
    }).min(1).max(100)
})

export function validatePermiso(input) {
    return permisoSchema.safeParse(input)
}

export function validatePartialPermiso(input) {
    return permisoSchema.partial().safeParse(input)
}