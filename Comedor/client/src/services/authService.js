import API from "./api"

// Login de usuario
export const login = async (email, password) => {
    const response = await API.post("/auth/login", { email, password })
    return response.data
}

// Obtener perfil del usuario autenticado
export const getProfile = async () => {
    const response = await API.get("/auth/profile")
    return response.data
}
