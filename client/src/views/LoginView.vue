<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full text-center">
      <div class="text-6xl mb-6">🦞</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">微博投研脱水工具</h1>
      <p class="text-gray-500 mb-8">关注大V，AI脱水，投研更高效</p>
      <button @click="handleLogin" :disabled="loading" class="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50">
        {{ loading ? '正在跳转...' : '微博登录' }}
      </button>
      <p class="mt-6 text-xs text-gray-400">仅支持个人已关注的大V公开内容</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    const url = await authStore.getSignInUrl()
    window.location.href = url
  } catch { alert('获取授权链接失败'); loading.value = false }
}
</script>