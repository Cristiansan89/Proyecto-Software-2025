import api from './api.js';

const proveedorService = {
    // Obtener todos los proveedores
    getAll: async () => {
        try {
            const response = await api.get('/proveedores');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener calificaciones disponibles para insumos
    getCalificaciones: async () => {
        try {
            const response = await api.get('/proveedores/calificaciones');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener un proveedor por ID
    getById: async (id) => {
        const response = await api.get(`/proveedores/${id}`);
        return response.data;
    },

    // Crear un nuevo proveedor
    create: async (proveedorData) => {
        try {
            const response = await api.post('/proveedores', proveedorData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar un proveedor
    update: async (id, proveedorData) => {
        try {
            const response = await api.patch(`/proveedores/${id}`, proveedorData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar un proveedor
    delete: async (id) => {
        try {
            const response = await api.delete(`/proveedores/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cambiar estado de un proveedor
    cambiarEstado: async (id, estado) => {
        const response = await api.patch(`/proveedores/${id}/estado`, { estado });
        return response.data;
    },

    // Obtener insumos asignados a un proveedor
    getInsumosAsignados: async (id) => {
        const response = await api.get(`/proveedores/${id}/insumos`);
        return response.data;
    },

    // Asignar insumos a un proveedor
    asignarInsumos: async (id, insumosData) => {
        try {
            const response = await api.post(`/proveedores/${id}/insumos`, insumosData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener proveedores activos
    getActivos: async () => {
        const response = await api.get('/proveedores/activos/list');
        return response.data;
    },

    // Buscar proveedores por nombre
    searchByName: async (nombre) => {
        const response = await api.get(`/proveedores/search/by-nombre?nombre=${encodeURIComponent(nombre)}`);
        return response.data;
    }
};

export default proveedorService;