import { z } from 'zod'

const alumnoGradoSchema = z.object({
    idPersona: z.number({
        invalid_type_error: 'ID de persona debe ser un número',
        required_error: 'ID de persona es requerido',
    }).positive('ID de persona debe ser positivo'),

    nombreGrado: z.string({
        invalid_type_error: 'Nombre del grado debe ser texto',
        required_error: 'Nombre del grado es requerido',
    }).min(1, 'Nombre del grado no puede estar vacío').max(100, 'Nombre del grado es muy largo'),

    cicloLectivo: z.union([
        z.string().regex(/^\d{4}$/, 'El ciclo lectivo debe ser un año de 4 dígitos'),
        z.number().int().min(2020).max(2030)
    ]).optional(),
})

const alumnoGradoUpdateSchema = z.object({
    idPersona: z.number().positive().optional(),
    nombreGrado: z.string().min(1).max(100).optional(),
    cicloLectivo: z.union([
        z.string().regex(/^\d{4}$/),
        z.number().int().min(2020).max(2030)
    ]).optional(),
})

export function validateAlumnoGrado(input) {
    return alumnoGradoSchema.safeParse(input)
}

export function validatePartialAlumnoGrado(input) {
    return alumnoGradoUpdateSchema.safeParse(input)
}