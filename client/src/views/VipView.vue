<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <h1 class="header-title">大V管理</h1>
        <div class="flex gap-2">
          <button @click="showBatchAdd = true" class="btn btn-secondary">批量导入</button>
          <button @click="showManualAdd = true" class="btn btn-secondary">手动添加</button>
          <button @click="showAdd = true; loadFollowings()" class="btn btn-primary">+ 从关注添加</button>
        </div>
      </div>
    </header>

    <main class="main">
      <div v-if="vipStore.loading && !vipStore.list.length" class="empty">
        <div class="spinner" style="font-size: 40px;">🌀</div>
      </div>
      
      <div v-else-if="!vipStore.list.length" class="empty">
        <div class="empty-icon">👥</div>
        <p class="empty-text">还没有跟踪任何大V</p>
        <div class="flex gap-3 justify-center" style="margin-top: 16px; flex-wrap: wrap;">
          <button @click="showBatchAdd = true" class="btn btn-primary">批量导入</button>
          <button @click="showManualAdd = true" class="btn btn-secondary">手动添加</button>
          <button @click="showAdd = true; loadFollowings()" class="btn btn-secondary">从关注添加</button>
        </div>
      </div>
      
      <div v-else>
        <article v-for="vip in vipStore.list" :key="vip.id" class="card card-row">
          <img :src="vip.avatar_url || '/default-avatar.svg'" class="avatar" />
          <div class="flex-1" style="min-width: 0;">
            <div class="font-bold truncate">{{ vip.screen_name }}</div>
            <div class="text-xs text-muted">UID: {{ vip.weibo_uid }}</div>
          </div>
          <button @click="vipStore.toggleTracking(vip)" :class="vip.is_tracking ? 'btn-primary' : 'btn-secondary'" class="btn" style="padding: 6px 12px;">
            {{ vip.is_tracking ? '跟踪中' : '已暂停' }}
          </button>
          <button @click="removeVip(vip.id)" style="padding: 8px; background: none; border: none; cursor: pointer; color: #999;">🗑️</button>
        </article>
      </div>
    </main>

    <!-- 批量导入弹窗 -->
    <div v-if="showBatchAdd" class="modal-overlay" @click.self="showBatchAdd = false">
      <div class="modal">
        <h2 class="modal-title">批量导入大V</h2>
        <p class="text-sm text-muted mb-3">每行一个UID，或用逗号分隔</p>
        <textarea v-model="batchInput" placeholder="粘贴UID列表...&#10;1234567890&#10;2345678901" class="input" style="height: 160px; font-size: 14px;" />
        <p class="text-xs text-muted mt-2">已识别 {{ batchUids.length }} 个UID</p>
        <div class="modal-actions">
          <button @click="showBatchAdd = false" class="btn btn-secondary">取消</button>
          <button @click="handleBatchAdd" :disabled="batchUids.length === 0 || adding" class="btn btn-primary">
            {{ adding ? '添加中...' : `添加 ${batchUids.length} 个` }}
          </button>
        </div>
      </div>
    </div>

    <!-- 手动添加弹窗 -->
    <div v-if="showManualAdd" class="modal-overlay" @click.self="showManualAdd = false">
      <div class="modal" style="max-width: 400px;">
        <h2 class="modal-title">手动添加大V</h2>
        <input v-model="manualUid" placeholder="微博UID (如: 1234567890)" class="input mb-3" />
        <input v-model="manualName" placeholder="昵称 (可选)" class="input mb-3" />
        <p class="text-xs text-muted">UID可从微博个人主页URL获取</p>
        <div class="modal-actions">
          <button @click="showManualAdd = false" class="btn btn-secondary">取消</button>
          <button @click="handleManualAdd" :disabled="!manualUid || adding" class="btn btn-primary">
            {{ adding ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 从关注列表添加弹窗 -->
    <div v-if="showAdd" class="modal-overlay" @click.self="showAdd = false">
      <div class="modal" style="max-width: 480px; max-height: 80vh;">
        <div style="position: sticky; top: 0; background: white; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
          <div class="flex items-center justify-between">
            <h2 class="modal-title" style="margin-bottom: 0;">从关注列表添加 {{ followingsList.length ? `(${followingsList.length}人)` : '' }}</h2>
            <button @click="showAdd = false" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">✕</button>
          </div>
        </div>
        
        <div v-if="loadingFollowings" class="empty" style="padding: 40px;">
          <div class="spinner" style="font-size: 32px;">🌀</div>
          <p class="text-muted">正在加载全部关注...</p>
        </div>
        
        <div v-else style="padding-top: 16px;">
          <input v-model="searchKeyword" placeholder="搜索昵称..." class="input mb-3" />
          <div style="max-height: 400px; overflow-y: auto;">
            <div v-for="user in filteredFollowings" :key="user.idstr" @click="handleAdd(user)" class="list-item">
              <img :src="user.profile_image_url" class="avatar avatar-sm" />
              <span class="flex-1">{{ user.screen_name }}</span>
              <span style="color: var(--primary);">+ 添加</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/summary" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>摘要</span>
        </router-link>
        <router-link to="/vip" class="nav-item active">
          <span class="nav-icon">👥</span>
          <span>大V</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVipStore } from '@/stores/vip'
import api from '@/api'

const vipStore = useVipStore()
const showAdd = ref(false)
const showManualAdd = ref(false)
const showBatchAdd = ref(false)
const followingsList = ref([])
const loadingFollowings = ref(false)
const searchKeyword = ref('')
const manualUid = ref('')
const manualName = ref('')
const batchInput = ref('')
const adding = ref(false)

const filteredFollowings = computed(() => {
  if (!searchKeyword.value) return followingsList.value
  return followingsList.value.filter(u => u.screen_name.includes(searchKeyword.value))
})

const batchUids = computed(() => {
  const text = batchInput.value
  const uids = text.split(/[\n,，\s]+/).map(s => s.trim()).filter(s => /^\d{10,}$/.test(s))
  return [...new Set(uids)]
})

onMounted(() => vipStore.loadList())

async function loadFollowings() {
  loadingFollowings.value = true
  try {
    const { data } = await api.getFollowings(1)
    followingsList.value = data.users || []
  } finally {
    loadingFollowings.value = false
  }
}

async function handleAdd(user) {
  await vipStore.addVip(user)
}

async function handleManualAdd() {
  if (!manualUid.value) return
  adding.value = true
  try {
    await api.addVip({
      weibo_uid: manualUid.value,
      screen_name: manualName.value || `用户${manualUid.value.slice(-4)}`,
      avatar_url: ''
    })
    await vipStore.loadList()
    showManualAdd.value = false
    manualUid.value = ''
    manualName.value = ''
  } catch (e) {
    alert('添加失败: ' + (e.response?.data?.error || e.message))
  } finally {
    adding.value = false
  }
}

async function handleBatchAdd() {
  if (batchUids.value.length === 0) return
  adding.value = true
  let success = 0, failed = 0
  try {
    for (const uid of batchUids.value) {
      try {
        await api.addVip({
          weibo_uid: uid,
          screen_name: `用户${uid.slice(-4)}`,
          avatar_url: ''
        })
        success++
      } catch {
        failed++
      }
    }
    await vipStore.loadList()
    showBatchAdd.value = false
    batchInput.value = ''
    alert(`添加完成！成功 ${success} 个，失败 ${failed} 个`)
  } finally {
    adding.value = false
  }
}

async function removeVip(id) {
  if (!confirm('确定移除?')) return
  await api.removeVip(id)
  await vipStore.loadList()
}
</script>