import { tool } from '@xsai/tool'
import * as v from 'valibot'
import { retrieveMemories, storeMemory } from '../models/memory'

// Define tools using @xsai/tool
export const storeMemoryTool = tool({
  name: 'store_memory',
  description: 'Store a memory for a user. Use this to save important information, preferences, interests, or learning goals.',
  parameters: v.object({
    userId: v.string(),
    type: v.string('Memory type (interest, learning_goal, knowledge_level, key_point)'),
    content: v.string('The actual memory content to store'),
  }),
  execute: async ({ userId, type, content }) => {
    // Log memory storage operation
    // eslint-disable-next-line no-console
    console.log(`[MEMORY STORE] User: ${userId}, Type: ${type}, Content: ${content}`)
    return storeMemory(userId, type, content)
  },
})

export const retrieveMemoriesTool = tool({
  name: 'retrieve_memories',
  description: 'Retrieve memories for a user based on a query. Use this to recall previous information or preferences.',
  parameters: v.object({
    userId: v.string(),
    query: v.string('The search query to find relevant memories'),
  }),
  execute: async ({ userId, query }) => {
    // eslint-disable-next-line no-console
    console.log(`[MEMORY RETRIEVE] User: ${userId}, Query: ${query}`)
    const results = await retrieveMemories(userId, query)
    // eslint-disable-next-line no-console
    console.log(`[MEMORY RESULTS] Found ${results.length} memories`)
    return results
  },
})
