import process from 'node:process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection
const connectionString = process.env.DATABASE_DSN || ''
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
