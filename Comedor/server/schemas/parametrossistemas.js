import z from 'zod'

const parametroSistemaSchema = z.object({
    clave: z.string({
        required_error: 'La clave es requerida',
        invalid_type_error: 'La clave debe ser un texto'
    }).max(50),
    valor: z.string({
        required_error: 'El valor es requerido',
        invalid_type_error: 'El valor debe ser un texto'
    }).max(255),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255).nullable()
})

export function validateParametroSistema(input) {
    return parametroSistemaSchema.safeParse(input)
}

export function validatePartialParametroSistema(input) {
    return parametroSistemaSchema.partial().safeParse(input)
}