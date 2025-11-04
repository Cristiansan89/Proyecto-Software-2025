import { z } from 'zod'

const motivosReemplazo = [
    'Licencia Médica',
    'Licencia por Maternidad',
    'Licencia Anual',
    'Cambio Funciones',
    'Renuncia',
    'Jubilación',
    'Ausencia Prolongada'
]

const estadosReemplazo = ['Activo', 'Finalizado', 'Programado']

const reemplazoDocenteSchema = z.object({
    idPersona: z.number({
        invalid_type_error: 'ID de persona debe ser un número',
        required_error: 'ID de persona (suplente) es requerido',
    }).positive('ID de persona debe ser positivo'),

    idDocenteTitular: z.number({
        invalid_type_error: 'ID del docente titular debe ser un número',
        required_error: 'ID del docente titular es requerido',
    }).positive('ID del docente titular debe ser positivo'),

    nombreGrado: z.string({
        invalid_type_error: 'Nombre del grado debe ser texto',
        required_error: 'Nombre del grado es requerido',
    }).min(1, 'Nombre del grado no puede estar vacío').max(100, 'Nombre del grado es muy largo'),

    cicloLectivo: z.union([
        z.string().regex(/^\d{4}$/, 'El ciclo lectivo debe ser un año de 4 dígitos'),
        z.number().int().min(2020).max(2030)
    ]).optional(),

    fechaInicio: z.string({
        required_error: 'Fecha de inicio es requerida',
    }).regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de inicio debe tener formato YYYY-MM-DD'),

    fechaFin: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de fin debe tener formato YYYY-MM-DD')
        .optional()
        .nullable(),

    motivo: z.enum(motivosReemplazo, {
        required_error: 'Motivo del reemplazo es requerido',
        invalid_type_error: 'Motivo inválido',
    }),

    estado: z.enum(estadosReemplazo, {
        invalid_type_error: 'Estado inválido',
    }).optional(),
})

const reemplazoDocenteUpdateSchema = z.object({
    idPersona: z.number().positive().optional(),
    fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    motivo: z.enum(motivosReemplazo).optional(),
    estado: z.enum(estadosReemplazo).optional(),
})

// Validación adicional para fechas
const fechaValidationSchema = z.object({
    fechaInicio: z.string(),
    fechaFin: z.string().optional().nullable(),
}).refine((data) => {
    if (data.fechaFin) {
        const inicio = new Date(data.fechaInicio)
        const fin = new Date(data.fechaFin)
        return fin >= inicio
    }
    return true
}, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin']
})

export function validateReemplazoDocente(input) {
    // Primero validar el schema básico
    const basicValidation = reemplazoDocenteSchema.safeParse(input)
    if (!basicValidation.success) {
        return basicValidation
    }

    // Luego validar las fechas si están presentes
    if (input.fechaInicio) {
        const fechaValidation = fechaValidationSchema.safeParse({
            fechaInicio: input.fechaInicio,
            fechaFin: input.fechaFin
        })
        if (!fechaValidation.success) {
            return fechaValidation
        }
    }

    return basicValidation
}

export function validatePartialReemplazoDocente(input) {
    const basicValidation = reemplazoDocenteUpdateSchema.safeParse(input)
    if (!basicValidation.success) {
        return basicValidation
    }

    // Validar fechas si están presentes
    if (input.fechaInicio || input.fechaFin) {
        const fechaValidation = fechaValidationSchema.safeParse({
            fechaInicio: input.fechaInicio || '2025-01-01', // fecha dummy si no está presente
            fechaFin: input.fechaFin
        })
        if (!fechaValidation.success && input.fechaInicio) {
            return fechaValidation
        }
    }

    return basicValidation
}

export { motivosReemplazo, estadosReemplazo }