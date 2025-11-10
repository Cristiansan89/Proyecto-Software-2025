import API from './api.js';

const reemplazoDocenteService = {
    // Obtener todos los reemplazos
    async getAll() {
        try {
            const response = await API.get('/reemplazo-docentes');
            return response.data;
        } catch (error) {
            console.error('Error al obtener reemplazos:', error);
            throw error;
        }
    },

    // Obtener reemplazo específico por ID
    async getById(id) {
        try {
            const response = await API.get(`/reemplazo-docentes/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener reemplazo:', error);
            throw error;
        }
    },

    // Obtener reemplazos por grado
    async getByGrado(nombreGrado) {
        try {
            const response = await API.get(`/reemplazo-docentes/grado/${nombreGrado}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener reemplazos por grado:', error);
            throw error;
        }
    },

    // Obtener docentes suplentes disponibles
    async getDocentesSupletesDisponibles() {
        try {
            const response = await API.get('/reemplazo-docentes/suplentes-disponibles');
            return response.data;
        } catch (error) {
            console.error('Error al obtener docentes suplentes disponibles:', error);
            throw error;
        }
    },

    // Obtener docentes titulares
    async getDocentesTitulares(cicloLectivo = new Date().getFullYear()) {
        try {
            const response = await API.get(`/reemplazo-docentes/docentes-titulares?cicloLectivo=${cicloLectivo}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener docentes titulares:', error);
            throw error;
        }
    },

    // Obtener opciones (motivos y estados)
    async getOptions() {
        try {
            const response = await API.get('/reemplazo-docentes/options');
            return response.data;
        } catch (error) {
            console.error('Error al obtener opciones:', error);
            throw error;
        }
    },

    // Crear nuevo reemplazo
    async create(data) {
        try {
            const response = await API.post('/reemplazo-docentes', data);
            return response.data;
        } catch (error) {
            console.error('Error al crear reemplazo:', error);
            throw error;
        }
    },

    // Actualizar reemplazo existente
    async update(id, data) {
        try {
            const response = await API.put(`/reemplazo-docentes/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar reemplazo:', error);
            throw error;
        }
    },

    // Finalizar reemplazo
    async finalizar(id, fechaFin = null) {
        try {
            const response = await API.patch(`/reemplazo-docentes/${id}/finalizar`, {
                fechaFin: fechaFin || new Date().toISOString().split('T')[0]
            });
            return response.data;
        } catch (error) {
            console.error('Error al finalizar reemplazo:', error);
            throw error;
        }
    },

    // Eliminar reemplazo
    async delete(id) {
        try {
            const response = await API.delete(`/reemplazo-docentes/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar reemplazo:', error);
            throw error;
        }
    }
};

export default reemplazoDocenteService;