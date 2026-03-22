import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
  { path: '/', name: 'Home', component: () => import('@/views/HomeView.vue'), meta: { requiresAuth: true } },
  { path: '/vip', name: 'Vip', component: () => import('@/views/VipView.vue'), meta: { requiresAuth: true } },
  { path: '/favorites', name: 'Favorites', component: () => import('@/views/FavoritesView.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (!authStore.checked) await authStore.checkStatus()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) next('/login')
  else if (to.meta.guest && authStore.isLoggedIn) next('/')
  else next()
})

export default router