<template>
  <div class="min-h-screen pb-20 sm:pb-0">
    <header class="sticky top-0 bg-white border-b p-4">
      <div class="max-w-7xl mx-auto"><h1 class="font-bold text-lg">设置</h1></div>
    </header>
    <main class="max-w-7xl mx-auto p-4">
      <div class="space-y-4">
        <div class="bg-white rounded-xl p-4 border">
          <h3 class="font-medium mb-3">字体大小</h3>
          <div class="flex gap-2">
            <button v-for="size in ['sm', 'md', 'lg']" :key="size" @click="fontSize = size" :class="fontSize === size ? 'bg-primary text-white' : 'bg-gray-200'" class="px-4 py-2 rounded-lg">
              {{ size === 'sm' ? '小' : size === 'md' ? '中' : '大' }}
            </button>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border">
          <h3 class="font-medium mb-3">关于</h3>
          <p class="text-sm text-gray-500">微博投研脱水工具 v1.0</p>
          <p class="text-sm text-gray-500">个人自用、非商用、非公开</p>
        </div>
        <button @click="handleLogout" class="w-full bg-gray-200 py-3 rounded-xl text-gray-700">退出登录</button>
      </div>
    </main>
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t sm:hidden z-40">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">🏠</span><span class="text-xs mt-1">首页</span></router-link>
        <router-link to="/vip" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">👥</span><span class="text-xs mt-1">大V</span></router-link>
        <router-link to="/favorites" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">❤️</span><span class="text-xs mt-1">收藏</span></router-link>
        <router-link to="/settings" class="flex flex-col items-center py-2 px-4 text-primary"><span class="text-xl">⚙️</span><span class="text-xs mt-1">设置</span></router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const fontSize = ref(localStorage.getItem('fontSize') || 'md')

watch(fontSize, (val) => {
  localStorage.setItem('fontSize', val)
  document.documentElement.style.fontSize = val === 'sm' ? '14px' : val === 'lg' ? '18px' : '16px'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>