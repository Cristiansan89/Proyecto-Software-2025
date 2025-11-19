import api from './api.js';

const proveedorService = {
    // Obtener todos los proveedores
    getAll: async () => {
        console.log('ProveedorService: Haciendo petición a /proveedores');
        try {
            const response = await api.get('/proveedores');
            console.log('ProveedorService: Respuesta recibida:', response.data);
            return response.data;
        } catch (error) {
            console.error('ProveedorService: Error en getAll:', error);
            throw error;
        }
    },

    // Obtener calificaciones disponibles para insumos
    getCalificaciones: async () => {
        try {
            const response = await api.get('/proveedores/calificaciones');
            return response.data;
        } catch (error) {
            console.error('ProveedorService: Error en getCalificaciones:', error);
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
        console.log('ProveedorService: Creando proveedor:', proveedorData);
        try {
            const response = await api.post('/proveedores', proveedorData);
            console.log('ProveedorService: Proveedor creado:', response.data);
            return response.data;
        } catch (error) {
            console.error('ProveedorService: Error en create:', error);
            throw error;
        }
    },

    // Actualizar un proveedor
    update: async (id, proveedorData) => {
        console.log('ProveedorService: Actualizando proveedor:', id, proveedorData);
        try {
            const response = await api.patch(`/proveedores/${id}`, proveedorData);
            console.log('ProveedorService: Proveedor actualizado:', response.data);
            return response.data;
        } catch (error) {
            console.error('ProveedorService: Error en update:', error);
            throw error;
        }
    },

    // Eliminar un proveedor
    delete: async (id) => {
        console.log('ProveedorService: Eliminando proveedor con ID:', id);
        try {
            const response = await api.delete(`/proveedores/${id}`);
            console.log('ProveedorService: Respuesta de eliminación:', response.data);
            return response.data;
        } catch (error) {
            console.error('ProveedorService: Error en delete:', error);
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
        console.log('ProveedorService: Asignando insumos:', id, insumosData);
        try {
            const response = await api.post(`/proveedores/${id}/insumos`, insumosData);
            console.log('ProveedorService: Insumos asignados:', response.data);
            return response.data;
        } catch (error) {
            console.error('ProveedorService: Error en asignarInsumos:', error);
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