import z from "zod"

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const personasSchema = z.object({
    nombreRol: z.string({
        required_error: 'El nombre del rol es requerido',
        invalid_type_error: 'El nombre del rol debe ser texto'
    }).min(1, 'El nombre del rol es requerido').max(100, 'El nombre del rol no puede tener más de 100 caracteres'),
    nombre: z.string({
        required_error: 'El nombre es requerido',
        invalid_type_error: 'El nombre debe ser texto'
    }).min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede tener más de 100 caracteres'),
    apellido: z.string({
        required_error: 'El apellido es requerido',
        invalid_type_error: 'El apellido debe ser texto'
    }).min(2, 'El apellido debe tener al menos 2 caracteres').max(100, 'El apellido no puede tener más de 100 caracteres'),
    dni: z.string({
        required_error: 'El DNI es requerido',
        invalid_type_error: 'El DNI debe ser texto'
    }).min(6, 'El DNI debe tener al menos 6 caracteres').max(100, 'El DNI no puede tener más de 100 caracteres'),
    fechaNacimiento: z.string({
        required_error: 'La fecha de nacimiento es requerida',
        invalid_type_error: 'La fecha de nacimiento debe ser texto'
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
    genero: z.enum(['Masculino', 'Femenina', 'Otros'], {
        required_error: 'El género es requerido',
        invalid_type_error: 'Género inválido'
    }),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validatePersona(input) {
    return personasSchema.safeParse(input)
}

export function validatePartialPersona(input) {
    return personasSchema.partial().safeParse(input)
}