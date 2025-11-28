import api from './api.js';

export const rolPermisoService = {
    // Obtener todas las asignaciones rol-permiso
    async getAll() {
        try {
            const response = await api.get('/rol-permisos');
            const asignaciones = response.data;
            return asignaciones;
        } catch (error) {
            throw error;
        }
    },

    // Obtener permisos de un rol específico
    async getPermisosByRol(idRol) {
        try {
            const response = await api.get(`/rol-permisos/rol/${idRol}/permisos`);
            const permisos = response.data;
            return permisos;
        } catch (error) {
            throw error;
        }
    },

    // Obtener roles con todos sus permisos
    async getRolesWithPermisos() {
        try {
            const response = await api.get('/rol-permisos/roles-with-permisos');
            const rolesConPermisos = response.data;
            return rolesConPermisos;
        } catch (error) {
            throw error;
        }
    },

    // Asignar permisos a un rol
    async asignarPermisos(idRol, idsPermisos) {
        try {
            const response = await api.post(`/rol-permisos/rol/${idRol}/asignar-permisos`, {
                permisos: idsPermisos
            });
            const resultado = response.data;
            return resultado;
        } catch (error) {
            throw error;
        }
    },

    // Remover permiso específico de un rol
    async removerPermiso(idRol, idPermiso) {
        try {
            await api.delete(`/rol-permisos/rol/${idRol}/permiso/${idPermiso}`);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Limpiar todos los permisos de un rol
    async limpiarPermisosRol(idRol) {
        try {
            // Obtenemos los permisos actuales del rol primero
            const permisosActuales = await this.getPermisosByRol(idRol);
            
            // Removemos cada permiso individualmente
            for (const permiso of permisosActuales) {
                await this.removerPermiso(idRol, permiso.id_permiso);
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Obtener estadísticas básicas
    async getEstadisticas() {
        try {
            const rolesConPermisos = await this.getRolesWithPermisos();
            
            const estadisticas = {
                totalRoles: rolesConPermisos.length,
                totalAsignaciones: rolesConPermisos.reduce((total, rol) => total + (rol.permisos?.length || 0), 0),
                rolesConPermisos: rolesConPermisos.filter(rol => rol.permisos && rol.permisos.length > 0).length,
                rolesSinPermisos: rolesConPermisos.filter(rol => !rol.permisos || rol.permisos.length === 0).length
            };
            
            return estadisticas;
        } catch (error) {
            throw error;
        }
    },

    // Verificar si un rol tiene un permiso específico
    async verificarPermiso(idRol, idPermiso) {
        try {
            const permisos = await this.getPermisosByRol(idRol);
            const tienePermiso = permisos.some(permiso => permiso.id_permiso === idPermiso);
            
            return tienePermiso;
        } catch (error) {
            return false;
        }
    }
};