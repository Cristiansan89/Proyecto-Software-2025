const API_URL = 'http://localhost:3000/roles';

export const rolService = {
    // Obtener todos los roles
    async getAll() {
        try {
            console.log('rolService: Obteniendo todos los roles...');
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const roles = await response.json();
            console.log('rolService: Roles obtenidos:', roles.length);
            return roles;
        } catch (error) {
            console.error('rolService: Error al obtener roles:', error);
            throw error;
        }
    },

    // Obtener rol por ID
    async getById(id) {
        try {
            console.log('rolService: Obteniendo rol con ID:', id);
            const response = await fetch(`${API_URL}/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const rol = await response.json();
            console.log('rolService: Rol obtenido:', rol);
            return rol;
        } catch (error) {
            console.error('rolService: Error al obtener rol:', error);
            throw error;
        }
    },

    // Crear nuevo rol
    async create(rolData) {
        try {
            console.log('rolService: Creando rol:', rolData);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rolData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('rolService: Error en respuesta:', responseData);
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('rolService: Rol creado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('rolService: Error al crear rol:', error);
            throw error;
        }
    },

    // Actualizar rol
    async update(id, rolData) {
        try {
            console.log('rolService: Actualizando rol ID:', id, rolData);
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rolData),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('rolService: Error en respuesta:', responseData);
                throw new Error(responseData.message || `Error HTTP: ${response.status}`);
            }

            console.log('rolService: Rol actualizado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('rolService: Error al actualizar rol:', error);
            throw error;
        }
    },

    // Eliminar rol
    async delete(id) {
        try {
            console.log('rolService: Eliminando rol con ID:', id);
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            console.log('rolService: Rol eliminado exitosamente');
            return true;
        } catch (error) {
            console.error('rolService: Error al eliminar rol:', error);
            throw error;
        }
    },

    // Obtener roles activos
    async getActivos() {
        try {
            console.log('rolService: Obteniendo roles activos...');
            const response = await fetch(`${API_URL}/activos/list`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const roles = await response.json();
            console.log('rolService: Roles activos obtenidos:', roles.length);
            return roles;
        } catch (error) {
            console.error('rolService: Error al obtener roles activos:', error);
            throw error;
        }
    },

    // Buscar roles por nombre
    async searchByNombre(nombre) {
        try {
            console.log('rolService: Buscando roles por nombre:', nombre);
            const response = await fetch(`${API_URL}/search/by-nombre?nombre=${encodeURIComponent(nombre)}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const roles = await response.json();
            console.log('rolService: Roles encontrados:', roles.length);
            return roles;
        } catch (error) {
            console.error('rolService: Error al buscar roles:', error);
            throw error;
        }
    },

    // Obtener rol con sus permisos
    async getConPermisos(id) {
        try {
            console.log('rolService: Obteniendo rol con permisos ID:', id);
            const response = await fetch(`${API_URL}/${id}/permisos`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const rolConPermisos = await response.json();
            console.log('rolService: Rol con permisos obtenido:', rolConPermisos);
            return rolConPermisos;
        } catch (error) {
            console.error('rolService: Error al obtener rol con permisos:', error);
            throw error;
        }
    },

    // Cambiar estado del rol
    async cambiarEstado(id, estado) {
        try {
            console.log('rolService: Cambiando estado del rol ID:', id, 'a:', estado);
            const response = await fetch(`${API_URL}/${id}/estado`, {
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

            console.log('rolService: Estado cambiado exitosamente:', responseData);
            return responseData;
        } catch (error) {
            console.error('rolService: Error al cambiar estado:', error);
            throw error;
        }
    }
};