import z from 'zod'

const insumoSchema = z.object({
    nombreInsumo: z.string({
        required_error: 'El nombre del insumo es requerido',
        invalid_type_error: 'El nombre del insumo debe ser un texto'
    }).min(1, 'El nombre del insumo no puede estar vacío').max(100, 'El nombre del insumo no puede tener más de 100 caracteres'),
    unidadMedida: z.enum(['Kilogramo', 'Gramo', 'Litro', 'Mililitro', 'Unidad', 'Docena', 'Paquete'], {
        required_error: 'La unidad de medida es requerida',
        invalid_type_error: 'Unidad de medida inválida'
    }),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255, 'La descripción no puede tener más de 255 caracteres').optional().nullable(),
    stockMinimo: z.number({
        invalid_type_error: 'El stock mínimo debe ser un número'
    }).min(0, 'El stock mínimo no puede ser negativo').default(0),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateInsumo(input) {
    return insumoSchema.safeParse(input)
}

export function validatePartialInsumo(input) {
    return insumoSchema.partial().safeParse(input)
}