import { pgTable, serial, text, timestamp, vector } from 'drizzle-orm/pg-core'

export const memories = pgTable('memories', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull().$type<'interest' | 'learning_goal' | 'knowledge_level' | 'key_point'>(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
