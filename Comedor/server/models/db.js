import mysql from 'mysql2/promise'
import 'dotenv/config'

const {
    DB_HOST = 'localhost',
    DB_USER = 'root',
    DB_NAME = 'Comedor',
    DB_PASSWORD = ''
} = process.env

const config = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
}

export const connection = mysql.createPool(config)