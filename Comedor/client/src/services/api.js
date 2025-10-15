import axios from "axios"

// Usa la URL del backend definida en .env (por ejemplo: http://localhost:4000/api)
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Interceptor para agregar el token JWT si existe (opcional)
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default API
