import React from 'react'
import { usePermiso, usePermisosMultiples } from '../hooks/usePermisos'

/**
 * Componente que renderiza su contenido solo si el usuario tiene el permiso requerido
 * @param {string} modulo - Módulo requerido
 * @param {string} accion - Acción requerida
 * @param {React.ReactNode} children - Contenido a mostrar si tiene permiso
 * @param {React.ReactNode} fallback - Contenido a mostrar si no tiene permiso (opcional)
 */
export const ProtegidoPor = ({ modulo, accion, children, fallback = null }) => {
    const { tienePermiso, cargando } = usePermiso(modulo, accion)

    if (cargando) {
        return null
    }

    if (tienePermiso) {
        return children
    }

    return fallback
}

/**
 * Componente que renderiza su contenido solo si el usuario tiene alguno de los permisos requeridos
 * @param {Array<{modulo: string, accion: string}>} permisos - Permisos requeridos
 * @param {React.ReactNode} children - Contenido a mostrar si tiene algún permiso
 * @param {React.ReactNode} fallback - Contenido a mostrar si no tiene ningún permiso (opcional)
 */
export const ProtegidoPorAlguno = ({ permisos, children, fallback = null }) => {
    const { tieneAlgunPermiso, cargando } = usePermisosMultiples(permisos)

    if (cargando) {
        return null
    }

    if (tieneAlgunPermiso) {
        return children
    }

    return fallback
}

/**
 * Componente que renderiza su contenido solo si el usuario tiene TODOS los permisos requeridos
 * @param {Array<{modulo: string, accion: string}>} permisos - Permisos requeridos
 * @param {React.ReactNode} children - Contenido a mostrar si tiene todos los permisos
 * @param {React.ReactNode} fallback - Contenido a mostrar si no tiene todos los permisos (opcional)
 */
export const ProtegidoPorTodos = ({ permisos, children, fallback = null }) => {
    const { tieneTodos, cargando } = usePermisosMultiples(permisos)

    if (cargando) {
        return null
    }

    if (tieneTodos) {
        return children
    }

    return fallback
}

export default {
    ProtegidoPor,
    ProtegidoPorAlguno,
    ProtegidoPorTodos
}
