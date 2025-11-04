import { z } from 'zod'

const docenteGradoSchema = z.object({
    idPersona: z.number({
        invalid_type_error: 'ID de persona debe ser un número',
        required_error: 'ID de persona es requerido',
    }).positive('ID de persona debe ser positivo'),

    nombreGrado: z.string({
        invalid_type_error: 'Nombre del grado debe ser texto',
        required_error: 'Nombre del grado es requerido',
    }).min(1, 'Nombre del grado no puede estar vacío').max(100, 'Nombre del grado es muy largo'),

    fechaAsignado: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
        .optional(),

    cicloLectivo: z.union([
        z.string().regex(/^\d{4}$/, 'El ciclo lectivo debe ser un año de 4 dígitos'),
        z.number().int().min(2020).max(2030)
    ]).optional(),
})

const docenteGradoUpdateSchema = z.object({
    newIdPersona: z.number().positive().optional(),
    newNombreGrado: z.string().min(1).max(100).optional(),
    fechaAsignado: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    cicloLectivo: z.union([
        z.string().regex(/^\d{4}$/),
        z.number().int().min(2020).max(2030)
    ]).optional(),
})

export function validateDocenteGrado(input) {
    return docenteGradoSchema.safeParse(input)
}

export function validatePartialDocenteGrado(input) {
    return docenteGradoUpdateSchema.safeParse(input)
}