import z from 'zod'

const insumoSchema = z.object({
    nombreInsumo: z.string({
        required_error: 'El nombre del insumo es requerido',
        invalid_type_error: 'El nombre del insumo debe ser un texto'
    }).min(1).max(100),
    unidadDeMedida: z.string({
        required_error: 'La unidad de medida es requerida',
        invalid_type_error: 'La unidad de medida debe ser un texto'
    }).max(20),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255).nullable()
})

export function validateInsumo(input) {
    return insumoSchema.safeParse(input)
}

export function validatePartialInsumo(input) {
    return insumoSchema.partial().safeParse(input)
}