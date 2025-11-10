import API from './api.js';

export const permisoService = {
    // Obtener todos los permisos
    async getAll() {
        try {
            console.log('permisoService: Obteniendo todos los permisos...');
            const response = await API.get('/permisos');
            console.log('permisoService: Permisos obtenidos:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al obtener permisos:', error);
            throw error;
        }
    },

    // Obtener permiso por ID
    async getById(id) {
        try {
            console.log('permisoService: Obteniendo permiso con ID:', id);
            const response = await API.get(`/permisos/${id}`);
            console.log('permisoService: Permiso obtenido:', response.data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            console.error(`permisoService: Error al obtener permiso ${id}:`, error);
            throw error;
        }
    },

    // Crear un nuevo permiso
    async create(permisoData) {
        try {
            console.log('permisoService: Creando permiso:', permisoData);
            const response = await API.post('/permisos', permisoData);
            console.log('permisoService: Permiso creado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al crear permiso:', error);
            throw error;
        }
    },

    // Actualizar un permiso
    async update(id, permisoData) {
        try {
            console.log('permisoService: Actualizando permiso ID:', id, 'con datos:', permisoData);
            const response = await API.put(`/permisos/${id}`, permisoData);
            console.log('permisoService: Permiso actualizado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al actualizar permiso:', error);
            throw error;
        }
    },

    // Eliminar un permiso
    async delete(id) {
        try {
            console.log('permisoService: Eliminando permiso ID:', id);
            const response = await API.delete(`/permisos/${id}`);
            console.log('permisoService: Permiso eliminado exitosamente');
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al eliminar permiso:', error);
            throw error;
        }
    },

    // Obtener permisos activos
    async getActivos() {
        try {
            console.log('permisoService: Obteniendo permisos activos...');
            const response = await API.get('/permisos/activos/list');
            console.log('permisoService: Permisos activos obtenidos:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al obtener permisos activos:', error);
            throw error;
        }
    },

    // Buscar permisos por texto
    async buscarPorTexto(texto) {
        try {
            console.log('permisoService: Buscando permisos con texto:', texto);
            const response = await API.get(`/permisos/search/by-texto?texto=${encodeURIComponent(texto)}`);
            console.log('permisoService: Permisos encontrados:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al buscar permisos:', error);
            throw error;
        }
    },

    // Obtener permisos por módulo
    async getByModulo(modulo) {
        try {
            console.log('permisoService: Obteniendo permisos del módulo:', modulo);
            const response = await API.get(`/permisos/modulo/${encodeURIComponent(modulo)}`);
            console.log('permisoService: Permisos del módulo obtenidos:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al obtener permisos por módulo:', error);
            throw error;
        }
    },

    // Cambiar estado de un permiso
    async cambiarEstado(id, estado) {
        try {
            console.log('permisoService: Cambiando estado del permiso ID:', id, 'a:', estado);
            const response = await API.patch(`/permisos/${id}/estado`, { estado });
            console.log('permisoService: Estado cambiado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('permisoService: Error al cambiar estado:', error);
            throw error;
        }
    }
};

export default permisoService;
