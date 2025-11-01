import z from 'zod'

const permisoSchema = z.object({
    nombrePermiso: z.string({
        required_error: 'El nombre del permiso es requerido',
        invalid_type_error: 'El nombre del permiso debe ser un texto'
    }).min(1, 'El nombre del permiso no puede estar vacío').max(100, 'El nombre del permiso no puede tener más de 100 caracteres'),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255, 'La descripción no puede tener más de 255 caracteres').optional().nullable(),
    modulo: z.string({
        invalid_type_error: 'El módulo debe ser un texto'
    }).max(50, 'El módulo no puede tener más de 50 caracteres').optional().nullable(),
    accion: z.string({
        invalid_type_error: 'La acción debe ser un texto'
    }).max(50, 'La acción no puede tener más de 50 caracteres').optional().nullable(),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validatePermiso(input) {
    return permisoSchema.safeParse(input)
}

export function validatePartialPermiso(input) {
    return permisoSchema.partial().safeParse(input)
}