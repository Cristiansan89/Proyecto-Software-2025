import mysql from 'mysql2/promise'
import 'dotenv/config'

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'xenopus',
    database: process.env.DB_NAME || 'Comedor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

export const connection = mysql.createPool(config)