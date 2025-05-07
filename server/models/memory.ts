import process from 'node:process'
import { sql } from 'drizzle-orm'
import { db } from 'server/db'
import { memories } from 'server/db/schema'
import { embed } from 'xsai'

// Store memory function
export async function storeMemory(userId: string, type: string, content: string) {
  // Generate embedding for the content
  const { embedding } = await embed({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    input: content,
    model: 'text-embedding-3-large',
  })

  // Insert memory into database
  await db.insert(memories).values({
    userId,
    type: type as any,
    content,
    embedding,
  })

  return { success: true, message: 'Memory stored successfully' }
}

// Retrieve memories function
export async function retrieveMemories(userId: string, query: string) {
  // Generate embedding for the query
  const { embedding: queryEmbedding } = await embed({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: 'https://api.openai.com/v1/',
    input: query,
    model: 'text-embedding-3-large',
  })

  // Perform vector search using L2 distance
  const results = await db.select()
    .from(memories)
    .where(sql`user_id = ${userId}`)
    .orderBy(sql`embedding <-> ${queryEmbedding}`)
    .limit(5)

  return results
}
