import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const registroAsistenciaSchema = z.object({
    id_grado: z.string({
        required_error: 'El ID del grado es requerido',
        invalid_type_error: 'El ID del grado debe ser un texto'
    }).regex(uuidRegex, 'El ID del grado debe ser un UUID válido'),
    id_servicio: z.string({
        required_error: 'El ID del servicio es requerido',
        invalid_type_error: 'El ID del servicio debe ser un texto'
    }).regex(uuidRegex, 'El ID del servicio debe ser un UUID válido'),
    fecha: z.string({
        required_error: 'La fecha es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
    cantidadPresentes: z.number({
        required_error: 'La cantidad de presentes es requerida',
        invalid_type_error: 'La cantidad de presentes debe ser un número'
    }).int().min(0, 'La cantidad de presentes no puede ser negativa')
})

export function validateRegistroAsistencia(input) {
    return registroAsistenciaSchema.safeParse(input)
}

export function validatePartialRegistroAsistencia(input) {
    return registroAsistenciaSchema.partial().safeParse(input)
}