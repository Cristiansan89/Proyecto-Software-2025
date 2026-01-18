// Función para obtener la URL base correcta dinámicamente
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const currentUrl = window.location.origin;

  // Si accedemos desde ngrok, usar ngrok como origen
  if (
    currentUrl.includes("ngrok-free.dev") ||
    currentUrl.includes("ngrok.io")
  ) {
    return `${currentUrl}/api`;
  }

  // Si viene del .env, validar que no sea una IP privada
  if (envUrl) {
    // Si el .env contiene localhost o 127.0.0.1, usarlo
    if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    // Si contiene ngrok, usarlo
    if (envUrl.includes("ngrok-free.dev") || envUrl.includes("ngrok.io")) {
      return envUrl;
    }
    // Si contiene una IP privada (192.168.x.x), redirigir a localhost
    if (envUrl.includes("192.168")) {
      return "http://localhost:3000/api";
    }
  }

  // Si accedemos desde una IP privada, siempre usar localhost
  if (currentUrl.includes("192.168")) {
    return "http://localhost:3000/api";
  }

  return envUrl || "http://localhost:3000/api";
};

const API_BASE_URL = getApiBaseUrl();

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
