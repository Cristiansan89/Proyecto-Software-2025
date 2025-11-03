import z from 'zod'

const permisoSchema = z.object({
    nombrePermiso: z.string({
        required_error: 'El nombre del permiso es requerido',
        invalid_type_error: 'El nombre del permiso debe ser un texto'
    }).min(1, 'El nombre del permiso no puede estar vacío').max(100, 'El nombre del permiso no puede tener más de 100 caracteres'),
    descripcionPermiso: z.string({
        required_error: 'La descripción del permiso es requerida',
        invalid_type_error: 'La descripción del permiso debe ser un texto'
    }).min(1, 'La descripción del permiso no puede estar vacía').max(100, 'La descripción del permiso no puede tener más de 100 caracteres'),
    modulo: z.enum([
        'Sin Módulo', 'Asistencias', 'Auditoria', 'Consumos', 'Insumos', 'Inventarios',
        'Parámetros', 'Pedidos', 'Permisos', 'Personas', 'Planificación de Menús',
        'Proveedores', 'Recetas', 'Reportes', 'Roles', 'Seguridad', 'Turnos', 'Usuarios'
    ], {
        required_error: 'El módulo es requerido',
        invalid_type_error: 'Módulo inválido'
    }),
    accion: z.enum([
        'Sin Acción', 'Registrar', 'Modificar', 'Eliminar', 'Buscar', 'Consultar', 'Exportar'
    ], {
        required_error: 'La acción es requerida',
        invalid_type_error: 'Acción inválida'
    }),
    estado: z.enum(['Activo', 'Inactivo'], {
        invalid_type_error: 'Estado inválido'
    }).default('Activo')
})

export function validatePermiso(input) {
    return permisoSchema.safeParse(input)
}

export function validatePartialPermiso(input) {
    return permisoSchema.partial().safeParse(input)
}