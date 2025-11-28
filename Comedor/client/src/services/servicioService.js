import api from './api.js';

const servicioService = {
    // Obtener todos los servicios
    getAll: async () => {
        try {
            const response = await api.get('/servicios');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener un servicio por ID
    getById: async (id) => {
        const response = await api.get(`/servicios/${id}`);
        return response.data;
    },

    // Crear un nuevo servicio
    create: async (servicioData) => {
        const response = await api.post('/servicios', servicioData);
        return response.data;
    },

    // Actualizar un servicio
    update: async (id, servicioData) => {
        const response = await api.patch(`/servicios/${id}`, servicioData);
        return response.data;
    },

    // Eliminar un servicio
    delete: async (id) => {
        try {
            const response = await api.delete(`/servicios/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener servicios activos
    getActivos: async () => {
        const response = await api.get('/servicios/activos/list');
        return response.data;
    },

    // Cambiar estado de un servicio
    cambiarEstado: async (id, estado) => {
        const response = await api.patch(`/servicios/${id}/estado`, { estado });
        return response.data;
    }
};

export default servicioService;