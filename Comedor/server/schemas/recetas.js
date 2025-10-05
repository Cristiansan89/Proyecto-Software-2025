import z from 'zod'

const recetaSchema = z.object({
    nombrePlato: z.string({
        required_error: 'El nombre del plato es requerido',
        invalid_type_error: 'El nombre del plato debe ser un texto'
    }).min(1).max(100),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255).nullable(),
    tiempoPreparacion: z.number({
        required_error: 'El tiempo de preparación es requerido',
        invalid_type_error: 'El tiempo de preparación debe ser un número'
    }).int().positive(),
    porciones: z.number({
        required_error: 'El número de porciones es requerido',
        invalid_type_error: 'El número de porciones debe ser un número'
    }).int().positive()
})

export function validateReceta(input) {
    return recetaSchema.safeParse(input)
}

export function validatePartialReceta(input) {
    return recetaSchema.partial().safeParse(input)
}