import z from 'zod'

const registroAsistenciaSchema = z.object({
    idGrado: z.string({
        required_error: 'El ID del grado es requerido',
        invalid_type_error: 'El ID del grado debe ser un texto'
    }),
    fecha: z.string({
        required_error: 'La fecha es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/),
    tipoServicio: z.string({
        required_error: 'El tipo de servicio es requerido',
        invalid_type_error: 'El tipo de servicio debe ser un texto'
    }).max(50),
    cantidadPresentes: z.number({
        required_error: 'La cantidad de presentes es requerida',
        invalid_type_error: 'La cantidad de presentes debe ser un número'
    }).int().positive()
})

export function validateRegistroAsistencia(input) {
    return registroAsistenciaSchema.safeParse(input)
}

export function validatePartialRegistroAsistencia(input) {
    return registroAsistenciaSchema.partial().safeParse(input)
}