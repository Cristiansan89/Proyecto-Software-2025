import api from './api.js';

const servicioService = {
    // Obtener todos los servicios
    getAll: async () => {
        console.log('ServicioService: Haciendo petición a /servicios');
        try {
            const response = await api.get('/servicios');
            console.log('ServicioService: Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('ServicioService: Error en getAll:', error);
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
        console.log('ServicioService: Eliminando servicio con ID:', id);
        try {
            const response = await api.delete(`/servicios/${id}`);
            console.log('ServicioService: Respuesta de eliminación:', response.data);
            return response.data;
        } catch (error) {
            console.error('ServicioService: Error en delete:', error);
            console.error('ServicioService: Error response:', error.response?.data);
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