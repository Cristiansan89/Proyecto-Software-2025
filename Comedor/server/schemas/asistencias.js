import z from 'zod'

const asistenciaSchema = z.object({
    idServicio: z.number().int().positive({
        message: 'El ID del servicio debe ser un número entero positivo'
    }),
    idAlumnoGrado: z.number().int().positive({
        message: 'El ID del alumno grado debe ser un número entero positivo'
    }),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha debe estar en formato YYYY-MM-DD'
    }),
    estado: z.enum(['Si', 'No', 'Ausente'], {
        message: 'El estado debe ser "Si", "No" o "Ausente"'
    }).default('No')
})

export function validateAsistencia(object) {
    return asistenciaSchema.safeParse(object)
}

export function validatePartialAsistencia(object) {
    return asistenciaSchema.partial().safeParse(object)
}

// Schema para validar el registro masivo de asistencias
const registroAsistenciasSchema = z.object({
    asistencias: z.array(z.object({
        idAlumnoGrado: z.number().int().positive({
            message: 'El ID del alumno grado debe ser un número entero positivo'
        }),
        estado: z.enum(['Si', 'No', 'Ausente'], {
            message: 'El estado debe ser "Si", "No" o "Ausente"'
        })
    })).min(1, {
        message: 'Debe incluir al menos una asistencia'
    })
})

export function validateRegistroAsistencias(object) {
    return registroAsistenciasSchema.safeParse(object)
}

// Schema para validar la generación de tokens
const tokenDocenteSchema = z.object({
    idPersonaDocente: z.number().int().positive({
        message: 'El ID de la persona docente debe ser un número entero positivo'
    }),
    nombreGrado: z.string().min(1, {
        message: 'El nombre del grado es requerido'
    }),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La fecha debe estar en formato YYYY-MM-DD'
    }),
    idServicio: z.number().int().positive({
        message: 'El ID del servicio debe ser un número entero positivo'
    })
})

export function validateTokenDocente(object) {
    return tokenDocenteSchema.safeParse(object)
}