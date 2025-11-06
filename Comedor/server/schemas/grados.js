import z from 'zod'

const gradoSchema = z.object({
    idTurno: z.number({
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
}).transform((data) => ({
    ...data,
    id_turno: data.idTurno // Convertir idTurno a id_turno para la base de datos
}))

// Esquema para actualizaciones parciales (todos los campos opcionales)
const partialGradoSchema = z.object({
    idTurno: z.number({
        invalid_type_error: 'El ID del turno debe ser un número'
    }).int().positive().optional(),
    nombreGrado: z.string({
        invalid_type_error: 'El nombre del grado debe ser un texto'
    }).min(1, 'El nombre del grado no puede estar vacío').max(100, 'El nombre del grado no puede tener más de 100 caracteres').optional(),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).optional()
}).transform((data) => {
    const result = { ...data };
    if (data.idTurno !== undefined) {
        result.id_turno = data.idTurno;
    }
    return result;
})

export function validateGrado(input) {
    return gradoSchema.safeParse(input)
}

export function validatePartialGrado(input) {
    return partialGradoSchema.safeParse(input)
}