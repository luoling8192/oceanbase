<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { generateText } from 'xsai'
import ChatInterface from '../components/ChatInterface.vue'

// 定义类型
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

// 状态变量
const userId = ref('洛灵 / RainbowBird') // 可以从登录状态获取
const messages = ref<Message[]>([])
const isLoading = ref(false)

// 配置 xsai
const llmConfig = {
  apiKey: import.meta.env.VITE_LLM_COMPLETION_API_KEY || '',
  baseURL: import.meta.env.VITE_LLM_COMPLETION_API_BASEURL || '',
  model: import.meta.env.VITE_LLM_COMPLETION_MODEL || '',
}

// 存储记忆到后端
async function storeMemory(type: string, content: string) {
  try {
    const response = await fetch('/api/memories/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId.value,
        type,
        content,
      }),
    })

    if (!response.ok)
      throw new Error('Failed to store memory')

    const data = await response.json()
    return data.success
  }
  catch (error) {
    console.error('Error storing memory:', error)
    return false
  }
}

// 发送消息到 AI
async function sendMessage(userInput: string) {
  if (!userInput.trim())
    return

  // 显示用户消息
  messages.value.push({ role: 'user', content: userInput })
  isLoading.value = true

  try {
    // 可以在这里分析用户输入并决定是否存储为记忆
    // 例如，如果检测到用户在分享兴趣
    if (userInput.toLowerCase().includes('我喜欢') || userInput.toLowerCase().includes('我感兴趣')) {
      await storeMemory('interest', userInput)
    }

    // 1. 获取记忆
    const memories = await fetchMemories(userInput)

    // 2. 将记忆添加到对话上下文
    const contextWithMemories = buildContextWithMemories(memories)

    // 3. 使用 xsai 直接向 LLM 发送请求
    const response = await generateText({
      ...llmConfig,
      messages: [
        // 系统提示
        {
          role: 'system',
          content: '你是一个有记忆能力的助手，能够记住用户的兴趣、学习目标和知识水平。请基于用户的记忆提供个性化回复。',
        },
        // 记忆上下文
        ...contextWithMemories,
        // 用户当前消息
        { role: 'user', content: userInput },
      ],
    })

    // 添加助手回复
    messages.value.push({ role: 'assistant', content: response.text })
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

// 从后端 API 获取相关记忆
async function fetchMemories(query: string): Promise<Memory[]> {
  try {
    const response = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.value, query }),
    })

    if (!response.ok)
      throw new Error('Failed to fetch memories')

    const data = await response.json()
    return data.memories || []
  }
  catch (error) {
    console.error('Error fetching memories:', error)
    return []
  }
}

// 构建包含记忆的对话上下文
function buildContextWithMemories(memories: Memory[]): Message[] {
  if (!memories.length)
    return []

  // 将记忆格式化为有意义的上下文信息
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

// 在组件挂载时可以初始化一些欢迎消息
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

    <ChatInterface
      class="flex-1"
      :messages="messages"
      :is-loading="isLoading"
      @send="sendMessage"
    />
  </div>
</template>
