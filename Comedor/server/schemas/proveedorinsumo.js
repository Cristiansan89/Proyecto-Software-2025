import z from 'zod'

const proveedorInsumoSchema = z.object({
    idProveedor: z.string({
        invalid_type_error: 'El ID del proveedor debe ser un string',
        required_error: 'El ID del proveedor es requerido'
    }).uuid('El ID del proveedor debe ser un UUID válido'),

    idInsumo: z.string({
        invalid_type_error: 'El ID del insumo debe ser un string',
        required_error: 'El ID del insumo es requerido'
    }).uuid('El ID del insumo debe ser un UUID válido'),

    calificacion: z.enum(['Excelente', 'Aceptable', 'Poco Eficiente'], {
        invalid_type_error: 'La calificación debe ser: Excelente, Aceptable o Poco Eficiente',
        required_error: 'La calificación es requerida'
    })
})

export function validateProveedorInsumo(object) {
    return proveedorInsumoSchema.safeParse(object)
}

export function validatePartialProveedorInsumo(object) {
    return proveedorInsumoSchema.partial().safeParse(object)
}