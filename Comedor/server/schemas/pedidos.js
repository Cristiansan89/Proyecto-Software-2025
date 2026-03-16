import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const detalleInsumoSchema = z.object({
    id_insumo: z.number({
        invalid_type_error: 'El ID del insumo debe ser un número'
    }),
    id_proveedor: z.string({
        invalid_type_error: 'El ID del proveedor debe ser un texto'
    }).regex(uuidRegex, 'El ID del proveedor debe ser un UUID válido'),
    cantidad: z.number({
        invalid_type_error: 'La cantidad debe ser un número'
    }).positive('La cantidad debe ser mayor a 0')
})

const pedidoSchema = z.object({
    id_proveedor: z.string({
        required_error: 'El ID del proveedor es requerido',
        invalid_type_error: 'El ID del proveedor debe ser un texto'
    }).regex(uuidRegex, 'El ID del proveedor debe ser un UUID válido'),
    id_usuario: z.string({
        required_error: 'El ID del usuario es requerido',
        invalid_type_error: 'El ID del usuario debe ser un texto'
    }).regex(uuidRegex, 'El ID del usuario debe ser un UUID válido'),
    fechaPedido: z.string({
        required_error: 'La fecha del pedido es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD'),
    fechaEntregaEsperada: z.string({
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD').optional().nullable(),
    observaciones: z.string({
        invalid_type_error: 'Las observaciones deben ser un texto'
    }).max(255, 'Las observaciones no pueden tener más de 255 caracteres').optional().nullable(),
    insumos: z.array(detalleInsumoSchema, {
        invalid_type_error: 'Los insumos debe ser un array'
    }).optional(),
    estado: z.enum(['Pendiente', 'Enviado', 'Recibido', 'Parcial', 'Cancelado'], {
        invalid_type_error: 'Estado inválido'
    }).default('Pendiente')
})

export function validatePedido(input) {
    return pedidoSchema.safeParse(input)
}

export function validatePartialPedido(input) {
    return pedidoSchema.partial().safeParse(input)
}