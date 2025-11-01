import z from 'zod'

const servicioSchema = z.object({
    nombre: z.string({
        required_error: 'El nombre del servicio es requerido',
        invalid_type_error: 'El nombre del servicio debe ser un texto'
    }).min(1, 'El nombre del servicio no puede estar vacío').max(100, 'El nombre del servicio no puede tener más de 100 caracteres'),
    descripcion: z.string({
        required_error: 'La descripción es requerida',
        invalid_type_error: 'La descripción debe ser un texto'
    }).min(1, 'La descripción no puede estar vacía').max(100, 'La descripción no puede tener más de 100 caracteres'),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validateServicio(input) {
    return servicioSchema.safeParse(input)
}

export function validatePartialServicio(input) {
    return servicioSchema.partial().safeParse(input)
}