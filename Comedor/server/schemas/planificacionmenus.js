import z from 'zod'

const planificacionMenuSchema = z.object({
    fecha: z.string({
        required_error: 'La fecha es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/),
    tipoComida: z.string({
        required_error: 'El tipo de comida es requerido',
        invalid_type_error: 'El tipo de comida debe ser un texto'
    }).max(50),
    cantidadEstimada: z.number({
        required_error: 'La cantidad estimada es requerida',
        invalid_type_error: 'La cantidad estimada debe ser un número'
    }).int().positive(),
    recetas: z.array(
        z.string({
            invalid_type_error: 'El ID de la receta debe ser un texto'
        })
    ).optional()
})

export function validatePlanificacionMenu(input) {
    return planificacionMenuSchema.safeParse(input)
}

export function validatePartialPlanificacionMenu(input) {
    return planificacionMenuSchema.partial().safeParse(input)
}