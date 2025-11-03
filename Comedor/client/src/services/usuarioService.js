const API_URL = 'http://localhost:3000/usuarios';

export const usuarioService = {
    // Obtener todos los usuarios
    async getAll() {
        try {
            console.log('usuarioService: Obteniendo todos los usuarios...');
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const usuarios = await response.json();
            console.log('usuarioService: Usuarios obtenidos:', usuarios.length);
            return usuarios;
        } catch (error) {
            console.error('usuarioService: Error al obtener usuarios:', error);
            throw error;
        }
    },

    // Obtener usuario por ID
    async getById(id) {
        try {
            console.log('usuarioService: Obteniendo usuario con ID:', id);
            const response = await fetch(`${API_URL}/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const usuario = await response.json();
            console.log('usuarioService: Usuario obtenido:', usuario);
            return usuario;
        } catch (error) {
            console.error('usuarioService: Error al obtener usuario:', error);
            throw error;
        }
    },

    // Crear nuevo usuario
    async create(usuarioData) {
        try {
            console.log('usuarioService: Creando usuario:', usuarioData);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usuarioData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('usuarioService: Error en respuesta:', responseData);
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('usuarioService: Usuario creado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('usuarioService: Error al crear usuario:', error);
            throw error;
        }
    },

    // Actualizar usuario
    async update(id, usuarioData) {
        try {
            console.log('usuarioService: Actualizando usuario ID:', id, usuarioData);
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usuarioData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('usuarioService: Error en respuesta:', responseData);
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('usuarioService: Usuario actualizado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('usuarioService: Error al actualizar usuario:', error);
            throw error;
        }
    },

    // Eliminar usuario
    async delete(id) {
        try {
            console.log('usuarioService: Eliminando usuario con ID:', id);
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            console.log('usuarioService: Usuario eliminado exitosamente');
            return true;
        } catch (error) {
            console.error('usuarioService: Error al eliminar usuario:', error);
            throw error;
        }
    }
};

export default usuarioService;