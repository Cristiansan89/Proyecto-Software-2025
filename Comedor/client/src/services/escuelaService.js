const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const escuelaService = {
  // Obtener datos de la escuela
  async getDatos() {
    try {
      const response = await fetch(`${API_BASE_URL}/escuela`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener datos de la escuela:", error);
      throw error;
    }
  },

  // Actualizar datos de la escuela
  async actualizarDatos(datos) {
    try {
      const response = await fetch(`${API_BASE_URL}/escuela`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al actualizar datos de la escuela:", error);
      throw error;
    }
  },
};

export default escuelaService;
