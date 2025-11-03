const API_BASE_URL = 'http://localhost:3000';

export const permisoService = {
    // Obtener todos los permisos
    async getAll() {
        try {
            console.log('permisoService: Obteniendo todos los permisos...');
            const response = await fetch(`${API_BASE_URL}/permisos`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const permisos = await response.json();
            console.log('permisoService: Permisos obtenidos:', permisos.length);
            return permisos;
        } catch (error) {
            console.error('permisoService: Error al obtener permisos:', error);
            throw error;
        }
    },

    // Obtener permiso por ID
    async getById(id) {
        try {
            console.log('permisoService: Obteniendo permiso con ID:', id);
            const response = await fetch(`${API_BASE_URL}/permisos/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const permiso = await response.json();
            console.log('permisoService: Permiso obtenido:', permiso);
            return permiso;
        } catch (error) {
            console.error('permisoService: Error al obtener permiso:', error);
            throw error;
        }
    },

    // Crear nuevo permiso
    async create(permisoData) {
        try {
            console.log('permisoService: Creando permiso:', permisoData);
            const response = await fetch(`${API_BASE_URL}/permisos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(permisoData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('permisoService: Error en respuesta:', responseData);
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('permisoService: Permiso creado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('permisoService: Error al crear permiso:', error);
            throw error;
        }
    },

    // Actualizar permiso
    async update(id, permisoData) {
        try {
            console.log('permisoService: Actualizando permiso ID:', id, permisoData);
            const response = await fetch(`${API_BASE_URL}/permisos/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(permisoData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('permisoService: Error en respuesta:', responseData);
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('permisoService: Permiso actualizado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('permisoService: Error al actualizar permiso:', error);
            throw error;
        }
    },

    // Eliminar permiso
    async delete(id) {
        try {
            console.log('permisoService: Eliminando permiso con ID:', id);
            const response = await fetch(`${API_BASE_URL}/permisos/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            console.log('permisoService: Permiso eliminado exitosamente');
            return true;
        } catch (error) {
            console.error('permisoService: Error al eliminar permiso:', error);
            throw error;
        }
    },

    // Obtener permisos activos
    async getActivos() {
        try {
            console.log('permisoService: Obteniendo permisos activos...');
            const response = await fetch(`${API_BASE_URL}/permisos/activos/list`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const permisos = await response.json();
            console.log('permisoService: Permisos activos obtenidos:', permisos.length);
            return permisos;
        } catch (error) {
            console.error('permisoService: Error al obtener permisos activos:', error);
            throw error;
        }
    },

    // Buscar permisos por texto
    async searchByTexto(texto) {
        try {
            console.log('permisoService: Buscando permisos por texto:', texto);
            const response = await fetch(`${API_BASE_URL}/permisos/search/by-texto?texto=${encodeURIComponent(texto)}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const permisos = await response.json();
            console.log('permisoService: Permisos encontrados:', permisos.length);
            return permisos;
        } catch (error) {
            console.error('permisoService: Error al buscar permisos:', error);
            throw error;
        }
    },

    // Obtener permisos por módulo
    async getByModulo(modulo) {
        try {
            console.log('permisoService: Obteniendo permisos del módulo:', modulo);
            const response = await fetch(`${API_BASE_URL}/permisos/modulo/${encodeURIComponent(modulo)}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const permisos = await response.json();
            console.log('permisoService: Permisos del módulo obtenidos:', permisos.length);
            return permisos;
        } catch (error) {
            console.error('permisoService: Error al obtener permisos del módulo:', error);
            throw error;
        }
    },

    // Cambiar estado del permiso
    async cambiarEstado(id, estado) {
        try {
            console.log('permisoService: Cambiando estado del permiso ID:', id, 'a:', estado);
            const response = await fetch(`${API_BASE_URL}/permisos/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('permisoService: Estado cambiado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('permisoService: Error al cambiar estado:', error);
            throw error;
        }
    }
};