import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({ uid: null, checked: false }),
  getters: { isLoggedIn: (state) => !!state.uid },
  actions: {
    async checkStatus() {
      try {
        const { data } = await api.checkStatus()
        this.uid = data.logged_in ? data.uid : null
      } catch { this.uid = null }
      finally { this.checked = true }
    },
    async getSignInUrl() {
      const { data } = await api.getSignInUrl()
      return data.url
    },
    async logout() {
      await api.logout()
      this.uid = null
    }
  }
})