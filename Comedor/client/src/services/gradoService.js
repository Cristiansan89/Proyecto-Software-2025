import API from './api.js'

const GRADOS_ENDPOINT = '/grados'

export const gradoService = {
    // Obtener todos los grados
    getAll: async () => {
        console.log('GradoService: Haciendo petición a /grados');
        try {
            const response = await API.get(GRADOS_ENDPOINT)
            console.log('GradoService: Respuesta recibida:', response.data);
            return response.data
        } catch (error) {
            console.error('GradoService: Error en getAll:', error);
            throw error
        }
    },

    // Obtener grado por ID
    getById: async (id) => {
        try {
            const response = await API.get(`${GRADOS_ENDPOINT}/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error al obtener grado ${id}:`, error)
            throw error
        }
    },

    // Obtener grados activos
    getActivos: async () => {
        try {
            const response = await API.get(`${GRADOS_ENDPOINT}/activos/list`)
            return response.data
        } catch (error) {
            console.error('Error al obtener grados activos:', error)
            throw error
        }
    },

    // Buscar grados por nombre
    searchByNombre: async (nombre) => {
        try {
            const response = await API.get(`${GRADOS_ENDPOINT}/search/by-nombre`, {
                params: { nombre }
            })
            return response.data
        } catch (error) {
            console.error('Error al buscar grados por nombre:', error)
            throw error
        }
    },

    // Crear nuevo grado
    create: async (gradoData) => {
        try {
            const response = await API.post(GRADOS_ENDPOINT, gradoData)
            return response.data
        } catch (error) {
            console.error('Error al crear grado:', error)
            throw error
        }
    },

    // Actualizar grado
    update: async (id, gradoData) => {
        try {
            const response = await API.patch(`${GRADOS_ENDPOINT}/${id}`, gradoData)
            return response.data
        } catch (error) {
            console.error(`Error al actualizar grado ${id}:`, error)
            throw error
        }
    },

    // Eliminar grado
    delete: async (id) => {
        console.log('GradoService: Eliminando grado con ID:', id);
        try {
            const response = await API.delete(`${GRADOS_ENDPOINT}/${id}`)
            console.log('GradoService: Respuesta de eliminación:', response.data);
            return response.data
        } catch (error) {
            console.error('GradoService: Error en delete:', error);
            console.error('GradoService: Error response:', error.response?.data);
            throw error
        }
    },

    // Cambiar estado del grado
    cambiarEstado: async (id, estado) => {
        try {
            const response = await API.patch(`${GRADOS_ENDPOINT}/${id}/estado`, { estado })
            return response.data
        } catch (error) {
            console.error(`Error al cambiar estado del grado ${id}:`, error)
            throw error
        }
    }
}

export default gradoService