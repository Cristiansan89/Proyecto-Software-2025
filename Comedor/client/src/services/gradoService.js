import api from './api.js'

const GRADOS_ENDPOINT = '/grados'

export const gradoService = {
    // Obtener todos los grados
    getAll: async () => {
        try {
            const response = await api.get(GRADOS_ENDPOINT)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Obtener grado por ID
    getById: async (id) => {
        try {
            const response = await api.get(`${GRADOS_ENDPOINT}/${id}`)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Obtener grados activos
    getActivos: async () => {
        try {
            const response = await api.get(`${GRADOS_ENDPOINT}/activos/list`)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Buscar grados por nombre
    searchByNombre: async (nombre) => {
        try {
            const response = await api.get(`${GRADOS_ENDPOINT}/search/by-nombre`, {
                params: { nombre }
            })
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Crear nuevo grado
    create: async (gradoData) => {
        try {
            const response = await api.post(GRADOS_ENDPOINT, gradoData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Actualizar grado
    update: async (id, gradoData) => {
        try {
            const response = await api.patch(`${GRADOS_ENDPOINT}/${id}`, gradoData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Eliminar grado
    delete: async (id) => {
        try {
            const response = await api.delete(`${GRADOS_ENDPOINT}/${id}`)
            return response.data
        } catch (error) {
            throw error
        }
    },

    // Cambiar estado del grado
    cambiarEstado: async (id, estado) => {
        try {
            const response = await api.patch(`${GRADOS_ENDPOINT}/${id}/estado`, { estado })
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default gradoService