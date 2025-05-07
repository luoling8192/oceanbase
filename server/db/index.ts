import process from 'node:process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/chat_app'
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
