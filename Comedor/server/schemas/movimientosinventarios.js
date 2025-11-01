import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const movimientoInventarioSchema = z.object({
    id_insumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }).regex(uuidRegex, 'El ID del insumo debe ser un UUID válido'),
    id_usuario: z.string({
        required_error: 'El ID del usuario es requerido',
        invalid_type_error: 'El ID del usuario debe ser un texto'
    }).regex(uuidRegex, 'El ID del usuario debe ser un UUID válido'),
    id_pedido: z.string({
        invalid_type_error: 'El ID del pedido debe ser un texto'
    }).regex(uuidRegex, 'El ID del pedido debe ser un UUID válido').optional().nullable(),
    tipoMovimiento: z.enum(['Entrada', 'Salida', 'Ajuste', 'Merma'], {
        required_error: 'El tipo de movimiento es requerido',
        invalid_type_error: 'Tipo de movimiento inválido'
    }),
    cantidad: z.number({
        required_error: 'La cantidad es requerida',
        invalid_type_error: 'La cantidad debe ser un número'
    }).positive('La cantidad debe ser positiva'),
    observaciones: z.string({
        invalid_type_error: 'Las observaciones deben ser un texto'
    }).max(255, 'Las observaciones no pueden tener más de 255 caracteres').optional().nullable()
})

export function validateMovimientosInvetarios(input) {
    return movimientoInventarioSchema.safeParse(input)
}

export function validatePartialMovimientosInvetarios(input) {
    return movimientoInventarioSchema.partial().safeParse(input)
}