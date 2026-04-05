<template>
  <div class="page">
    <div class="empty">
      <img src="/logo.svg" alt="脱水微博" style="width: 80px; height: 80px; margin-bottom: 16px;" />
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">脱水微博</h1>
      <p class="text-muted">关注大V，AI脱水，投研更高效</p>
      
      <button @click="handleLogin" :disabled="loading" class="btn btn-primary" style="width: 100%; max-width: 300px; margin-top: 32px; padding: 14px;">
        {{ loading ? '正在跳转...' : '微博登录' }}
      </button>
      
      <p style="margin-top: 24px; font-size: 12px; color: #999;">
        仅支持个人已关注的大V公开内容
      </p>
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