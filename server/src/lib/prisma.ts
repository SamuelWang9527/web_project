import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

// Prisma 7 requires a driver adapter; PrismaMariaDb works with MySQL
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 30000,
  socketTimeout: 60000,
  connectionLimit: 10,
})

export const prisma = new PrismaClient({ adapter })
