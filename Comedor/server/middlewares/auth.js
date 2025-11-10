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