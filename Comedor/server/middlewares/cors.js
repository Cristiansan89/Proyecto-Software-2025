import cors from 'cors'

export const corsMiddleware = () => cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:4173'
        ]

        if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
            callback(null, true)
        } else {
            callback(new Error('No permitido por CORS'))
        }
    }
})