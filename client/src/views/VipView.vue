<template>
  <div class="min-h-screen pb-20 sm:pb-0">
    <header class="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 z-40">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <h1 class="font-bold text-lg">大V管理</h1>
        <button @click="showAdd = true; loadFollowings()" class="px-4 py-2 bg-primary text-white rounded-lg text-sm">+ 添加</button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-4">
      <div v-if="vipStore.loading && !vipStore.list.length" class="text-center py-10"><div class="animate-spin text-4xl">🌀</div></div>
      <div v-else-if="!vipStore.list.length" class="text-center py-20">
        <div class="text-6xl mb-4">👥</div>
        <p class="text-gray-500">还没有跟踪任何大V</p>
        <button @click="showAdd = true; loadFollowings()" class="mt-4 text-primary">从关注列表添加</button>
      </div>
      <div v-else class="space-y-3">
        <article v-for="vip in vipStore.list" :key="vip.id" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 flex items-center gap-3">
          <img :src="vip.avatar_url" class="w-12 h-12 rounded-full" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{{ vip.screen_name }}</div>
            <div class="text-xs text-gray-400">UID: {{ vip.weibo_uid }}</div>
          </div>
          <button @click="vipStore.toggleTracking(vip)" :class="vip.is_tracking ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'" class="px-3 py-1.5 rounded-lg text-sm">
            {{ vip.is_tracking ? '跟踪中' : '已暂停' }}
          </button>
        </article>
      </div>
    </main>

    <div v-if="showAdd" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div class="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-xl max-h-[80vh] overflow-auto">
        <div class="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b flex justify-between items-center">
          <h2 class="font-bold">从关注列表添加</h2>
          <button @click="showAdd = false" class="text-gray-400">✕</button>
        </div>
        <div class="p-4">
          <div v-if="vipStore.loading" class="text-center py-10"><div class="animate-spin text-4xl">🌀</div></div>
          <div v-else class="space-y-2">
            <button v-for="user in vipStore.followings" :key="user.idstr" @click="handleAdd(user)" class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
              <img :src="user.profile_image_url" class="w-10 h-10 rounded-full" />
              <span class="flex-1 text-left">{{ user.screen_name }}</span>
              <span class="text-primary">+ 添加</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t sm:hidden z-40">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">🏠</span><span class="text-xs mt-1">首页</span></router-link>
        <router-link to="/vip" class="flex flex-col items-center py-2 px-4 text-primary"><span class="text-xl">👥</span><span class="text-xs mt-1">大V</span></router-link>
        <router-link to="/favorites" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">❤️</span><span class="text-xs mt-1">收藏</span></router-link>
        <router-link to="/settings" class="flex flex-col items-center py-2 px-4 text-gray-500"><span class="text-xl">⚙️</span><span class="text-xs mt-1">设置</span></router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVipStore } from '@/stores/vip'

const vipStore = useVipStore()
const showAdd = ref(false)

onMounted(() => vipStore.loadList())

async function loadFollowings() {
  await vipStore.loadFollowings(1)
}

async function handleAdd(user) {
  await vipStore.addVip(user)
  showAdd.value = false
}
</script>