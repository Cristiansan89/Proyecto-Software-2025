import api from './api.js';

const docenteGradoService = {
    // Obtener todas las asignaciones de docentes a grados
    async getAll() {
        try {
            const response = await api.get('/docente-grados');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener asignación específica por clave compuesta
    async getById(idDocenteTitular, idPersona, nombreGrado) {
        try {
            const response = await api.get(`/docente-grados/${idDocenteTitular}/${idPersona}/${nombreGrado}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener docentes por grado
    async getByGrado(nombreGrado) {
        try {
            const response = await api.get(`/docente-grados/grado/${nombreGrado}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener docentes disponibles para asignar
    async getDocentesDisponibles(cicloLectivo = new Date().getFullYear()) {
        try {
            const response = await api.get(`/docente-grados/docentes-disponibles?cicloLectivo=${cicloLectivo}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener grados disponibles (sin docente asignado)
    async getGradosDisponibles(cicloLectivo = new Date().getFullYear()) {
        try {
            const response = await api.get(`/docente-grados/grados-disponibles?cicloLectivo=${cicloLectivo}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Crear nueva asignación
    async create(data) {
        try {
            const response = await api.post('/docente-grados', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar asignación existente
    async update(idDocenteTitular, idPersona, nombreGrado, data) {
        try {
            const response = await api.put(`/docente-grados/${idDocenteTitular}/${idPersona}/${nombreGrado}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar asignación
    async delete(idDocenteTitular, idPersona, nombreGrado) {
        try {
            const response = await api.delete(`/docente-grados/${idDocenteTitular}/${idPersona}/${nombreGrado}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default docenteGradoService;