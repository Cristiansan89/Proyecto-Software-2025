import z from 'zod'

const proveedorSchema = z.object({
    razonSocial: z.string({
        required_error: 'La razón social es requerida',
        invalid_type_error: 'La razón social debe ser un texto'
    }).min(1, 'La razón social no puede estar vacía').max(100, 'La razón social no puede tener más de 100 caracteres'),
    CUIT: z.string({
        required_error: 'El CUIT es requerido',
        invalid_type_error: 'El CUIT debe ser un texto'
    }).min(11, 'El CUIT debe tener al menos 11 caracteres').max(13, 'El CUIT no puede tener más de 13 caracteres'),
    direccion: z.string({
        invalid_type_error: 'La dirección debe ser un texto'
    }).max(100, 'La dirección no puede tener más de 100 caracteres').optional().nullable(),
    telefono: z.string({
        invalid_type_error: 'El teléfono debe ser un texto'
    }).max(20, 'El teléfono no puede tener más de 20 caracteres').optional().nullable(),
    mail: z.string({
        required_error: 'El email es requerido',
        invalid_type_error: 'El email debe ser un texto'
    }).email('El formato del email no es válido').max(100, 'El email no puede tener más de 100 caracteres'),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

const asignarInsumosSchema = z.object({
    insumos: z.array(z.object({
        idInsumo: z.coerce.number({
            required_error: 'El ID del insumo es requerido',
            invalid_type_error: 'El ID del insumo debe ser un número'
        }).positive('El ID del insumo debe ser mayor a 0'),
        calificacion: z.enum(['Excelente', 'Bueno', 'Regular', 'Malo'], {
            invalid_type_error: 'Calificación inválida'
        }).default('Bueno')
    })).min(1, 'Debe seleccionar al menos un insumo')
})

export function validateProveedor(input) {
    return proveedorSchema.safeParse(input)
}

export function validatePartialProveedor(input) {
    return proveedorSchema.partial().safeParse(input)
}

export function validateAsignarInsumos(input) {
    return asignarInsumosSchema.safeParse(input)
}