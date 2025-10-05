import z from 'zod'

const gradoSchema = z.object({
    nombreGrado: z.string({
        required_error: 'El nombre del grado es requerido',
        invalid_type_error: 'El nombre del grado debe ser un texto'
    }).min(1).max(50),
    turno: z.enum(['Mañana', 'Tarde', 'Noche'], {
        required_error: 'El turno es requerido',
        invalid_type_error: 'Turno inválido'
    }),
    cantidadAlumnos: z.number({
        required_error: 'La cantidad de alumnos es requerida',
        invalid_type_error: 'La cantidad de alumnos debe ser un número'
    }).int().positive()
})

export function validateGrado(input) {
    return gradoSchema.safeParse(input)
}

export function validatePartialGrado(input) {
    return gradoSchema.partial().safeParse(input)
}