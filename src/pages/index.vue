<script setup lang="ts">
import { ofetch } from 'ofetch'
import { onMounted, ref } from 'vue'
import { generateText } from 'xsai'

// Define types
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Memory {
  id: number
  userId: string
  type: 'interest' | 'learning_goal' | 'knowledge_level' | 'key_point'
  content: string
  createdAt: string
}

// State variables
const userId = ref('洛灵 / RainbowBird') // Can be retrieved from login state
const messages = ref<Message[]>([])
const isLoading = ref(false)
const userInput = ref('')

// Configure xsai
const llmConfig = {
  apiKey: import.meta.env.VITE_LLM_COMPLETION_API_KEY || '',
  baseURL: import.meta.env.VITE_LLM_COMPLETION_API_BASEURL || '',
  model: import.meta.env.VITE_LLM_COMPLETION_MODEL || '',
}

// Store memory to backend
async function storeMemory(type: string, content: string) {
  try {
    const data = await ofetch('/api/memories/store', {
      method: 'POST',
      body: {
        userId: userId.value,
        type,
        content,
      },
    })
    return data.success
  }
  catch (error) {
    console.error('Error storing memory:', error)
    return false
  }
}

// Handle sending message
async function handleSendMessage() {
  const input = userInput.value.trim()
  if (!input || isLoading.value)
    return

  // Display user message
  messages.value.push({ role: 'user', content: input })
  isLoading.value = true
  userInput.value = ''

  try {
    // Analyze user input to determine if it should be stored as memory
    // For example, if user is sharing interests
    if (input.toLowerCase().includes('我喜欢') || input.toLowerCase().includes('我感兴趣')) {
      await storeMemory('interest', input)
    }

    // 1. Get memories
    const memories = await fetchMemories(input)

    // 2. Add memories to conversation context
    const contextWithMemories = buildContextWithMemories(memories)

    // 3. Send request to LLM using xsai
    const response = await generateText({
      ...llmConfig,
      messages: [
        // System prompt
        {
          role: 'system',
          content: '你是一个有记忆能力的助手，能够记住用户的兴趣、学习目标和知识水平。请基于用户的记忆提供个性化回复。',
        },
        // Memory context
        ...contextWithMemories,
        // Current user message
        { role: 'user', content: input },
      ],
    })

    // Add assistant reply
    if (response.text) {
      messages.value.push({ role: 'assistant', content: response.text })
    }
  }
  catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，处理您的消息时出现了错误。请稍后再试。',
    })
  }
  finally {
    isLoading.value = false
  }
}

// Fetch relevant memories from backend API
async function fetchMemories(query: string): Promise<Memory[]> {
  try {
    const data = await ofetch('/api/memories', {
      method: 'POST',
      body: { userId: userId.value, query },
    })
    return data.memories || []
  }
  catch (error) {
    console.error('Error fetching memories:', error)
    return []
  }
}

// Build conversation context with memories
function buildContextWithMemories(memories: Memory[]): Message[] {
  if (!memories.length)
    return []

  // Format memories into meaningful context
  const memoryText = memories
    .map(m => `${m.type}: ${m.content}`)
    .join('\n')

  return [
    {
      role: 'system',
      content: `用户的相关记忆:\n${memoryText}\n\n请基于这些记忆提供个性化回复。`,
    },
  ]
}

// Initialize welcome message on component mount
onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: '你好！我是一个有记忆功能的助手。我能记住你的兴趣和学习目标，提供更加个性化的帮助。有什么我可以帮你的吗？',
  })
})
</script>

<template>
  <div class="mx-auto flex flex-col h-screen max-w-2xl container">
    <header p-4 border-b="~ gray-200">
      <h1 text-xl font-bold>
        Memory-Enhanced Chat
      </h1>
      <p text-sm text-gray-500>
        Talk with our AI that remembers your interests and learning goals
      </p>
    </header>

    <div class="chat-container" flex="~ col" h="full">
      <div class="chat-messages" flex="~ col" p-4 flex-1 gap-4 overflow-y-auto>
        <template v-if="messages.length === 0">
          <div text-gray-500 p-4 text-center>
            开始对话！我会记住你的兴趣和学习目标。
          </div>
        </template>

        <div
          v-for="(msg, index) in messages"
          v-show="msg.role !== 'system'"
          :key="index"
          class="message p-3 rounded-lg max-w-4/5"
          :class="[
            msg.role === 'user' ? 'self-end bg-teal-500 text-white'
            : msg.role === 'system' ? 'self-center bg-gray-100 text-gray-500 italic text-sm'
              : 'self-start bg-gray-200',
          ]"
        >
          {{ msg.content }}
        </div>

        <div v-if="isLoading" p-3 self-start animate-pulse>
          思考中...
        </div>
      </div>

      <div class="chat-input" p-4 border-t="~ gray-200">
        <form flex gap-2 @submit.prevent="handleSendMessage">
          <input
            v-model="userInput"
            placeholder="输入你的消息..."
            w="full"
            p-2
            border="~ rounded gray-300"
            focus:outline="none"
            focus:border="teal-500"
            @keydown.enter.prevent="handleSendMessage"
          >
          <button
            type="submit"
            class="text-white px-4 py-2 rounded bg-teal-500 btn"
            :disabled="!userInput.trim() || isLoading"
            hover:bg-teal-600
            disabled:opacity-50
          >
            发送
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
