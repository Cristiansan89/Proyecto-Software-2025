import api from './api.js';

const recetaService = {
    // Obtener todas las recetas
    getAll: async () => {
        try {
            const response = await api.get('/recetas');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener receta por ID
    getById: async (id) => {
        try {
            const response = await api.get(`/recetas/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Crear nueva receta
    create: async (receta) => {
        try {
            const response = await api.post('/recetas', receta);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar receta
    update: async (id, receta) => {
        try {
            const response = await api.patch(`/recetas/${id}`, receta);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar receta
    delete: async (id) => {
        try {
            const response = await api.delete(`/recetas/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener recetas activas
    getActivas: async () => {
        try {
            const response = await api.get('/recetas/activas');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Buscar recetas por nombre
    searchByNombre: async (nombre) => {
        try {
            const response = await api.get(`/recetas/buscar?nombre=${encodeURIComponent(nombre)}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener receta con insumos
    getWithInsumos: async (id) => {
        try {
            const response = await api.get(`/recetas/${id}/insumos`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener todas las recetas con conteo de insumos
    getAllWithInsumoCount: async () => {
        try {
            const response = await api.get('/recetas/con-insumos-count');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Agregar insumo a receta
    addInsumo: async (idReceta, insumoData) => {
        try {
            const response = await api.post(`/recetas/${idReceta}/insumos`, insumoData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar insumo en receta
    updateInsumo: async (idReceta, idItem, insumoData) => {
        try {
            const response = await api.patch(`/recetas/${idReceta}/insumos/${idItem}`, insumoData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Remover insumo de receta
    removeInsumo: async (idReceta, idItem) => {
        try {
            const response = await api.delete(`/recetas/${idReceta}/insumos/${idItem}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cambiar estado de receta
    changeStatus: async (id, estado) => {
        try {
            const response = await api.patch(`/recetas/${id}/estado`, { estado });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener recetas por categoría
    getByCategoria: async (categoria) => {
        try {
            const response = await api.get(`/recetas/categoria/${categoria}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener estadísticas de uso de recetas
    getEstadisticasUso: async (fechaInicio, fechaFin) => {
        try {
            const response = await api.get(`/recetas/estadisticas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default recetaService;