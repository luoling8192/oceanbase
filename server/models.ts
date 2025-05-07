import process from 'node:process'
import { cosineDistance, sql } from 'drizzle-orm'
import { embed } from 'xsai'
import { db } from './db'
import { memories } from './db/schema'

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

  // Calculate cosine similarity and time relevance for ranking
  const timeRelevance = sql<number>`(1 - (CEIL(EXTRACT(EPOCH FROM NOW()) * 1000)::bigint - memories.created_at) / 86400 / 30)`
  const similarity = sql<number>`(1 - (1 - ${cosineDistance(memories.embedding, queryEmbedding)}))`
  const combinedScore = sql<number>`((0.8 * ${similarity}) + (0.2 * ${timeRelevance}))`

  // Query memories with similarity and time-based ranking
  const results = await db.execute(sql`
    SELECT
      memories.*,
      ${similarity} AS similarity,
      ${timeRelevance} AS time_relevance,
      ${combinedScore} AS combined_score
    FROM memories
    WHERE
      user_id = ${userId}
      AND (1 - (1 - ${cosineDistance(memories.embedding, queryEmbedding)})) > 0.5
    ORDER BY combined_score DESC
    LIMIT 5
  `)

  console.log(`[MEMORY RETRIEVE] Found ${results.length} memories`)
  return results
}
