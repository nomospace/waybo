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
  fetchComments: (postId) => api.post(`/content/fetch-comments/${postId}`),
  getContentList: (params) => api.get('/content/list', { params }),
  getContent: (id) => api.get(`/content/${id}`),
  favorite: (contentId) => api.post(`/marks/favorite/${contentId}`),
  unfavorite: (contentId) => api.delete(`/marks/favorite/${contentId}`),
  star: (contentId) => api.post(`/marks/star/${contentId}`),
  unstar: (contentId) => api.delete(`/marks/star/${contentId}`),
  getFavorites: (params) => api.get('/marks/favorites', { params })
}