<script setup lang="ts">
import { defineEmits, defineProps, ref } from 'vue'

// 定义传入的 props
const props = defineProps({
  messages: {
    type: Array as () => Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// 定义事件
const emit = defineEmits(['send'])

// 用户输入
const userInput = ref('')

// 发送消息
function handleSendMessage() {
  if (!userInput.value.trim() || props.isLoading)
    return

  // 触发发送事件，传递用户输入
  emit('send', userInput.value)

  // 清空输入框
  userInput.value = ''
}
</script>

<template>
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
</template>
