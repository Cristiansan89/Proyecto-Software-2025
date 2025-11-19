import api from './api.js';

const alumnoGradoService = {
    // Obtener todas las asignaciones de alumnos a grados
    async getAll() {
        try {
            const response = await api.get('/alumno-grados');
            return response.data;
        } catch (error) {
            console.error('Error al obtener asignaciones alumno-grado:', error);
            throw error;
        }
    },

    // Obtener asignación específica por ID
    async getById(id) {
        try {
            const response = await api.get(`/alumno-grados/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener asignación:', error);
            throw error;
        }
    },

    // Obtener alumnos por grado
    async getByGrado(nombreGrado) {
        try {
            const response = await api.get(`/alumno-grados/grado/${nombreGrado}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener alumnos por grado:', error);
            throw error;
        }
    },

    // Obtener alumnos disponibles para asignar
    async getAlumnosDisponibles(cicloLectivo = new Date().getFullYear()) {
        try {
            const response = await api.get(`/alumno-grados/disponibles?cicloLectivo=${cicloLectivo}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener alumnos disponibles:', error);
            throw error;
        }
    },

    // Crear nueva asignación
    async create(data) {
        try {
            const response = await api.post('/alumno-grados', data);
            return response.data;
        } catch (error) {
            console.error('Error al crear asignación alumno-grado:', error);
            throw error;
        }
    },

    // Actualizar asignación existente
    async update(id, data) {
        try {
            const response = await api.put(`/alumno-grados/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar asignación:', error);
            throw error;
        }
    },

    // Eliminar asignación
    async delete(id) {
        try {
            const response = await api.delete(`/alumno-grados/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar asignación:', error);
            throw error;
        }
    }
};

export default alumnoGradoService;