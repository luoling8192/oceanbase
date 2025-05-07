import { defineEventHandler, readBody } from 'h3'
import { retrieveMemories } from '../models/memory'

export default defineEventHandler(async (event) => {
  try {
    const { userId, query } = await readBody(event)

    if (!userId || !query) {
      return {
        error: 'Missing userId or query',
        memories: [],
      }
    }

    console.log(`[API] Retrieving memories for user: ${userId}, query: ${query}`)

    // 调用记忆检索函数
    const memories = await retrieveMemories(userId, query)

    console.log(`[API] Found ${memories.length} memories`)

    return {
      memories,
    }
  }
  catch (error) {
    console.error('Error retrieving memories:', error)
    return {
      error: 'Failed to retrieve memories',
      details: error instanceof Error ? error.message : String(error),
      memories: [],
    }
  }
})
