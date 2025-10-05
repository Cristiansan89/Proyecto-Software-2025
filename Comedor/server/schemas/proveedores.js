import z from 'zod'

const proveedorSchema = z.object({
    razonSocial: z.string({
        required_error: 'La razón social es requerida',
        invalid_type_error: 'La razón social debe ser un texto'
    }).min(1).max(200),
    direccion: z.string({
        invalid_type_error: 'La dirección debe ser un texto'
    }).max(255).nullable(),
    telefono: z.string({
        invalid_type_error: 'El teléfono debe ser un texto'
    }).max(20).nullable(),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateProveedor(input) {
    return proveedorSchema.safeParse(input)
}

export function validatePartialProveedor(input) {
    return proveedorSchema.partial().safeParse(input)
}