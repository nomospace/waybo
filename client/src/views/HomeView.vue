<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <div class="flex items-center gap-3">
          <span style="font-size: 24px;">🦞</span>
          <h1 class="header-title">脱水微博</h1>
        </div>
        <div class="flex gap-2">
          <button @click="handleFetch" :disabled="contentStore.fetching" class="btn btn-primary">
            {{ contentStore.fetching ? '拉取中...' : '拉取' }}
          </button>
          <button @click="showFilter = !showFilter" class="btn btn-secondary" style="padding: 8px 12px;">🔍</button>
        </div>
      </div>
    </header>

    <main class="main">
      <div v-if="showFilter" class="filter-panel">
        <div class="filter-grid">
          <select v-model="filters.vip_id" class="input">
            <option :value="null">全部大V</option>
            <option v-for="v in vipStore.list" :key="v.id" :value="v.id">{{ v.screen_name }}</option>
          </select>
          <input v-model="filters.keyword" @keyup.enter="applyFilters" placeholder="关键词" class="input" />
          <input v-model="filters.start_date" type="date" class="input" />
          <input v-model="filters.end_date" type="date" class="input" />
        </div>
        <div class="filter-actions">
          <button @click="resetFilters" class="btn btn-secondary">重置</button>
          <button @click="applyFilters" class="btn btn-primary">筛选</button>
        </div>
      </div>

      <div v-if="contentStore.loading && !contentStore.list.length" class="empty">
        <div class="spinner" style="font-size: 40px;">🌀</div>
        <p class="text-muted">加载中...</p>
      </div>

      <div v-else-if="!contentStore.list.length" class="empty">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无内容</p>
        <p class="empty-hint">点击右上角「拉取」获取最新内容</p>
      </div>

      <template v-else>
        <article v-for="item in contentStore.list" :key="item.id" class="card">
          <div class="flex items-center gap-3 mb-3">
            <img :src="item.vip_avatar" class="avatar avatar-sm" />
            <div class="flex-1" style="min-width: 0;">
              <div class="font-bold truncate">{{ item.vip_name }}</div>
              <div class="text-xs text-muted">{{ formatTime(item.posted_at) }}</div>
            </div>
          </div>
          
          <div class="mb-3">
            <div style="font-weight: 500;">{{ item.core_viewpoint }}</div>
          </div>
          
          <div v-if="parseTargets(item.targets)?.length" class="mb-3">
            <span v-for="t in parseTargets(item.targets)" :key="t" class="tag">{{ t }}</span>
          </div>
          
          <div class="flex gap-4 pt-3" style="border-top: 1px solid var(--border); font-size: 14px;">
            <button @click="handleFavorite(item)" :style="{ color: item.is_favorite ? '#E53935' : '#999' }" style="padding: 0; background: none; border: none; cursor: pointer;">❤️ 收藏</button>
            <button @click="handleStar(item)" :style="{ color: item.is_starred ? '#F5A623' : '#999' }" style="padding: 0; background: none; border: none; cursor: pointer;">⭐ 标记</button>
          </div>
        </article>

        <div v-if="contentStore.list.length < contentStore.total" class="text-center" style="padding: 16px;">
          <button @click="contentStore.loadMore()" :disabled="contentStore.loading" style="color: var(--primary); background: none; border: none; cursor: pointer;">
            {{ contentStore.loading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </template>
    </main>

    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/vip" class="nav-item" :class="{ active: $route.path === '/vip' }">
          <span class="nav-icon">👥</span>
          <span>大V</span>
        </router-link>
        <router-link to="/favorites" class="nav-item" :class="{ active: $route.path === '/favorites' }">
          <span class="nav-icon">❤️</span>
          <span>收藏</span>
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