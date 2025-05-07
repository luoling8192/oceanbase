<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
function goToChat() {
  router.push('/chat')
}
</script>

<template>
  <div>
    <div i-carbon-campsite text-4xl inline-block />
    <p>
      Memory-Enhanced Chat Application
    </p>
    <p>
      <em text-sm op75>AI chat with memory management</em>
    </p>

    <div py-4 />

    <div>
      <button
        class="btn"
        @click="goToChat"
      >
        Start Chatting
      </button>
    </div>
  </div>
</template>
