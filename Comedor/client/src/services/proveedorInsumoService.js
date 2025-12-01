import axiosInstance from "./axiosConfig.js";

const API_BASE_URL = "/proveedor-insumos";

export const proveedorInsumoService = {
  // Obtener todos las relaciones proveedor-insumo
  getAll: async () => {
    const response = await axiosInstance.get(API_BASE_URL);
    return response.data;
  },

  // Obtener proveedores que suministran un insumo específico
  getProveedoresByInsumo: async (idInsumo) => {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/insumo/${idInsumo}/proveedores`
    );
    return response.data;
  },

  // Obtener insumos que suministra un proveedor específico
  getInsumosByProveedor: async (idProveedor) => {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/proveedor/${idProveedor}/insumos`
    );
    return response.data;
  },

  // Obtener mejor proveedor para un insumo (menor precio)
  getMejorProveedorByInsumo: async (idInsumo) => {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/insumo/${idInsumo}/mejor-proveedor`
    );
    return response.data;
  },

  // Crear nueva relación proveedor-insumo
  create: async (data) => {
    const response = await axiosInstance.post(API_BASE_URL, data);
    return response.data;
  },

  // Actualizar relación proveedor-insumo
  update: async (id, data) => {
    const response = await axiosInstance.patch(`${API_BASE_URL}/${id}`, data);
    return response.data;
  },

  // Eliminar relación proveedor-insumo
  delete: async (id) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  },
};
