import API from './api.js';

export const rolService = {
    // Obtener todos los roles
    async getAll() {
        try {
            console.log('rolService: Obteniendo todos los roles...');
            const response = await API.get('/roles');
            console.log('rolService: Roles obtenidos:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('rolService: Error al obtener roles:', error);
            throw error;
        }
    },

    // Obtener rol por ID
    async getById(id) {
        try {
            console.log('rolService: Obteniendo rol con ID:', id);
            const response = await API.get(`/roles/${id}`);
            console.log('rolService: Rol obtenido:', response.data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            console.error(`rolService: Error al obtener rol ${id}:`, error);
            throw error;
        }
    },

    // Crear un nuevo rol
    async create(rolData) {
        try {
            console.log('rolService: Creando rol:', rolData);
            const response = await API.post('/roles', rolData);
            console.log('rolService: Rol creado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('rolService: Error al crear rol:', error);
            throw error;
        }
    },

    // Actualizar un rol
    async update(id, rolData) {
        try {
            console.log('rolService: Actualizando rol ID:', id, 'con datos:', rolData);
            const response = await API.put(`/roles/${id}`, rolData);
            console.log('rolService: Rol actualizado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('rolService: Error al actualizar rol:', error);
            throw error;
        }
    },

    // Eliminar un rol
    async delete(id) {
        try {
            console.log('rolService: Eliminando rol ID:', id);
            const response = await API.delete(`/roles/${id}`);
            console.log('rolService: Rol eliminado exitosamente');
            return response.data;
        } catch (error) {
            console.error('rolService: Error al eliminar rol:', error);
            throw error;
        }
    },

    // Obtener roles activos
    async getActivos() {
        try {
            console.log('rolService: Obteniendo roles activos...');
            const response = await API.get('/roles/activos/list');
            console.log('rolService: Roles activos obtenidos:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('rolService: Error al obtener roles activos:', error);
            throw error;
        }
    },

    // Cambiar estado de un rol
    async cambiarEstado(id, estado) {
        try {
            console.log('rolService: Cambiando estado del rol ID:', id, 'a:', estado);
            const response = await API.patch(`/roles/${id}/estado`, { estado });
            console.log('rolService: Estado cambiado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('rolService: Error al cambiar estado:', error);
            throw error;
        }
    }
};

export default rolService;
