// Función para obtener la URL base de la API
const getApiBaseUrl = () => {
  const currentUrl = window.location.origin;
  console.log("🔍 Current window origin:", currentUrl);

  // 1. Si está definida explícitamente en variables de entorno de Vite
  if (import.meta.env.VITE_API_URL) {
    console.log("🚀 Using Environment API URL:", import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 2. Respaldo directo si el frontend se ejecuta en Railway
  if (currentUrl.includes("railway.app")) {
    const railwayBackend = "https://backend-production-ee0c.up.railway.app/api";
    console.log("🚂 Using Railway Fallback Backend URL:", railwayBackend);
    return railwayBackend;
  }

  // 3. Si estamos en ngrok
  if (currentUrl.includes("ngrok-free.dev")) {
    const apiUrl = currentUrl + "/api";
    console.log("🌐 Using ngrok API URL:", apiUrl);
    return apiUrl;
  }

  // 4. Si estamos en localhost HTTP o 127.0.0.1
  if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) {
    const apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/api`;
    console.log("🏠 Using Localhost API URL:", apiUrl);
    return apiUrl;
  }

  // 5. En desarrollo red local (192.168.x.x)
  if (currentUrl.includes("192.168")) {
    const hostname = window.location.hostname;
    const apiUrl = `http://${hostname}:3000/api`;
    console.log("🖥️ Using Network IP API URL:", apiUrl);
    return apiUrl;
  }

  // Respaldo final de seguridad
  return "https://backend-production-ee0c.up.railway.app/api";
};
