import API from './api.js';

const insumoService = {
    // Obtener todos los insumos
    getAll: async () => {
        console.log('InsumoService: Haciendo petición a /insumos');
        try {
            const response = await API.get('/insumos');
            console.log('InsumoService: Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('InsumoService: Error en getAll:', error);
            throw error;
        }
    },

    // Obtener un insumo por ID
    getById: async (id) => {
        const response = await API.get(`/insumos/${id}`);
        return response.data;
    },

    // Crear un nuevo insumo
    create: async (insumoData) => {
        console.log('InsumoService: Creando insumo:', insumoData);
        try {
            const response = await API.post('/insumos', insumoData);
            console.log('InsumoService: Insumo creado:', response.data);
            return response.data;
        } catch (error) {
            console.error('InsumoService: Error en create:', error);
            throw error;
        }
    },

    // Actualizar un insumo
    update: async (id, insumoData) => {
        console.log('InsumoService: Actualizando insumo:', id, insumoData);
        try {
            const response = await API.patch(`/insumos/${id}`, insumoData);
            console.log('InsumoService: Insumo actualizado:', response.data);
            return response.data;
        } catch (error) {
            console.error('InsumoService: Error en update:', error);
            throw error;
        }
    },

    // Eliminar un insumo
    delete: async (id) => {
        console.log('InsumoService: Eliminando insumo con ID:', id);
        try {
            const response = await API.delete(`/insumos/${id}`);
            console.log('InsumoService: Respuesta de eliminación:', response.data);
            return response.data;
        } catch (error) {
            console.error('InsumoService: Error en delete:', error);
            throw error;
        }
    },

    // Obtener insumos por categoría
    getByCategoria: async (categoria) => {
        const response = await API.get(`/insumos/categoria/${categoria}`);
        return response.data;
    },

    // Obtener insumos con stock bajo
    getBajoStock: async () => {
        const response = await API.get('/insumos/bajo-stock');
        return response.data;
    },

    // Actualizar stock de un insumo
    updateStock: async (id, cantidad) => {
        const response = await API.patch(`/insumos/${id}/stock`, { cantidad });
        return response.data;
    },

    // Cambiar estado de un insumo
    cambiarEstado: async (id, estado) => {
        const response = await API.patch(`/insumos/${id}/estado`, { estado });
        return response.data;
    }
};

export default insumoService;