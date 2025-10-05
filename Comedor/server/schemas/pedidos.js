import z from 'zod'

const pedidoSchema = z.object({
    idProveedor: z.string({
        required_error: 'El ID del proveedor es requerido',
        invalid_type_error: 'El ID del proveedor debe ser un texto'
    }),
    idUsuarioCreador: z.string({
        required_error: 'El ID del usuario creador es requerido',
        invalid_type_error: 'El ID del usuario creador debe ser un texto'
    }),
    fechaEmision: z.string({
        required_error: 'La fecha de emisión es requerida',
        invalid_type_error: 'La fecha debe ser un texto en formato YYYY-MM-DD'
    }).regex(/^\d{4}-\d{2}-\d{2}$/),
    estado: z.enum(['Pendiente', 'Enviado', 'Recibido', 'Cancelado'], {
        invalid_type_error: 'Estado inválido'
    }).default('Pendiente')
})

export function validatePedido(input) {
    return pedidoSchema.safeParse(input)
}

export function validatePartialPedido(input) {
    return pedidoSchema.partial().safeParse(input)
}