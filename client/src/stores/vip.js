import { defineStore } from 'pinia'
import api from '@/api'

export const useVipStore = defineStore('vip', {
  state: () => ({ list: [], followings: [], loading: false }),
  actions: {
    async loadList() {
      this.loading = true
      try { const { data } = await api.getVipList(); this.list = data.list }
      finally { this.loading = false }
    },
    async loadFollowings(page = 1) {
      this.loading = true
      try { const { data } = await api.getFollowings(page); this.followings = data.users; return data }
      finally { this.loading = false }
    },
    async addVip(user) {
      await api.addVip({ weibo_uid: user.idstr, screen_name: user.screen_name, avatar_url: user.profile_image_url })
      await this.loadList()
    },
    async toggleTracking(vip) {
      await api.updateVip(vip.id, { is_tracking: !vip.is_tracking })
      vip.is_tracking = !vip.is_tracking
    }
  }
})