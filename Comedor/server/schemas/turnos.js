import z from 'zod'

const turnoSchema = z.object({
    nombre: z.string({
        required_error: 'El nombre del turno es requerido',
        invalid_type_error: 'El nombre del turno debe ser un texto'
    }).min(1, 'El nombre del turno no puede estar vacío').max(16, 'El nombre del turno no puede tener más de 16 caracteres'),
    horaInicio: z.string({
        required_error: 'La hora de inicio es requerida',
        invalid_type_error: 'La hora de inicio debe ser un texto'
    }).regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'La hora debe tener formato HH:MM:SS'),
    horaFin: z.string({
        required_error: 'La hora de fin es requerida',
        invalid_type_error: 'La hora de fin debe ser un texto'
    }).regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'La hora debe tener formato HH:MM:SS'),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateTurno(input) {
    return turnoSchema.safeParse(input)
}

export function validatePartialTurno(input) {
    return turnoSchema.partial().safeParse(input)
}