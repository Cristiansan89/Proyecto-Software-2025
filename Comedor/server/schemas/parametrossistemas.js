import z from 'zod'

const parametroSistemaSchema = z.object({
    clave: z.string({
        required_error: 'La clave es requerida',
        invalid_type_error: 'La clave debe ser un texto'
    }).min(1, 'La clave no puede estar vacía').max(50, 'La clave no puede tener más de 50 caracteres'),
    valor: z.string({
        required_error: 'El valor es requerido',
        invalid_type_error: 'El valor debe ser un texto'
    }).min(1, 'El valor no puede estar vacío').max(255, 'El valor no puede tener más de 255 caracteres'),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255, 'La descripción no puede tener más de 255 caracteres').optional().nullable(),
    tipo: z.enum(['Texto', 'Numero', 'Booleano', 'Fecha'], {
        invalid_type_error: 'Tipo inválido'
    }).default('Texto'),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateParametroSistema(input) {
    return parametroSistemaSchema.safeParse(input)
}

export function validatePartialParametroSistema(input) {
    return parametroSistemaSchema.partial().safeParse(input)
}