import api from './api.js';

export const usuarioService = {
    // Obtener todos los usuarios
    async getAll() {
        try {
            const response = await api.get('/usuarios');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener usuario por ID
    async getById(id) {
        try {
            const response = await api.get(`/usuarios/${id}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },

    // Crear un nuevo usuario
    async create(usuarioData) {
        try {
            const response = await api.post('/usuarios', usuarioData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar un usuario
    async update(id, usuarioData) {
        try {
            const response = await api.patch(`/usuarios/${id}`, usuarioData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar un usuario
    async delete(id) {
        try {
            const response = await api.delete(`/usuarios/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cambiar estado de un usuario
    async cambiarEstado(id, estado) {
        try {
            const response = await api.patch(`/usuarios/${id}/estado`, { estado });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default usuarioService;
