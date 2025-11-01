import z from 'zod'

const proveedorSchema = z.object({
    razonSocial: z.string({
        required_error: 'La razón social es requerida',
        invalid_type_error: 'La razón social debe ser un texto'
    }).min(1, 'La razón social no puede estar vacía').max(200, 'La razón social no puede tener más de 200 caracteres'),
    ruc: z.string({
        required_error: 'El RUC es requerido',
        invalid_type_error: 'El RUC debe ser un texto'
    }).regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos'),
    direccion: z.string({
        invalid_type_error: 'La dirección debe ser un texto'
    }).max(255, 'La dirección no puede tener más de 255 caracteres').optional().nullable(),
    telefono: z.string({
        invalid_type_error: 'El teléfono debe ser un texto'
    }).max(15, 'El teléfono no puede tener más de 15 caracteres').optional().nullable(),
    email: z.string({
        invalid_type_error: 'El email debe ser un texto'
    }).email('Email inválido').max(100, 'El email no puede tener más de 100 caracteres').optional().nullable(),
    contacto: z.string({
        invalid_type_error: 'El contacto debe ser un texto'
    }).max(100, 'El contacto no puede tener más de 100 caracteres').optional().nullable(),
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