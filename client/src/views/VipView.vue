<template>
  <div class="min-h-screen pb-20 sm:pb-0">
    <header class="sticky top-0 bg-white border-b p-4 z-40">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <h1 class="font-bold text-lg">大V管理</h1>
        <div class="flex gap-2">
          <button @click="showManualAdd = true" class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">手动添加</button>
          <button @click="showAdd = true; loadFollowings()" class="px-4 py-2 bg-primary text-white rounded-lg text-sm">+ 从关注添加</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-4">
      <div v-if="vipStore.loading && !vipStore.list.length" class="text-center py-10"><div class="animate-spin text-4xl">🌀</div></div>
      <div v-else-if="!vipStore.list.length" class="text-center py-20">
        <div class="text-6xl mb-4">👥</div>
        <p class="text-gray-500 mb-4">还没有跟踪任何大V</p>
        <div class="flex gap-3 justify-center">
          <button @click="showManualAdd = true" class="px-4 py-2 bg-gray-200 rounded-lg text-sm">手动添加</button>
          <button @click="showAdd = true; loadFollowings()" class="px-4 py-2 bg-primary text-white rounded-lg text-sm">从关注添加</button>
        </div>
      </div>
      <div v-else class="space-y-3">
        <article v-for="vip in vipStore.list" :key="vip.id" class="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
          <img :src="vip.avatar_url" class="w-12 h-12 rounded-full" />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{{ vip.screen_name }}</div>
            <div class="text-xs text-gray-400">UID: {{ vip.weibo_uid }}</div>
          </div>
          <button @click="vipStore.toggleTracking(vip)" :class="vip.is_tracking ? 'bg-primary text-white' : 'bg-gray-200'" class="px-3 py-1.5 rounded-lg text-sm">
            {{ vip.is_tracking ? '跟踪中' : '已暂停' }}
          </button>
          <button @click="removeVip(vip.id)" class="p-2 text-gray-400 hover:text-red-500">🗑️</button>
        </article>
      </div>
    </main>

    <!-- 手动添加弹窗 -->
    <div v-if="showManualAdd" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div class="bg-white w-full max-w-md mx-4 rounded-xl p-6">
        <h2 class="font-bold text-lg mb-4">手动添加大V</h2>
        <div class="space-y-3">
          <input v-model="manualUid" placeholder="微博UID (如: 1234567890)" class="w-full px-3 py-2 border rounded-lg" />
          <input v-model="manualName" placeholder="昵称 (可选)" class="w-full px-3 py-2 border rounded-lg" />
          <p class="text-xs text-gray-400">提示：UID可以从微博个人主页URL中获取</p>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showManualAdd = false" class="flex-1 py-2 bg-gray-200 rounded-lg">取消</button>
          <button @click="handleManualAdd" :disabled="!manualUid || adding" class="flex-1 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
            {{ adding ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 从关注列表添加弹窗 -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div class="bg-white w-full sm:max-w-lg sm:rounded-xl max-h-[80vh] overflow-auto">
        <div class="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 class="font-bold">从关注列表添加 {{ followingsList.length ? `(${followingsList.length}人)` : '' }}</h2>
          <button @click="showAdd = false" class="text-gray-400">✕</button>
        </div>
        <div class="p-4">
          <div v-if="loadingFollowings" class="text-center py-10">
            <div class="animate-spin text-4xl mb-2">🌀</div>
            <p class="text-gray-500">正在加载全部关注...</p>
          </div>
          <div v-else class="space-y-2">
            <input v-model="searchKeyword" placeholder="搜索昵称..." class="w-full px-3 py-2 border rounded-lg bg-white mb-3" />
            <button v-for="user in filteredFollowings" :key="user.idstr" @click="handleAdd(user)" class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
              <img :src="user.profile_image_url" class="w-10 h-10 rounded-full" />
              <span class="flex-1 text-left">{{ user.screen_name }}</span>
              <span class="text-primary">+ 添加</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t sm:hidden z-40">
      <div class="flex justify-around py-2">
        <router-link to="/" class="flex flex-col items-center py-2 px-6 text-gray-500"><span class="text-xl">🏠</span><span class="text-xs mt-1">首页</span></router-link>
        <router-link to="/vip" class="flex flex-col items-center py-2 px-6 text-primary"><span class="text-xl">👥</span><span class="text-xs mt-1">大V</span></router-link>
        <router-link to="/favorites" class="flex flex-col items-center py-2 px-6 text-gray-500"><span class="text-xl">❤️</span><span class="text-xs mt-1">收藏</span></router-link>
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
const followingsList = ref([])
const loadingFollowings = ref(false)
const searchKeyword = ref('')
const manualUid = ref('')
const manualName = ref('')
const adding = ref(false)

const filteredFollowings = computed(() => {
  if (!searchKeyword.value) return followingsList.value
  return followingsList.value.filter(u => u.screen_name.includes(searchKeyword.value))
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

async function removeVip(id) {
  if (!confirm('确定移除?')) return
  await api.removeVip(id)
  await vipStore.loadList()
}
</script>