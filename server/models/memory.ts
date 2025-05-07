import process from 'node:process'
import { sql } from 'drizzle-orm'
import { embed } from 'xsai'
import { db } from '../db'
import { memories } from '../db/schema'

// Store memory function
export async function storeMemory(userId: string, type: string, content: string) {
  console.log(`[MEMORY STORE] Storing memory for user: ${userId}, type: ${type}`)

  // Generate embedding for the content
  const { embedding } = await embed({
    apiKey: process.env.LLM_EMBEDDING_API_KEY || '',
    baseURL: process.env.LLM_EMBEDDING_BASE_URL || '',
    input: content,
    model: process.env.LLM_EMBEDDING_MODEL || '',
  })

  // Insert memory into database
  await db.insert(memories).values({
    userId,
    type: type as any,
    content,
    embedding,
  })

  console.log(`[MEMORY STORE] Successfully stored memory`)
  return { success: true, message: 'Memory stored successfully' }
}

// Retrieve memories function
export async function retrieveMemories(userId: string, query: string) {
  console.log(`[MEMORY RETRIEVE] Retrieving memories for user: ${userId}, query: ${query}`)

  // Generate embedding for the query
  const { embedding: queryEmbedding } = await embed({
    apiKey: process.env.LLM_EMBEDDING_API_KEY || '',
    baseURL: process.env.LLM_EMBEDDING_BASE_URL || '',
    input: query,
    model: process.env.LLM_EMBEDDING_MODEL || '',
  })

  const results = await db.select()
    .from(memories)
    .where(sql`user_id = ${userId}`)
    .limit(5)

  console.log(`[MEMORY RETRIEVE] Found ${results.length} memories`)
  return results
}
