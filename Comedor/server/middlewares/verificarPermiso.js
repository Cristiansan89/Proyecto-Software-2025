import { connection } from '../models/db.js'

/**
 * Middleware para verificar si un usuario tiene el permiso requerido
 * @param {string} modulo - El módulo requerido (ej: 'Usuarios', 'Roles', 'Permisos')
 * @param {string} accion - La acción requerida (ej: 'Registrar', 'Modificar', 'Eliminar')
 */
export const verificarPermiso = (modulo, accion) => {
    return async (req, res, next) => {
        try {
            // Obtener usuario del JWT
            const usuario = req.user
            
            if (!usuario) {
                return res.status(401).json({
                    message: 'No autenticado'
                })
            }

            // Obtener el rol del usuario desde el JWT
            const nombreRol = usuario.rol
            
            if (!nombreRol) {
                return res.status(403).json({
                    message: 'Usuario sin rol asignado'
                })
            }

            // Consultar si el rol tiene el permiso específico
            const [resultado] = await connection.query(
                `SELECT COUNT(*) as count
                 FROM RolesPermisos rp
                 INNER JOIN Roles r ON rp.id_rol = r.id_rol
                 INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                 WHERE r.nombreRol = ? AND p.modulo = ? AND p.accion = ? AND p.estado = 'Activo'`,
                [nombreRol, modulo, accion]
            )

            const tienePermiso = resultado[0].count > 0

            if (!tienePermiso) {
                console.warn(`⚠️ Acceso denegado - Usuario: ${usuario.nombreUsuario}, Rol: ${nombreRol}, Permiso requerido: ${modulo}/${accion}`)
                return res.status(403).json({
                    message: `No tiene permisos para ${accion} en ${modulo}`,
                    required: { modulo, accion },
                    userRole: nombreRol
                })
            }

            // Permisos validado, continuar
            next()

        } catch (error) {
            console.error('Error al verificar permiso:', error)
            res.status(500).json({
                message: 'Error al validar permisos'
            })
        }
    }
}

/**
 * Middleware para verificar múltiples permisos (cualquiera de ellos)
 * @param {Array<{modulo: string, accion: string}>} permisos - Array de permisos requeridos
 */
export const verificarAlgunoPermiso = (permisos) => {
    return async (req, res, next) => {
        try {
            const usuario = req.user
            
            if (!usuario) {
                return res.status(401).json({
                    message: 'No autenticado'
                })
            }

            const nombreRol = usuario.rol
            
            if (!nombreRol) {
                return res.status(403).json({
                    message: 'Usuario sin rol asignado'
                })
            }

            // Verificar si tiene al menos uno de los permisos
            let tieneAlgunPermiso = false

            for (const permiso of permisos) {
                const [resultado] = await connection.query(
                    `SELECT COUNT(*) as count
                     FROM RolesPermisos rp
                     INNER JOIN Roles r ON rp.id_rol = r.id_rol
                     INNER JOIN Permisos p ON rp.id_permiso = p.id_permiso
                     WHERE r.nombreRol = ? AND p.modulo = ? AND p.accion = ? AND p.estado = 'Activo'`,
                    [nombreRol, permiso.modulo, permiso.accion]
                )

                if (resultado[0].count > 0) {
                    tieneAlgunPermiso = true
                    break
                }
            }

            if (!tieneAlgunPermiso) {
                console.warn(`⚠️ Acceso denegado - Usuario: ${usuario.nombreUsuario}, Rol: ${nombreRol}`)
                return res.status(403).json({
                    message: 'No tiene los permisos necesarios',
                    requiredPermissions: permisos
                })
            }

            next()

        } catch (error) {
            console.error('Error al verificar permisos:', error)
            res.status(500).json({
                message: 'Error al validar permisos'
            })
        }
    }
}
