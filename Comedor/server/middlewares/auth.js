import jwt from 'jsonwebtoken'

export const authRequired = (req, res, next) => {
    const token = req.headers['x-access-token']

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