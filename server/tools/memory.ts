import { tool } from '@xsai/tool'
import * as v from 'valibot'
import { retrieveMemories, storeMemory } from '../models/memory'

// Define tools using @xsai/tool
export const storeMemoryTool = tool({
  name: 'store_memory',
  description: 'Store a memory for a user',
  parameters: v.object({
    userId: v.string(),
    type: v.string(),
    content: v.string(),
  }),
  execute: async ({ userId, type, content }) => {
    return storeMemory(userId, type, content)
  },
})

export const retrieveMemoriesTool = tool({
  name: 'retrieve_memories',
  description: 'Retrieve memories for a user based on a query',
  parameters: v.object({
    userId: v.string(),
    query: v.string(),
  }),
  execute: async ({ userId, query }) => {
    return retrieveMemories(userId, query)
  },
})
