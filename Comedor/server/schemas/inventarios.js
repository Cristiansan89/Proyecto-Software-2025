import z from 'zod'

const inventarioSchema = z.object({
    idInsumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }),
    cantidadActual: z.number({
        required_error: 'La cantidad actual es requerida',
        invalid_type_error: 'La cantidad actual debe ser un número'
    }).min(0),
    nivelMinimoAlerta: z.number({
        required_error: 'El nivel mínimo de alerta es requerido',
        invalid_type_error: 'El nivel mínimo de alerta debe ser un número'
    }).min(0)
})

export function validateInventario(input) {
    return inventarioSchema.safeParse(input)
}

export function validatePartialInventario(input) {
    return inventarioSchema.partial().safeParse(input)
}