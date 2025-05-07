import process from 'node:process'
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })

export default {
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_DSN,
  },
}
