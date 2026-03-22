<template>
  <div class="min-h-screen pb-20 sm:pb-0">
    <header class="sticky top-0 z-40 bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🦞</span>
          <h1 class="font-bold text-gray-900">脱水微博</h1>
        </div>
        <div class="flex items-center gap-2">
          <button @click="handleFetch" :disabled="contentStore.fetching" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {{ contentStore.fetching ? '拉取中...' : '拉取' }}
          </button>
          <button @click="showFilter = !showFilter" class="p-2 text-gray-500">🔍</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-4">
      <div v-if="showFilter" class="bg-gray-50 p-4 mb-4 rounded-lg border">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select v-model="filters.vip_id" class="px-3 py-2 border rounded-lg bg-white">
            <option :value="null">全部大V</option>
            <option v-for="v in vipStore.list" :key="v.id" :value="v.id">{{ v.screen_name }}</option>
          </select>
          <input v-model="filters.keyword" @keyup.enter="applyFilters" placeholder="关键词" class="px-3 py-2 border rounded-lg bg-white" />
          <input v-model="filters.start_date" type="date" class="px-3 py-2 border rounded-lg bg-white" />
          <input v-model="filters.end_date" type="date" class="px-3 py-2 border rounded-lg bg-white" />
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <button @click="resetFilters" class="px-4 py-2 text-gray-500">重置</button>
          <button @click="applyFilters" class="px-4 py-2 bg-primary text-white rounded-lg">筛选</button>
        </div>
      </div>

      <div v-if="contentStore.loading && !contentStore.list.length" class="text-center py-20">
        <div class="animate-spin text-4xl mb-4">🌀</div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="!contentStore.list.length" class="text-center py-20">
        <div class="text-6xl mb-4">📭</div>
        <p class="text-gray-500 mb-2">暂无内容</p>
        <p class="text-sm text-gray-400">点击右上角「拉取」获取最新内容</p>
      </div>

      <template v-else>
        <article v-for="item in contentStore.list" :key="item.id" class="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <header class="flex items-center gap-3 mb-3">
            <img :src="item.vip_avatar" class="w-10 h-10 rounded-full" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ item.vip_name }}</div>
              <div class="text-xs text-gray-400">{{ formatTime(item.posted_at) }}</div>
            </div>
          </header>
          <section class="mb-3"><div class="font-medium">{{ item.core_viewpoint }}</div></section>
          <section v-if="parseTargets(item.targets)?.length" class="flex flex-wrap gap-2 mb-3">
            <span v-for="t in parseTargets(item.targets)" :key="t" class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{{ t }}</span>
          </section>
          <footer class="flex gap-4 pt-2 border-t text-sm">
            <button @click="handleFavorite(item)" :class="item.is_favorite ? 'text-red-500' : 'text-gray-400'">❤️ 收藏</button>
            <button @click="handleStar(item)" :class="item.is_starred ? 'text-yellow-500' : 'text-gray-400'">⭐ 标记</button>
          </footer>
        </article>

        <div v-if="contentStore.list.length < contentStore.total" class="text-center py-4">
          <button @click="contentStore.loadMore()" :disabled="contentStore.loading" class="px-6 py-2 text-primary">
            {{ contentStore.loading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </template>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t sm:hidden z-40">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center py-2 px-6" :class="$route.path === '/' ? 'text-primary' : 'text-gray-500'">
          <span class="text-xl">🏠</span><span class="text-xs mt-1">首页</span>
        </router-link>
        <router-link to="/vip" class="flex flex-col items-center py-2 px-6" :class="$route.path === '/vip' ? 'text-primary' : 'text-gray-500'">
          <span class="text-xl">👥</span><span class="text-xs mt-1">大V</span>
        </router-link>
        <router-link to="/favorites" class="flex flex-col items-center py-2 px-6" :class="$route.path === '/favorites' ? 'text-primary' : 'text-gray-500'">
          <span class="text-xl">❤️</span><span class="text-xs mt-1">收藏</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useContentStore } from '@/stores/content'
import { useVipStore } from '@/stores/vip'
import api from '@/api'

const contentStore = useContentStore()
const vipStore = useVipStore()
const showFilter = ref(false)
const filters = reactive({ vip_id: null, keyword: '', start_date: '', end_date: '' })

onMounted(async () => {
  await vipStore.loadList()
  await contentStore.loadList()
})

function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function parseTargets(targets) {
  if (typeof targets === 'string') { try { return JSON.parse(targets) } catch { return targets.split(',') } }
  return targets || []
}

async function handleFetch() { await contentStore.fetchNew() }

async function handleFavorite(item) {
  try {
    if (item.is_favorite) { await api.unfavorite(item.id); item.is_favorite = 0 }
    else { await api.favorite(item.id); item.is_favorite = 1 }
  } catch (e) { console.error(e) }
}

async function handleStar(item) {
  try {
    if (item.is_starred) { await api.unstar(item.id); item.is_starred = 0 }
    else { await api.star(item.id); item.is_starred = 1 }
  } catch (e) { console.error(e) }
}

function applyFilters() { contentStore.updateFilters(filters) }
function resetFilters() { Object.assign(filters, { vip_id: null, keyword: '', start_date: '', end_date: '' }); applyFilters() }
</script>