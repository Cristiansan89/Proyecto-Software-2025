import z from "zod"

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const personasSchema = z.object({
    id_grado: z.string({
        required_error: 'El ID del grado es requerido',
        invalid_type_error: 'El ID del grado debe ser un texto'
    }).regex(uuidRegex, 'El ID del grado debe ser un UUID válido'),
    nombres: z.string({
        required_error: 'Los nombres son requeridos',
        invalid_type_error: 'Los nombres deben ser texto'
    }).min(2, 'Los nombres deben tener al menos 2 caracteres').max(100, 'Los nombres no pueden tener más de 100 caracteres'),
    apellidos: z.string({
        required_error: 'Los apellidos son requeridos',
        invalid_type_error: 'Los apellidos deben ser texto'
    }).min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100, 'Los apellidos no pueden tener más de 100 caracteres'),
    tipoDocumento: z.enum(['DNI', 'CE', 'Pasaporte'], {
        required_error: 'El tipo de documento es requerido',
        invalid_type_error: 'Tipo de documento inválido'
    }),
    numeroDocumento: z.string({
        required_error: 'El número de documento es requerido',
        invalid_type_error: 'El número de documento debe ser texto'
    }).min(8, 'El número de documento debe tener al menos 8 caracteres').max(20, 'El número de documento no puede tener más de 20 caracteres'),
    fechaNacimiento: z.string({
        invalid_type_error: 'La fecha de nacimiento debe ser texto'
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional().nullable(),
    telefono: z.string({
        invalid_type_error: 'El teléfono debe ser texto'
    }).max(15, 'El teléfono no puede tener más de 15 caracteres').optional().nullable(),
    email: z.string({
        invalid_type_error: 'El email debe ser texto'
    }).email('Email inválido').max(100, 'El email no puede tener más de 100 caracteres').optional().nullable(),
    direccion: z.string({
        invalid_type_error: 'La dirección debe ser texto'
    }).max(255, 'La dirección no puede tener más de 255 caracteres').optional().nullable(),
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