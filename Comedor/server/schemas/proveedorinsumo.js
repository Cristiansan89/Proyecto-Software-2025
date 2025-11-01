import z from 'zod'

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const proveedorInsumoSchema = z.object({
    id_proveedor: z.string({
        invalid_type_error: 'El ID del proveedor debe ser un string',
        required_error: 'El ID del proveedor es requerido'
    }).regex(uuidRegex, 'El ID del proveedor debe ser un UUID válido'),

    id_insumo: z.string({
        invalid_type_error: 'El ID del insumo debe ser un string',
        required_error: 'El ID del insumo es requerido'
    }).regex(uuidRegex, 'El ID del insumo debe ser un UUID válido'),

    precioUnitario: z.number({
        required_error: 'El precio unitario es requerido',
        invalid_type_error: 'El precio unitario debe ser un número'
    }).positive('El precio unitario debe ser positivo'),

    tiempoEntrega: z.number({
        invalid_type_error: 'El tiempo de entrega debe ser un número'
    }).int().min(1, 'El tiempo de entrega debe ser al menos 1 día').optional().nullable(),

    calificacion: z.enum(['Excelente', 'Bueno', 'Regular', 'Malo'], {
        invalid_type_error: 'La calificación debe ser: Excelente, Bueno, Regular o Malo'
    }).optional().nullable(),

    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateProveedorInsumo(object) {
    return proveedorInsumoSchema.safeParse(object)
}

export function validatePartialProveedorInsumo(object) {
    return proveedorInsumoSchema.partial().safeParse(object)
}