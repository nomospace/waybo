<template>
  <div>
    <header class="header">
      <div class="header-inner">
        <h1 class="header-title">📊 每日摘要</h1>
        <div class="flex gap-2 items-center">
          <input type="date" v-model="selectedDate" @change="loadSummary" class="input" style="width: 130px; padding: 8px 10px; font-size: 13px;" />
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

      <div v-else-if="!summary || !summary.summaries?.length" class="empty">
        <div class="empty-icon">📭</div>
        <p class="empty-text">{{ selectedDate }} 暂无摘要数据</p>
        <p class="empty-hint">试试其他日期或点击刷新拉取最新内容</p>
      </div>

      <template v-else>
        <!-- 统计卡片 -->
        <section class="stats-scroll">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value" style="color: var(--blue-text);">{{ summary.total_posts }}</div>
            <div class="stat-label">今日新帖</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value" style="color: var(--blue-text);">{{ summary.total_vips }}</div>
            <div class="stat-label">活跃大V</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-value" style="color: var(--primary);">{{ bullCount }}</div>
            <div class="stat-label">看多观点</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📉</div>
            <div class="stat-value" style="color: var(--green);">{{ bearCount }}</div>
            <div class="stat-label">看空观点</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">➖</div>
            <div class="stat-value" style="color: var(--text-muted);">{{ neutralCount }}</div>
            <div class="stat-label">中性观点</div>
          </div>
        </section>

        <!-- 筛选栏 -->
        <section class="filter-pills">
          <button @click="filterAttitude = 'all'" class="filter-pill" :class="{ active: filterAttitude === 'all' }">全部</button>
          <button @click="filterAttitude = '看多'" class="filter-pill" :class="{ 'active-bull': filterAttitude === '看多' }">看多</button>
          <button @click="filterAttitude = '看空'" class="filter-pill" :class="{ 'active-bear': filterAttitude === '看空' }">看空</button>
          <button @click="filterAttitude = '中性'" class="filter-pill" :class="{ active: filterAttitude === '中性' }">中性</button>
        </section>

        <!-- 大V观点列表 -->
        <section class="content-grid">
          <article v-for="vip in filteredSummaries" :key="vip.vip_id" class="card">
            <!-- 大V头部 -->
            <div class="card-body" style="border-bottom: 1px solid var(--border); background: var(--bg-page);">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <img :src="vip.vip_avatar || '/default-avatar.svg'" class="avatar avatar-sm" />
                  <div>
                    <div class="font-medium">{{ vip.vip_nickname }}</div>
                    <div class="text-xs text-muted">今日 {{ vip.post_count }} 篇</div>
                  </div>
                </div>
                <span class="tag" :class="getTagClass(vip.emotion_change)">{{ vip.emotion_change }}</span>
              </div>
            </div>
            
            <!-- 核心观点 -->
            <div class="card-body" v-if="vip.core_insight">
              <div class="text-xs text-muted mb-2">💡 核心观点</div>
              <p class="text-sm" style="line-height: 1.7;">{{ vip.core_insight }}</p>
            </div>
            
            <!-- 关键发现 -->
            <div class="card-body" v-if="vip.key_findings?.length" style="border-top: 1px solid var(--border); background: var(--bg-page);">
              <div class="text-xs text-muted mb-2">🔍 关键发现</div>
              <ul style="list-style: none; font-size: 13px; line-height: 1.6;">
                <li v-for="(f, i) in vip.key_findings.slice(0, 2)" :key="i" class="mb-1">
                  <span style="color: var(--primary);">•</span> {{ f }}
                </li>
              </ul>
            </div>
            
            <!-- 相关标的 -->
            <div class="card-body" v-if="vip.related_stocks?.length" style="border-top: 1px solid var(--border);">
              <div class="flex flex-wrap gap-1">
                <span v-for="stock in vip.related_stocks.slice(0, 5)" :key="stock.name" 
                  class="tag" :class="getTagClass(stock.sentiment)">
                  {{ stock.name }}
                </span>
              </div>
            </div>
          </article>
        </section>

        <!-- 底部信息 -->
        <div class="text-center text-xs text-muted mt-4 mb-4">
          数据更新: {{ formatTime(summary.collect_time) }}
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

function getTagClass(attitude) {
  switch (attitude) {
    case '看多': return 'tag-bull'
    case '看空': return 'tag-bear'
    default: return ''
  }
}

function formatTime(time) {
  if (!time) return '--'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
</script>