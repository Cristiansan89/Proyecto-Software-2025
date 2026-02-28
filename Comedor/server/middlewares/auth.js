import jwt from 'jsonwebtoken'

export const authRequired = (req, res, next) => {
    // Verificar el header Authorization
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.headers['x-access-token']

    if (!token) {
        return res.status(401).json({
            message: 'No token proporcionado'
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido'
        })
    }
}

// Middleware de autenticación OPCIONAL
// Intenta validar el JWT pero permite acceso sin él
export const authOptional = (req, res, next) => {
    // Verificar el header Authorization
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.headers['x-access-token']

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded
            console.log("✅ JWT decodificado completamente:", decoded)
            console.log("✅ Usuario autenticado vía JWT en middleware authOptional:", {
                id_persona: decoded.id_persona,
                nombreUsuario: decoded.nombreUsuario,
                gradosAsignados: decoded.gradosAsignados
            })
        } catch (error) {
            console.warn("⚠️ JWT token inválido en authOptional, continuando sin autenticación", error.message)
            // No hacer nada, permitir acceso sin autenticación
        }
    } else {
        console.log("ℹ️ Sin JWT token en header, continuando sin autenticación")
    }
    
    next()
}