import z from 'zod'

const movimientoInventarioSchema = z.object({
    idInsumo: z.string({
        required_error: 'El ID del insumo es requerido',
        invalid_type_error: 'El ID del insumo debe ser un texto'
    }),
    idUsuario: z.string({
        required_error: 'El ID del usuario es requerido',
        invalid_type_error: 'El ID del usuario debe ser un texto'
    }),
    idConsumo: z.string({
        invalid_type_error: 'El ID del consumo debe ser un texto'
    }).nullable(),
    tipoMovimiento: z.enum(['Ingreso', 'Salida', 'Ajuste', 'Merma'], {
        required_error: 'El tipo de movimiento es requerido',
        invalid_type_error: 'Tipo de movimiento inválido'
    }),
    cantidad: z.number({
        required_error: 'La cantidad es requerida',
        invalid_type_error: 'La cantidad debe ser un número'
    }).positive(),
    comentario: z.string({
        invalid_type_error: 'El comentario debe ser un texto'
    }).max(255).nullable()
})

export function validateMovimientosInvetarios(input) {
    return movimientoInventarioSchema.safeParse(input)
}

export function validatePartialMovimientosInvetarios(input) {
    return movimientoInventarioSchema.partial().safeParse(input)
}