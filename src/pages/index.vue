<script setup lang="ts">
import ChatInterface from '../components/ChatInterface.vue'
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

    <ChatInterface class="flex-1" />
  </div>
</template>
