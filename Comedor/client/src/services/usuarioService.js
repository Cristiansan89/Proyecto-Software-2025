import api from './api.js';

export const usuarioService = {
    // Obtener todos los usuarios
    async getAll() {
        try {
            console.log('usuarioService: Obteniendo todos los usuarios...');
            const response = await api.get('/usuarios');
            console.log('usuarioService: Usuarios obtenidos:', response.data.length);
            return response.data;
        } catch (error) {
            console.error('usuarioService: Error al obtener usuarios:', error);
            throw error;
        }
    },

    // Obtener usuario por ID
    async getById(id) {
        try {
            console.log('usuarioService: Obteniendo usuario con ID:', id);
            const response = await api.get(`/usuarios/${id}`);
            console.log('usuarioService: Usuario obtenido:', response.data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            console.error(`usuarioService: Error al obtener usuario ${id}:`, error);
            throw error;
        }
    },

    // Crear un nuevo usuario
    async create(usuarioData) {
        try {
            console.log('usuarioService: Creando usuario:', usuarioData);
            const response = await api.post('/usuarios', usuarioData);
            console.log('usuarioService: Usuario creado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('usuarioService: Error al crear usuario:', error);
            throw error;
        }
    },

    // Actualizar un usuario
    async update(id, usuarioData) {
        try {
            console.log('usuarioService: Actualizando usuario ID:', id, 'con datos:', usuarioData);
            const response = await api.patch(`/usuarios/${id}`, usuarioData);
            console.log('usuarioService: Usuario actualizado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('usuarioService: Error al actualizar usuario:', error);
            throw error;
        }
    },

    // Eliminar un usuario
    async delete(id) {
        try {
            console.log('usuarioService: Eliminando usuario ID:', id);
            const response = await api.delete(`/usuarios/${id}`);
            console.log('usuarioService: Usuario eliminado exitosamente');
            return response.data;
        } catch (error) {
            console.error('usuarioService: Error al eliminar usuario:', error);
            throw error;
        }
    },

    // Cambiar estado de un usuario
    async cambiarEstado(id, estado) {
        try {
            console.log('usuarioService: Cambiando estado del usuario ID:', id, 'a:', estado);
            const response = await api.patch(`/usuarios/${id}/estado`, { estado });
            console.log('usuarioService: Estado cambiado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('usuarioService: Error al cambiar estado:', error);
            throw error;
        }
    }
};

export default usuarioService;
