import API from './api.js';

const turnoService = {
    // Obtener todos los turnos
    getAll: async () => {
        console.log('TurnoService: Haciendo petición a /turnos');
        try {
            const response = await API.get('/turnos');
            console.log('TurnoService: Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('TurnoService: Error en getAll:', error);
            throw error;
        }
    },

    // Obtener un turno por ID
    getById: async (id) => {
        const response = await API.get(`/turnos/${id}`);
        return response.data;
    },

    // Crear un nuevo turno
    create: async (turnoData) => {
        const response = await API.post('/turnos', turnoData);
        return response.data;
    },

    // Actualizar un turno
    update: async (id, turnoData) => {
        const response = await API.patch(`/turnos/${id}`, turnoData);
        return response.data;
    },

    // Eliminar un turno
    delete: async (id) => {
        console.log('TurnoService: Eliminando turno con ID:', id);
        try {
            const response = await API.delete(`/turnos/${id}`);
            console.log('TurnoService: Respuesta de eliminación:', response.data);
            return response.data;
        } catch (error) {
            console.error('TurnoService: Error en delete:', error);
            console.error('TurnoService: Error response:', error.response?.data);
            throw error;
        }
    },

    // Obtener turnos activos
    getActivos: async () => {
        const response = await API.get('/turnos/activos/list');
        return response.data;
    },

    // Cambiar estado de un turno
    cambiarEstado: async (id, estado) => {
        const response = await API.patch(`/turnos/${id}/estado`, { estado });
        return response.data;
    }
};

export default turnoService;