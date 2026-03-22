import { defineStore } from 'pinia'
import api from '@/api'

export const useContentStore = defineStore('content', {
  state: () => ({
    list: [], total: 0, page: 1, loading: false, fetching: false,
    filters: { vip_id: null, keyword: '', start_date: '', end_date: '' }
  }),
  actions: {
    async loadList(reset = false) {
      if (reset) { this.page = 1; this.list = [] }
      this.loading = true
      try {
        const { data } = await api.getContentList({ ...this.filters, page: this.page })
        this.list = reset ? data.list : [...this.list, ...data.list]
        this.total = data.total
      } finally { this.loading = false }
    },
    async fetchNew() {
      this.fetching = true
      try {
        await api.fetchContent()
        await this.loadList(true)
      } finally { this.fetching = false }
    },
    async loadMore() { this.page++; await this.loadList() },
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
      this.loadList(true)
    }
  }
})