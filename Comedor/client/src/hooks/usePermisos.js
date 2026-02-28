import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { permisoService } from '../services/permisoService'

/**
 * Hook para verificar permisos del usuario autenticado
 * @param {string} modulo - Módulo requerido
 * @param {string} accion - Acción requerida
 * @returns {object} { tienePermiso: boolean, cargando: boolean, error: string | null }
 */
export const usePermiso = (modulo, accion) => {
    const { user } = useAuth()
    const [tienePermiso, setTienePermiso] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const verificarPermiso = async () => {
            try {
                setCargando(true)
                setError(null)

                if (!user) {
                    setTienePermiso(false)
                    return
                }

                const resultado = await permisoService.tienePermiso(user, modulo, accion)
                setTienePermiso(resultado)
            } catch (err) {
                console.error('Error al verificar permiso:', err)
                setError(err.message || 'Error al verificar permiso')
                setTienePermiso(false)
            } finally {
                setCargando(false)
            }
        }

        verificarPermiso()
    }, [user, modulo, accion])

    return { tienePermiso, cargando, error }
}

/**
 * Hook para obtener todos los permisos de un rol
 * @returns {object} { permisos: Array, cargando: boolean, error: string | null }
 */
export const usePermisosRol = () => {
    const { user } = useAuth()
    const [permisos, setPermisos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const obtenerPermisos = async () => {
            try {
                setCargando(true)
                setError(null)

                if (!user || !user.rol) {
                    setPermisos([])
                    return
                }

                const resultado = await permisoService.getPermisosByRolNombre(user.rol)
                setPermisos(resultado || [])
            } catch (err) {
                console.error('Error al obtener permisos:', err)
                setError(err.message || 'Error al obtener permisos')
                setPermisos([])
            } finally {
                setCargando(false)
            }
        }

        obtenerPermisos()
    }, [user])

    return { permisos, cargando, error }
}

/**
 * Hook para verificar múltiples permisos
 * @param {Array<{modulo: string, accion: string}>} permisosRequeridos - Permisos a verificar
 * @returns {object} { tieneAlgunPermiso: boolean, tieneTodos: boolean, cargando: boolean, error: string | null }
 */
export const usePermisosMultiples = (permisosRequeridos) => {
    const { user } = useAuth()
    const [tieneAlgunPermiso, setTieneAlgunPermiso] = useState(false)
    const [tieneTodos, setTieneTodos] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const verificarPermisos = async () => {
            try {
                setCargando(true)
                setError(null)

                if (!user || !permisosRequeridos || permisosRequeridos.length === 0) {
                    setTieneAlgunPermiso(false)
                    setTieneTodos(false)
                    return
                }

                const permisos = await permisoService.getPermisosByRolNombre(user.rol)
                
                // Verificar si tiene alguno
                const algunoValido = permisosRequeridos.some(
                    pr => permisos.some(p => p.modulo === pr.modulo && p.accion === pr.accion)
                )
                setTieneAlgunPermiso(algunoValido)

                // Verificar si tiene todos
                const todosValidos = permisosRequeridos.every(
                    pr => permisos.some(p => p.modulo === pr.modulo && p.accion === pr.accion)
                )
                setTieneTodos(todosValidos)
            } catch (err) {
                console.error('Error al verificar permisos:', err)
                setError(err.message || 'Error al verificar permisos')
                setTieneAlgunPermiso(false)
                setTieneTodos(false)
            } finally {
                setCargando(false)
            }
        }

        verificarPermisos()
    }, [user, permisosRequeridos])

    return { tieneAlgunPermiso, tieneTodos, cargando, error }
}

export default {
    usePermiso,
    usePermisosRol,
    usePermisosMultiples
}
