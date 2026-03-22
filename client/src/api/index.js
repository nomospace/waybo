import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

export default {
  getSignInUrl: () => api.get('/auth/signin'),
  checkStatus: () => api.get('/auth/status'),
  logout: () => api.post('/auth/logout'),
  getFollowings: (page) => api.get('/vip/followings', { params: { page } }),
  getVipList: () => api.get('/vip/list'),
  addVip: (data) => api.post('/vip/add', data),
  updateVip: (id, data) => api.patch(`/vip/${id}`, data),
  removeVip: (id) => api.delete(`/vip/${id}`),
  fetchContent: () => api.post('/content/fetch'),
  getContentList: (params) => api.get('/content/list', { params }),
  getSummary: (date) => api.get('/content/summary', { params: { date } })
}