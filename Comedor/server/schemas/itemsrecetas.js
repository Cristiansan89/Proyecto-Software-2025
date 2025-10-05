import z from 'zod'

const itemRecetaSchema = z.object({
    idReceta: z.string({
        required_error: 'El ID de la receta es requerido',
        invalid_type_error: 'El ID de la receta debe ser un texto'
    }),
    idInsumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }),
    cantidadPorPorcion: z.number({
        required_error: 'La cantidad por porción es requerida',
        invalid_type_error: 'La cantidad por porción debe ser un número'
    }).positive()
})

export function validateItemsReceta(input) {
    return itemRecetaSchema.safeParse(input)
}

export function validatePartialItemsReceta(input) {
    return itemRecetaSchema.partial().safeParse(input)
}