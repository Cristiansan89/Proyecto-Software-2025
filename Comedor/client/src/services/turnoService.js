import api from './api.js';

const turnoService = {
    // Obtener todos los turnos
    getAll: async () => {
        try {
            const response = await api.get('/turnos');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener un turno por ID
    getById: async (id) => {
        const response = await api.get(`/turnos/${id}`);
        return response.data;
    },

    // Crear un nuevo turno
    create: async (turnoData) => {
        const response = await api.post('/turnos', turnoData);
        return response.data;
    },

    // Actualizar un turno
    update: async (id, turnoData) => {
        const response = await api.patch(`/turnos/${id}`, turnoData);
        return response.data;
    },

    // Eliminar un turno
    delete: async (id) => {
        try {
            const response = await api.delete(`/turnos/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener turnos activos
    getActivos: async () => {
        const response = await api.get('/turnos/activos/list');
        return response.data;
    },

    // Cambiar estado de un turno
    cambiarEstado: async (id, estado) => {
        const response = await api.patch(`/turnos/${id}/estado`, { estado });
        return response.data;
    }
};

export default turnoService;