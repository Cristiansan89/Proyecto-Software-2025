import mysql from 'mysql2/promise'
import 'dotenv/config'

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'gpl',
    database: process.env.DB_NAME || 'Comedor'
}

export const connection = await mysql.createConnection(config)