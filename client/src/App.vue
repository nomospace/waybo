<template>
  <div class="page">
    <!-- PC端侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span>🦞</span>
        <h1>脱水微博</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" :class="{ active: $route.path === '/' }">
          <span>🏠</span>
          <span>首页</span>
        </router-link>
        <router-link to="/summary" :class="{ active: $route.path === '/summary' }">
          <span>📊</span>
          <span>摘要</span>
        </router-link>
        <router-link to="/vip" :class="{ active: $route.path === '/vip' }">
          <span>👥</span>
          <span>大V</span>
        </router-link>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>