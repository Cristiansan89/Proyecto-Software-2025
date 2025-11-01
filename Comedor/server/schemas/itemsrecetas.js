import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const itemRecetaSchema = z.object({
    id_receta: z.string({
        required_error: 'El ID de la receta es requerido',
        invalid_type_error: 'El ID de la receta debe ser un texto'
    }).regex(uuidRegex, 'El ID de la receta debe ser un UUID válido'),
    id_insumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }).regex(uuidRegex, 'El ID del insumo debe ser un UUID válido'),
    cantidadUtilizar: z.number({
        required_error: 'La cantidad a utilizar es requerida',
        invalid_type_error: 'La cantidad a utilizar debe ser un número'
    }).positive('La cantidad a utilizar debe ser positiva'),
    observaciones: z.string({
        invalid_type_error: 'Las observaciones deben ser un texto'
    }).max(255, 'Las observaciones no pueden tener más de 255 caracteres').optional().nullable()
})

export function validateItemsReceta(input) {
    return itemRecetaSchema.safeParse(input)
}

export function validatePartialItemsReceta(input) {
    return itemRecetaSchema.partial().safeParse(input)
}