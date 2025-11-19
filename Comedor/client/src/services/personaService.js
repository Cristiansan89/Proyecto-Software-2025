import api from './api.js'

const PERSONAS_ENDPOINT = '/personas'

export const personaService = {
    // Obtener todas las personas
    getAll: async () => {
        try {
            const response = await api.get(PERSONAS_ENDPOINT)
            return response.data
        } catch (error) {
            console.error('Error al obtener personas:', error)
            throw error
        }
    },

    // Obtener persona por ID
    getById: async (id) => {
        try {
            const response = await api.get(`${PERSONAS_ENDPOINT}/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error al obtener persona ${id}:`, error)
            throw error
        }
    },

    // Crear nueva persona
    create: async (personaData) => {
        try {
            const response = await api.post(PERSONAS_ENDPOINT, personaData)
            return response.data
        } catch (error) {
            console.error('Error al crear persona:', error)
            throw error
        }
    },

    // Actualizar persona
    update: async (id, personaData) => {
        try {
            const response = await api.patch(`${PERSONAS_ENDPOINT}/${id}`, personaData)
            return response.data
        } catch (error) {
            console.error(`Error al actualizar persona ${id}:`, error)
            throw error
        }
    },

    // Eliminar persona
    delete: async (id) => {
        try {
            const response = await api.delete(`${PERSONAS_ENDPOINT}/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error al eliminar persona ${id}:`, error)
            throw error
        }
    },

    // Obtener personas activas
    getActivas: async () => {
        try {
            const response = await api.get(`${PERSONAS_ENDPOINT}/activas/list`)
            return response.data
        } catch (error) {
            console.error('Error al obtener personas activas:', error)
            throw error
        }
    },

    // Buscar personas por nombre
    searchByNombre: async (nombre) => {
        try {
            const response = await api.get(`${PERSONAS_ENDPOINT}/search/by-nombre`, {
                params: { nombre }
            })
            return response.data
        } catch (error) {
            console.error('Error al buscar personas por nombre:', error)
            throw error
        }
    },

    // Obtener personas por grado
    getByGrado: async (idGrado) => {
        try {
            const response = await api.get(`${PERSONAS_ENDPOINT}/grado/${idGrado}`)
            return response.data
        } catch (error) {
            console.error(`Error al obtener personas por grado ${idGrado}:`, error)
            throw error
        }
    },

    // Obtener personas por servicio
    getByServicio: async (idServicio) => {
        try {
            const response = await api.get(`${PERSONAS_ENDPOINT}/servicio/${idServicio}`)
            return response.data
        } catch (error) {
            console.error(`Error al obtener personas por servicio ${idServicio}:`, error)
            throw error
        }
    },

    // Cambiar estado de persona
    cambiarEstado: async (id, estado) => {
        try {
            const response = await api.patch(`${PERSONAS_ENDPOINT}/${id}/estado`, { estado })
            return response.data
        } catch (error) {
            console.error(`Error al cambiar estado de persona ${id}:`, error)
            throw error
        }
    }
}

export default personaService