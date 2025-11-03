const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const rolPermisoService = {
    // Obtener todas las asignaciones rol-permiso
    async getAll() {
        try {
            console.log('rolPermisoService: Obteniendo todas las asignaciones...');
            const response = await fetch(`${API_BASE_URL}/rol-permisos`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const asignaciones = await response.json();
            console.log('rolPermisoService: Asignaciones obtenidas:', asignaciones.length);
            return asignaciones;
        } catch (error) {
            console.error('rolPermisoService: Error al obtener asignaciones:', error);
            throw error;
        }
    },

    // Obtener permisos de un rol específico
    async getPermisosByRol(idRol) {
        try {
            console.log('rolPermisoService: Obteniendo permisos del rol ID:', idRol);
            const response = await fetch(`${API_BASE_URL}/rol-permisos/rol/${idRol}/permisos`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const permisos = await response.json();
            console.log('rolPermisoService: Permisos del rol obtenidos:', permisos.length);
            return permisos;
        } catch (error) {
            console.error('rolPermisoService: Error al obtener permisos del rol:', error);
            throw error;
        }
    },

    // Obtener roles con todos sus permisos
    async getRolesWithPermisos() {
        try {
            console.log('rolPermisoService: Obteniendo roles con permisos...');
            const response = await fetch(`${API_BASE_URL}/rol-permisos/roles-with-permisos`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const rolesConPermisos = await response.json();
            console.log('rolPermisoService: Roles con permisos obtenidos:', rolesConPermisos.length);
            return rolesConPermisos;
        } catch (error) {
            console.error('rolPermisoService: Error al obtener roles con permisos:', error);
            throw error;
        }
    },

    // Asignar permisos a un rol
    async asignarPermisos(idRol, idsPermisos) {
        try {
            console.log('rolPermisoService: Asignando permisos al rol:', { idRol, idsPermisos });
            const response = await fetch(`${API_BASE_URL}/rol-permisos/rol/${idRol}/asignar-permisos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permisos: idsPermisos
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const resultado = await response.json();
            console.log('rolPermisoService: Permisos asignados exitosamente:', resultado);
            return resultado;
        } catch (error) {
            console.error('rolPermisoService: Error al asignar permisos:', error);
            throw error;
        }
    },

    // Remover permiso específico de un rol
    async removerPermiso(idRol, idPermiso) {
        try {
            console.log('rolPermisoService: Removiendo permiso', idPermiso, 'del rol', idRol);
            const response = await fetch(`${API_BASE_URL}/rol-permisos/rol/${idRol}/permiso/${idPermiso}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            console.log('rolPermisoService: Permiso removido exitosamente');
            return true;
        } catch (error) {
            console.error('rolPermisoService: Error al remover permiso:', error);
            throw error;
        }
    },

    // Limpiar todos los permisos de un rol
    async limpiarPermisosRol(idRol) {
        try {
            console.log('rolPermisoService: Limpiando permisos del rol ID:', idRol);
            // Obtenemos los permisos actuales del rol primero
            const permisosActuales = await this.getPermisosByRol(idRol);

            // Removemos cada permiso individualmente
            for (const permiso of permisosActuales) {
                await this.removerPermiso(idRol, permiso.id_permiso);
            }

            console.log('rolPermisoService: Permisos del rol limpiados exitosamente');
            return true;
        } catch (error) {
            console.error('rolPermisoService: Error al limpiar permisos del rol:', error);
            throw error;
        }
    },

    // Obtener estadísticas básicas (usando datos existentes)
    async getEstadisticas() {
        try {
            console.log('rolPermisoService: Calculando estadísticas...');
            const rolesConPermisos = await this.getRolesConPermisos();

            const estadisticas = {
                totalRoles: rolesConPermisos.length,
                totalAsignaciones: rolesConPermisos.reduce((total, rol) => total + (rol.permisos?.length || 0), 0),
                rolesConPermisos: rolesConPermisos.filter(rol => rol.permisos && rol.permisos.length > 0).length,
                rolesSinPermisos: rolesConPermisos.filter(rol => !rol.permisos || rol.permisos.length === 0).length
            };

            console.log('rolPermisoService: Estadísticas calculadas:', estadisticas);
            return estadisticas;
        } catch (error) {
            console.error('rolPermisoService: Error al calcular estadísticas:', error);
            throw error;
        }
    },

    // Verificar si un rol tiene un permiso específico
    async verificarPermiso(idRol, idPermiso) {
        try {
            console.log('rolPermisoService: Verificando permiso', idPermiso, 'en rol', idRol);
            const permisos = await this.getPermisosByRol(idRol);
            const tienePermiso = permisos.some(permiso => permiso.id_permiso === idPermiso);

            console.log('rolPermisoService: Verificación completada:', tienePermiso);
            return tienePermiso;
        } catch (error) {
            console.error('rolPermisoService: Error al verificar permiso:', error);
            return false;
        }
    }
};