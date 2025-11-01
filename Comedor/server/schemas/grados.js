import z from 'zod'

const gradoSchema = z.object({
    id_turno: z.number({
        required_error: 'El ID del turno es requerido',
        invalid_type_error: 'El ID del turno debe ser un número'
    }).int().positive(),
    nombreGrado: z.string({
        required_error: 'El nombre del grado es requerido',
        invalid_type_error: 'El nombre del grado debe ser un texto'
    }).min(1, 'El nombre del grado no puede estar vacío').max(100, 'El nombre del grado no puede tener más de 100 caracteres'),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateGrado(input) {
    return gradoSchema.safeParse(input)
}

export function validatePartialGrado(input) {
    return gradoSchema.partial().safeParse(input)
}