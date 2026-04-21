import axios from 'axios'

const ambassadorAdminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

ambassadorAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ambassador_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

ambassadorAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ambassador_admin_token')
      localStorage.removeItem('ambassador_admin_user')
      window.location.href = '/ambassador-admin/login'
    }
    return Promise.reject(error)
  }
)

export default ambassadorAdminApi
