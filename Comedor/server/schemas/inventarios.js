import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const inventarioSchema = z.object({
    id_insumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }).regex(uuidRegex, 'El ID del insumo debe ser un UUID válido'),
    cantidadActual: z.number({
        required_error: 'La cantidad actual es requerida',
        invalid_type_error: 'La cantidad actual debe ser un número'
    }).min(0, 'La cantidad actual no puede ser negativa'),
    cantidadMinima: z.number({
        required_error: 'La cantidad mínima es requerida',
        invalid_type_error: 'La cantidad mínima debe ser un número'
    }).min(0, 'La cantidad mínima no puede ser negativa'),
    cantidadMaxima: z.number({
        invalid_type_error: 'La cantidad máxima debe ser un número'
    }).min(0, 'La cantidad máxima no puede ser negativa').optional().nullable(),
    ubicacion: z.string({
        invalid_type_error: 'La ubicación debe ser un texto'
    }).max(100, 'La ubicación no puede tener más de 100 caracteres').optional().nullable(),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateInventario(input) {
    return inventarioSchema.safeParse(input)
}

export function validatePartialInventario(input) {
    return inventarioSchema.partial().safeParse(input)
}