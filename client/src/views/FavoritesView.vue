<template>
  <div class="min-h-screen pb-20 sm:pb-0">
    <header class="sticky top-0 bg-white dark:bg-gray-800 border-b p-4">
      <div class="max-w-7xl mx-auto"><h1 class="font-bold text-lg">我的收藏</h1></div>
    </header>
    <main class="max-w-7xl mx-auto p-4">
      <div v-if="!list.length" class="text-center py-20">
        <div class="text-6xl mb-4">❤️</div>
        <p class="text-gray-500">还没有收藏内容</p>
      </div>
      <div v-else class="space-y-4">
        <article v-for="item in list" :key="item.id" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
          <header class="flex items-center gap-3 mb-3">
            <img :src="item.vip_avatar" class="w-10 h-10 rounded-full" />
            <div><div class="font-semibold">{{ item.vip_name }}</div><div class="text-xs text-gray-400">{{ item.posted_at }}</div></div>
          </header>
          <section class="font-medium">{{ item.core_viewpoint }}</section>
        </article>
      </div>
    </main>
    <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t sm:hidden z-40">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">🏠</span><span class="text-xs mt-1">首页</span></router-link>
        <router-link to="/vip" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">👥</span><span class="text-xs mt-1">大V</span></router-link>
        <router-link to="/favorites" class="flex flex-col items-center py-2 px-4 text-primary"><span class="text-xl">❤️</span><span class="text-xs mt-1">收藏</span></router-link>
        <router-link to="/settings" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">⚙️</span><span class="text-xs mt-1">设置</span></router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const list = ref([])

onMounted(async () => {
  const { data } = await api.getFavorites()
  list.value = data.list
})
</script>