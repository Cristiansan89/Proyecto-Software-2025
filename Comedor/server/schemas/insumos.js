import z from 'zod'

const insumoSchema = z.object({
    nombreInsumo: z.string({
        required_error: 'El nombre del insumo es requerido',
        invalid_type_error: 'El nombre del insumo debe ser un texto'
    }).min(1, 'El nombre del insumo no puede estar vacío').max(100, 'El nombre del insumo no puede tener más de 100 caracteres'),
    unidadMedida: z.enum(['kg', 'g', 'litros', 'ml', 'unidades', 'paquetes', 'cajas', 'bolsas', 'latas', 'botellas'], {
        required_error: 'La unidad de medida es requerida',
        invalid_type_error: 'Unidad de medida inválida'
    }),
    descripcion: z.string({
        invalid_type_error: 'La descripción debe ser un texto'
    }).max(255, 'La descripción no puede tener más de 255 caracteres').optional().nullable(),
    categoria: z.enum(['Carnes', 'Lacteos', 'Cereales', 'Verduras', 'Condimentos', 'Otros'], {
        invalid_type_error: 'Categoría inválida'
    }).default('Otros'),
    stockMinimo: z.coerce.number({
        invalid_type_error: 'El stock mínimo debe ser un número'
    }).min(0, 'El stock mínimo no puede ser negativo').default(0),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo'),
    // Campos del inventario (opcionales para crear)
    cantidadActual: z.coerce.number({
        invalid_type_error: 'La cantidad actual debe ser un número'
    }).min(0, 'La cantidad actual no puede ser negativa').default(0).optional(),
    nivelMinimoAlerta: z.coerce.number({
        invalid_type_error: 'El nivel mínimo de alerta debe ser un número'
    }).min(0, 'El nivel mínimo de alerta no puede ser negativo').optional(),
    stockMaximo: z.coerce.number({
        invalid_type_error: 'El stock máximo debe ser un número'
    }).min(0, 'El stock máximo no puede ser negativo').default(999.999).optional()
})

export function validateInsumo(input) {
    return insumoSchema.safeParse(input)
}

export function validatePartialInsumo(input) {
    return insumoSchema.partial().safeParse(input)
}