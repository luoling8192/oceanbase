import process from 'node:process'
import { configDotenv } from 'dotenv'
import { createApp, createRouter, defineEventHandler, readBody, toNodeListener } from 'h3'
import { listen } from 'listhen'
import { generateText } from 'xsai'
// export default app

import { retrieveMemoriesTool, storeMemoryTool } from './tools/memory'

configDotenv()

// Initialize XSai with API keys
const llmToolConfig = {
  apiKey: process.env.LLM_TOOL_API_KEY || '',
  baseURL: process.env.LLM_TOOL_API_BASEURL || '',
  model: process.env.LLM_TOOL_MODEL || '',
}

// const llmCompletionConfig = {
//   apiKey: process.env.LLM_COMPLETION_API_KEY || '',
//   baseURL: process.env.LLM_COMPLETION_API_BASEURL || '',
//   model: process.env.LLM_COMPLETION_MODEL || '',
// }

// Create h3 app and router
const app = createApp()
const router = createRouter()

// Chat endpoint
router.post('/chat', defineEventHandler(async (event) => {
  const { userId, message } = await readBody(event)

  if (!userId || !message) {
    return {
      error: 'Missing userId or message',
    }
  }

  // eslint-disable-next-line no-console
  console.log({ userId, message })

  try {
    // Send message to LLM with tools
    const { text, toolResults } = await generateText({
      ...llmToolConfig,
      messages: [
        { role: 'system', content: `You are a helpful assistant to choice tools to ` },
        { role: 'user', content: message },
      ],
      tools: [await storeMemoryTool, await retrieveMemoriesTool],
      maxSteps: 3,
    })

    // Check if any memory retrieval tools were executed
    if (toolResults && toolResults.length > 0) {
      for (const result of toolResults) {
        // If this is a memory retrieval result
        if (result.toolName === 'retrieve_memories' && Array.isArray(result.result)) {
          // Format the retrieved memories
          const memoryContext = result.result.map((m: any) => `${m.type}: ${m.content}`).join('\n')

          // Send follow-up message with memories to LLM
          const { text: followupText } = await generateText({
            ...llmToolConfig,
            messages: [
              { role: 'user', content: message },
              { role: 'assistant', content: 'I need to check your previous memories.' },
              { role: 'user', content: `Relevant memories:\n${memoryContext}\n\nPlease continue.` },
            ],
          })
          return { text: followupText }
        }
      }
    }

    return { text }
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
