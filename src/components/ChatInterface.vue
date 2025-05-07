<script setup lang="ts">
const userId = ref('user1') // In a real app, this would come from auth
const message = ref('')
const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
const isLoading = ref(false)

async function sendMessage() {
  if (!message.value.trim())
    return

  // Add user message to chat
  messages.value.push({ role: 'user', content: message.value })
  const userMessage = message.value
  message.value = ''
  isLoading.value = true

  try {
    // Send message to backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.value, message: userMessage }),
    })

    const data = await response.json()

    if (data.error) {
      messages.value.push({ role: 'assistant', content: `Error: ${data.error}` })
    }
    else {
      // Add response to chat
      messages.value.push({ role: 'assistant', content: data.message || data.content })
    }
  }
  catch (error) {
    console.error('Failed to send message:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, there was an error processing your message.',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="chat-container" flex="~ col" h="full">
    <div class="chat-messages" flex="~ col" p-4 flex-1 gap-4 overflow-y-auto>
      <template v-if="messages.length === 0">
        <div text-gray-500 p-4 text-center>
          Start a conversation! Our AI will remember your interests and learning goals.
        </div>
      </template>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message p-3 rounded-lg max-w-4/5" :class="[
          msg.role === 'user' ? 'self-end bg-teal-500 text-white' : 'self-start bg-gray-200',
        ]"
      >
        {{ msg.content }}
      </div>

      <div v-if="isLoading" p-3 self-start animate-pulse>
        Thinking...
      </div>
    </div>

    <div class="chat-input" p-4 border-t="~ gray-200">
      <form flex gap-2 @submit.prevent="sendMessage">
        <TheInput
          v-model="message"
          placeholder="Type your message..."
          w="full"
          @keydown.enter="sendMessage"
        />
        <button
          type="submit"
          class="btn"
          :disabled="!message.trim() || isLoading"
        >
          Send
        </button>
      </form>
    </div>
  </div>
</template>
