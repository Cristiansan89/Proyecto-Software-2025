import api from './api.js';

const insumoService = {
    // Obtener todos los insumos
    getAll: async () => {
        try {
            const response = await api.get('/insumos');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener un insumo por ID
    getById: async (id) => {
        const response = await api.get(`/insumos/${id}`);
        return response.data;
    },

    // Crear un nuevo insumo
    create: async (insumoData) => {
        try {
            const response = await api.post('/insumos', insumoData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar un insumo
    update: async (id, insumoData) => {
        try {
            const response = await api.patch(`/insumos/${id}`, insumoData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar un insumo
    delete: async (id) => {
        try {
            const response = await api.delete(`/insumos/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener insumos por categoría
    getByCategoria: async (categoria) => {
        const response = await api.get(`/insumos/categoria/${categoria}`);
        return response.data;
    },

    // Obtener insumos con stock bajo
    getBajoStock: async () => {
        const response = await api.get('/insumos/bajo-stock');
        return response.data;
    },

    // Actualizar stock de un insumo
    updateStock: async (id, cantidad) => {
        const response = await api.patch(`/insumos/${id}/stock`, { cantidad });
        return response.data;
    },

    // Cambiar estado de un insumo
    cambiarEstado: async (id, estado) => {
        const response = await api.patch(`/insumos/${id}/estado`, { estado });
        return response.data;
    }
};

export default insumoService;