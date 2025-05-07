import process from 'node:process'
import { config } from 'dotenv'
import { createApp, createRouter, defineEventHandler, readBody, toNodeListener } from 'h3'
import { listen } from 'listhen'
import { generateText } from 'xsai'
import { systemMessage } from './prompt'
import { retrieveMemoriesTool, storeMemoryTool } from './tools'

config()

// Initialize XSai with API keys
const llmToolConfig = {
  apiKey: process.env.LLM_TOOL_API_KEY || '',
  baseURL: process.env.LLM_TOOL_API_BASEURL || '',
  model: process.env.LLM_TOOL_MODEL || '',
}

// Create h3 app and router
const app = createApp()
const router = createRouter()

// Memory retrieval endpoint (using LLM function calling)
router.post('/memories/retrieve', defineEventHandler(async (event) => {
  const { userId, query } = await readBody(event)

  if (!userId || !query) {
    return {
      error: 'Missing userId or query',
      memories: [],
    }
  }

  console.log(`[API] Memories retrieval request for ${userId} with query: ${query}`)

  try {
    // Use LLM with the retrieval tool
    const { toolResults } = await generateText({
      ...llmToolConfig,
      messages: [
        { role: 'system', content: 'You are a memory retrieval assistant. Use the retrieve_memories tool to find relevant memories for the user.' },
        { role: 'user', content: `Retrieve memories related to: ${query}` },
      ],
      tools: [await retrieveMemoriesTool],
      maxSteps: 1,
    })

    // Extract the retrieved memories from tool results
    if (toolResults && toolResults.length > 0) {
      const result = toolResults[0]
      if (result.toolName === 'retrieve_memories' && Array.isArray(result.result)) {
        console.log(`[API] Found ${result.result.length} memories via LLM tool call`)
        return { memories: result.result }
      }
    }

    return { memories: [] }
  }
  catch (error) {
    console.error('Error retrieving memories:', error)
    return {
      error: 'Failed to retrieve memories',
      details: error instanceof Error ? error.message : String(error),
      memories: [],
    }
  }
}))

// Memory storage endpoint (using LLM function calling)
router.post('/memories/store', defineEventHandler(async (event) => {
  const { userId, content, type } = await readBody(event)

  if (!userId || !content) {
    return {
      error: 'Missing required fields: userId, content',
      success: false,
    }
  }

  console.log(`[API] Store memory request for ${userId}`)

  try {
    // Use LLM with the storage tool
    const { toolResults } = await generateText({
      ...llmToolConfig,
      messages: [
        { role: 'system', content: 'You are a memory storage assistant. Analyze the content and store it appropriately using the store_memory tool.' },
        { role: 'user', content: `Store this information for user ${userId}: ${content}${type ? ` (type: ${type})` : ''}` },
      ],
      tools: [await storeMemoryTool],
      maxSteps: 1,
    })

    // Check if memory was stored successfully
    if (toolResults && toolResults.length > 0) {
      const result = toolResults[0]
      if (result.toolName === 'store_memory') {
        console.log(`[API] Memory stored successfully via LLM tool call`)
        return { success: true, message: 'Memory stored successfully' }
      }
    }

    return { success: false, error: 'LLM did not store the memory' }
  }
  catch (error) {
    console.error('Error storing memory:', error)
    return {
      error: 'Failed to store memory',
      details: error instanceof Error ? error.message : String(error),
      success: false,
    }
  }
}))

// Chat endpoint to handle both memory retrieval and storage via LLM
router.post('/chat', defineEventHandler(async (event) => {
  const { userId, message } = await readBody(event)

  if (!userId || !message) {
    return {
      error: 'Missing userId or message',
    }
  }

  console.log(`[API] Chat request from ${userId}: ${message}`)

  try {
    // Send message to LLM with tools
    const { text, toolResults } = await generateText({
      ...llmToolConfig,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message },
      ],
      tools: [await storeMemoryTool, await retrieveMemoriesTool],
      maxSteps: 3,
    })

    console.log('[TOOLS USED]', toolResults?.map(r => r.toolName).join(', ') || 'None')

    return { text, toolResults }
  }
  catch (error) {
    console.error('Error processing message:', error)
    return {
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : String(error),
    }
  }
}))

app.use(router)

listen(toNodeListener(app), {
  port: process.env.PORT || 3100,
})
