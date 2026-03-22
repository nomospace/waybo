<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <div class="flex items-center gap-3">
          <span style="font-size: 24px;">🦞</span>
          <h1 class="header-title">每日摘要</h1>
        </div>
        <div class="flex gap-2 items-center">
          <input type="date" v-model="selectedDate" @change="loadSummary" class="input" style="width: 130px; padding: 6px 8px; font-size: 13px;" />
          <button @click="refreshSummary" :disabled="loading" class="btn btn-primary">
            {{ loading ? '刷新中...' : '刷新' }}
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <div v-if="loading && !summary" class="empty">
        <div class="spinner" style="font-size: 40px;">🌀</div>
        <p class="text-muted">加载中...</p>
      </div>

      <div v-else-if="!summary" class="empty">
        <div class="empty-icon">📭</div>
        <p class="empty-text">{{ selectedDate }} 暂无摘要数据</p>
        <p class="empty-hint">试试其他日期或点击刷新拉取最新内容</p>
      </div>

      <template v-else>
        <!-- 统计卡片 -->
        <section class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          <div class="flex-shrink-0 w-24 bg-white rounded-xl shadow-sm border p-3 text-center">
            <div class="text-xl mb-1">📝</div>
            <div class="text-lg font-bold" style="color: var(--blue-text);">{{ summary.total_posts }}</div>
            <div class="text-xs text-muted">今日新帖</div>
          </div>
          <div class="flex-shrink-0 w-24 bg-white rounded-xl shadow-sm border p-3 text-center">
            <div class="text-xl mb-1">👥</div>
            <div class="text-lg font-bold" style="color: var(--blue-text);">{{ summary.total_vips }}</div>
            <div class="text-xs text-muted">活跃大V</div>
          </div>
          <div class="flex-shrink-0 w-24 bg-white rounded-xl shadow-sm border p-3 text-center">
            <div class="text-xl mb-1">📈</div>
            <div class="text-lg font-bold" style="color: #E53935;">{{ bullCount }}</div>
            <div class="text-xs text-muted">看多观点</div>
          </div>
          <div class="flex-shrink-0 w-24 bg-white rounded-xl shadow-sm border p-3 text-center">
            <div class="text-xl mb-1">📉</div>
            <div class="text-lg font-bold" style="color: #43A047;">{{ bearCount }}</div>
            <div class="text-xs text-muted">看空观点</div>
          </div>
          <div class="flex-shrink-0 w-24 bg-white rounded-xl shadow-sm border p-3 text-center">
            <div class="text-xl mb-1">➖</div>
            <div class="text-lg font-bold" style="color: #757575;">{{ neutralCount }}</div>
            <div class="text-xs text-muted">中性观点</div>
          </div>
        </section>

        <!-- 情绪筛选 -->
        <section class="flex gap-2 overflow-x-auto pb-1 mt-3">
          <button @click="filterAttitude = 'all'" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition"
            :style="filterAttitude === 'all' ? 'background: var(--primary); color: white;' : 'background: white; border: 1px solid var(--border); color: var(--text-secondary);'">
            全部
          </button>
          <button @click="filterAttitude = '看多'" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition"
            :style="filterAttitude === '看多' ? 'background: #E53935; color: white;' : 'background: white; border: 1px solid var(--border); color: var(--text-secondary);'">
            看多
          </button>
          <button @click="filterAttitude = '看空'" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition"
            :style="filterAttitude === '看空' ? 'background: #43A047; color: white;' : 'background: white; border: 1px solid var(--border); color: var(--text-secondary);'">
            看空
          </button>
          <button @click="filterAttitude = '中性'" class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition"
            :style="filterAttitude === '中性' ? 'background: #757575; color: white;' : 'background: white; border: 1px solid var(--border); color: var(--text-secondary);'">
            中性
          </button>
        </section>

        <!-- 大V观点列表 -->
        <section class="mt-4 space-y-3">
          <article v-for="vip in filteredSummaries" :key="vip.vip_id" class="card" style="padding: 0; overflow: hidden;">
            <!-- 大V头部 -->
            <div class="flex items-center justify-between p-3" style="border-bottom: 1px solid var(--border); background: #FAFAFA;">
              <div class="flex items-center gap-2">
                <img :src="vip.vip_avatar || '/default-avatar.svg'" class="avatar" style="width: 32px; height: 32px;" />
                <div>
                  <div class="font-medium text-sm">{{ vip.vip_nickname }}</div>
                  <div class="text-xs text-muted">今日 {{ vip.post_count }} 篇</div>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getAttitudeClass(vip.emotion_change)">
                {{ vip.emotion_change }}
              </span>
            </div>
            
            <!-- 核心观点 -->
            <div v-if="vip.core_insight" class="p-3">
              <div class="text-xs text-muted mb-1">💡 核心观点</div>
              <div class="text-sm" style="line-height: 1.6;">{{ vip.core_insight }}</div>
            </div>
            
            <!-- 相关标的 -->
            <div v-if="vip.related_stocks?.length" class="px-3 pb-3">
              <div class="flex flex-wrap gap-1">
                <span v-for="stock in vip.related_stocks.slice(0, 4)" :key="stock.name" 
                  class="px-2 py-0.5 rounded text-xs border"
                  :class="getStockClass(stock.sentiment)">
                  {{ stock.name }}
                </span>
              </div>
            </div>
          </article>
        </section>

        <!-- 底部信息 -->
        <div class="text-center text-xs text-muted py-4">
          数据更新: {{ summary.collect_time || '--' }}
        </div>
      </template>
    </main>

    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/summary" class="nav-item active">
          <span class="nav-icon">📊</span>
          <span>摘要</span>
        </router-link>
        <router-link to="/vip" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>大V</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const selectedDate = ref(new Date().toISOString().split('T')[0])
const summary = ref(null)
const loading = ref(false)
const filterAttitude = ref('all')

const bullCount = computed(() => summary.value?.summaries?.reduce((sum, v) => sum + (v.attitude_distribution?.['看多'] || 0), 0) || 0)
const bearCount = computed(() => summary.value?.summaries?.reduce((sum, v) => sum + (v.attitude_distribution?.['看空'] || 0), 0) || 0)
const neutralCount = computed(() => summary.value?.summaries?.reduce((sum, v) => sum + (v.attitude_distribution?.['中性'] || 0), 0) || 0)

const filteredSummaries = computed(() => {
  if (!summary.value?.summaries) return []
  if (filterAttitude.value === 'all') return summary.value.summaries
  return summary.value.summaries.filter(v => v.emotion_change === filterAttitude.value)
})

onMounted(() => loadSummary())

async function loadSummary() {
  loading.value = true
  try {
    const { data } = await api.getSummary(selectedDate.value)
    summary.value = data
  } catch (e) {
    console.error('加载摘要失败', e)
  } finally {
    loading.value = false
  }
}

async function refreshSummary() {
  loading.value = true
  try {
    await api.fetchContent()
    await loadSummary()
  } finally {
    loading.value = false
  }
}

function getAttitudeClass(attitude) {
  switch (attitude) {
    case '看多': return 'bg-red-100 text-red-700'
    case '看空': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getStockClass(sentiment) {
  switch (sentiment) {
    case '看多': return 'border-red-200 text-red-600'
    case '看空': return 'border-green-200 text-green-600'
    default: return 'border-gray-200 text-gray-600'
  }
}
</script>