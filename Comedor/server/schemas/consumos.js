import z from 'zod'

const consumoSchema = z.object({
    idReceta: z.string({
        required_error: 'El ID de la receta es requerido',
        invalid_type_error: 'El ID de la receta debe ser un texto'
    }),
    fecha: z.string({
        required_error: 'La fecha es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/),
    cantidadRaciones: z.number({
        required_error: 'La cantidad de raciones es requerida',
        invalid_type_error: 'La cantidad de raciones debe ser un número'
    }).int().positive()
})

export function validateConsumo(input) {
    return consumoSchema.safeParse(input)
}

export function validatePartialConsumo(input) {
    return consumoSchema.partial().safeParse(input)
}