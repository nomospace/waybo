<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <div class="flex items-center gap-3">
          <span style="font-size: 24px;">🦞</span>
          <h1 class="header-title">脱水微博</h1>
        </div>
        <div class="flex gap-2 items-center">
          <input type="date" v-model="selectedDate" @change="applyDateFilter" class="input" style="width: 130px; padding: 6px 8px; font-size: 13px;" />
          <button v-if="selectedDate" @click="clearDateFilter" class="btn btn-secondary" style="padding: 6px 10px; font-size: 12px;">✕</button>
          <button @click="handleFetch" :disabled="contentStore.fetching" class="btn btn-primary">
            {{ contentStore.fetching ? '拉取中...' : '拉取' }}
          </button>
          <button @click="handleLogout" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">退出</button>
        </div>
      </div>
    </header>

    <main class="main">
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
        <article v-for="item in contentStore.list" :key="item.id" class="card" style="padding: 0; overflow: hidden;">
          <!-- 头部：大V信息 -->
          <div class="flex items-center gap-3 p-4" style="border-bottom: 1px solid var(--border);">
            <img :src="item.vip_avatar || '/default-avatar.svg'" class="avatar avatar-sm" />
            <div class="flex-1" style="min-width: 0;">
              <div class="font-bold truncate">{{ item.vip_name }}</div>
              <div class="text-xs text-muted">{{ formatTime(item.posted_at) }}</div>
            </div>
          </div>
          
          <!-- 原始微博内容 -->
          <div class="p-4" style="background: #FAFAFA; border-bottom: 1px solid var(--border);">
            <div class="text-xs text-muted mb-2" style="font-weight: 500;">📝 原文</div>
            <div class="original-text">{{ item.original_content }}</div>
          </div>
          
          <!-- AI脱水解读 -->
          <div class="p-4" style="background: linear-gradient(135deg, #FFF5F5 0%, #FFF 100%);">
            <div class="text-xs mb-3" style="font-weight: 600; color: var(--primary);">🤖 AI脱水</div>
            
            <!-- 核心观点 -->
            <div class="mb-3">
              <div class="text-xs text-muted mb-1">💡 核心观点</div>
              <div style="font-weight: 500; line-height: 1.6;">{{ item.core_viewpoint }}</div>
            </div>
            
            <!-- 标的 -->
            <div v-if="parseTargets(item.targets)?.length" class="mb-3">
              <div class="text-xs text-muted mb-1">🎯 相关标的</div>
              <div class="flex flex-wrap gap-1">
                <span v-for="t in parseTargets(item.targets)" :key="t" class="tag">{{ t }}</span>
              </div>
            </div>
            
            <!-- 逻辑 -->
            <div v-if="item.logic" class="mb-3">
              <div class="text-xs text-muted mb-1">📊 逻辑分析</div>
              <div class="text-sm" style="color: var(--text-secondary); line-height: 1.6;">{{ item.logic }}</div>
            </div>
            
            <!-- 时间框架 + 风险提示 -->
            <div class="flex gap-4 text-xs">
              <div v-if="item.time_frame">
                <span class="text-muted">⏱️ 时间：</span>
                <span>{{ item.time_frame }}</span>
              </div>
              <div v-if="item.risk_warning">
                <span class="text-muted">⚠️ 风险：</span>
                <span style="color: #E53935;">{{ item.risk_warning }}</span>
              </div>
            </div>
            
            <!-- 评论分析 -->
            <div v-if="item.comment_sentiment || item.comment_summary" class="mt-3 pt-3" style="border-top: 1px dashed var(--border);">
              <div class="text-xs text-muted mb-1">💬 评论分析</div>
              <div v-if="item.comment_sentiment" class="mb-1">
                <span class="text-xs" :class="getSentimentClass(item.comment_sentiment)">{{ item.comment_sentiment }}</span>
              </div>
              <div v-if="item.comment_summary" class="text-sm text-muted">{{ item.comment_summary }}</div>
            </div>
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
        <router-link to="/summary" class="nav-item" :class="{ active: $route.path === '/summary' }">
          <span class="nav-icon">📊</span>
          <span>摘要</span>
        </router-link>
        <router-link to="/vip" class="nav-item" :class="{ active: $route.path === '/vip' }">
          <span class="nav-icon">👥</span>
          <span>大V</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useVipStore } from '@/stores/vip'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const contentStore = useContentStore()
const vipStore = useVipStore()
const authStore = useAuthStore()
const selectedDate = ref('')

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

async function handleLogout() {
  if (!confirm('确定退出登录？')) return
  await authStore.logout()
  router.push('/login')
}

function applyDateFilter() {
  contentStore.updateFilters({ date: selectedDate.value || null })
}

function clearDateFilter() {
  selectedDate.value = ''
  contentStore.updateFilters({ date: null })
}

function getSentimentClass(sentiment) {
  switch (sentiment) {
    case '看多': return 'text-red-600'
    case '看空': return 'text-green-600'
    default: return 'text-gray-600'
  }
}
</script>