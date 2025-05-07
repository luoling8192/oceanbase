import process from 'node:process'
// server/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Migration script
async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/chat_app'
  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql)

  // eslint-disable-next-line no-console
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  // eslint-disable-next-line no-console
  console.log('Migrations completed')

  await sql.end()
}

runMigration().catch(console.error)
