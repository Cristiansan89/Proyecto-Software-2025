import api from './api.js';

export const permisoService = {
    // Obtener todos los permisos
    async getAll() {
        try {
            const response = await api.get('/permisos');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener permiso por ID
    async getById(id) {
        try {
            const response = await api.get(`/permisos/${id}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },

    // Crear un nuevo permiso
    async create(permisoData) {
        try {
            const response = await api.post('/permisos', permisoData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar un permiso
    async update(id, permisoData) {
        try {
            const response = await api.patch(`/permisos/${id}`, permisoData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar un permiso
    async delete(id) {
        try {
            const response = await api.delete(`/permisos/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener permisos activos
    async getActivos() {
        try {
            const response = await api.get('/permisos/activos/list');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Buscar permisos por texto
    async buscarPorTexto(texto) {
        try {
            const response = await api.get(`/permisos/search/by-texto?texto=${encodeURIComponent(texto)}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener permisos por módulo
    async getByModulo(modulo) {
        try {
            const response = await api.get(`/permisos/modulo/${encodeURIComponent(modulo)}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cambiar estado de un permiso
    async cambiarEstado(id, estado) {
        try {
            const response = await api.patch(`/permisos/${id}/estado`, { estado });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default permisoService;
