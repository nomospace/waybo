<template>
  <div class="page">
    <header class="header">
      <div class="header-inner">
        <h1 class="header-title">我的收藏</h1>
      </div>
    </header>
    
    <main class="main">
      <div v-if="!list.length" class="empty">
        <div class="empty-icon">❤️</div>
        <p class="empty-text">还没有收藏内容</p>
      </div>
      
      <div v-else>
        <article v-for="item in list" :key="item.id" class="card">
          <div class="flex items-center gap-3 mb-3">
            <img :src="item.vip_avatar" class="avatar avatar-sm" />
            <div>
              <div class="font-bold">{{ item.vip_name }}</div>
              <div class="text-xs text-muted">{{ item.posted_at }}</div>
            </div>
          </div>
          <div style="font-weight: 500;">{{ item.core_viewpoint }}</div>
        </article>
      </div>
    </main>

    <nav class="bottom-nav">
      <div class="bottom-nav-inner">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/vip" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>大V</span>
        </router-link>
        <router-link to="/favorites" class="nav-item active">
          <span class="nav-icon">❤️</span>
          <span>收藏</span>
        </router-link>
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