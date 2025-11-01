import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const consumoSchema = z.object({
    id_receta: z.string({
        required_error: 'El ID de la receta es requerido',
        invalid_type_error: 'El ID de la receta debe ser un texto'
    }).regex(uuidRegex, 'El ID de la receta debe ser un UUID válido'),
    id_usuario: z.string({
        required_error: 'El ID del usuario es requerido',
        invalid_type_error: 'El ID del usuario debe ser un texto'
    }).regex(uuidRegex, 'El ID del usuario debe ser un UUID válido'),
    fecha: z.string({
        required_error: 'La fecha es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
    cantidadProducida: z.number({
        required_error: 'La cantidad producida es requerida',
        invalid_type_error: 'La cantidad producida debe ser un número'
    }).positive('La cantidad producida debe ser positiva'),
    observaciones: z.string({
        invalid_type_error: 'Las observaciones deben ser un texto'
    }).max(255, 'Las observaciones no pueden tener más de 255 caracteres').optional().nullable()
})

export function validateConsumo(input) {
    return consumoSchema.safeParse(input)
}

export function validatePartialConsumo(input) {
    return consumoSchema.partial().safeParse(input)
}