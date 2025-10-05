import z from 'zod'

const lineaPedidoSchema = z.object({
    idPedido: z.string({
        required_error: 'El ID del pedido es requerido',
        invalid_type_error: 'El ID del pedido debe ser un texto'
    }),
    idInsumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }),
    cantidadSolicitada: z.number({
        required_error: 'La cantidad solicitada es requerida',
        invalid_type_error: 'La cantidad solicitada debe ser un número'
    }).positive(),
    cantidadRecibida: z.number({
        invalid_type_error: 'La cantidad recibida debe ser un número'
    }).positive().nullable()
})

export function validateLineaPedido(input) {
    return lineaPedidoSchema.safeParse(input)
}

export function validatePartialLineaPedido(input) {
    return lineaPedidoSchema.partial().safeParse(input)
}