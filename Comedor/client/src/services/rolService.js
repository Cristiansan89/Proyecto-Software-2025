import api from './api.js';

export const rolService = {
    // Obtener todos los roles
    async getAll() {
        try {
            const response = await api.get('/roles');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener rol por ID
    async getById(id) {
        try {
            const response = await api.get(`/roles/${id}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },

    // Crear un nuevo rol
    async create(rolData) {
        try {
            const response = await api.post('/roles', rolData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar un rol
    async update(id, rolData) {
        try {
            const response = await api.patch(`/roles/${id}`, rolData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar un rol
    async delete(id) {
        try {
            const response = await api.delete(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener roles activos
    async getActivos() {
        try {
            const response = await api.get('/roles/activos/list');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cambiar estado de un rol
    async cambiarEstado(id, estado) {
        try {
            const response = await api.patch(`/roles/${id}/estado`, { estado });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default rolService;
