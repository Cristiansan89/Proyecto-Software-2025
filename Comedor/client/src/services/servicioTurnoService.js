import api from './api.js';

const servicioTurnoService = {
    // Obtener todas las relaciones servicio-turno
    getAll: async () => {
        const response = await api.get('/servicio-turnos');
        return response.data;
    },

    // Obtener turnos de un servicio específico
    getTurnosByServicio: async (idServicio) => {
        const response = await api.get(`/servicio-turnos/servicio/${idServicio}/turnos`);
        return response.data;
    },

    // Obtener servicios de un turno específico
    getServiciosByTurno: async (idTurno) => {
        const response = await api.get(`/servicio-turnos/turno/${idTurno}/servicios`);
        return response.data;
    },

    // Crear una relación servicio-turno
    create: async (servicioTurnoData) => {
        const response = await api.post('/servicio-turnos', servicioTurnoData);
        return response.data;
    },

    // Eliminar una relación servicio-turno específica
    delete: async (idServicio, idTurno) => {
        const response = await api.delete(`/servicio-turnos/servicio/${idServicio}/turno/${idTurno}`);
        return response.data;
    },

    // Eliminar todas las relaciones de un servicio
    deleteByServicio: async (idServicio) => {
        const response = await api.delete(`/servicio-turnos/servicio/${idServicio}`);
        return response.data;
    },

    // Eliminar todas las relaciones de un turno
    deleteByTurno: async (idTurno) => {
        const response = await api.delete(`/servicio-turnos/turno/${idTurno}`);
        return response.data;
    }
};

export default servicioTurnoService;