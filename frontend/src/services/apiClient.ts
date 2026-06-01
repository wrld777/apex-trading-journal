import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

const baseURL = import.meta.env.VITE_API_URL
if (!baseURL) {
  console.warn('[apiClient] VITE_API_URL is not set — API requests will fail. Check your .env file.')
}

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    const isAuthRoute = url.includes('/api/auth/')

    // Expired/invalid session: clear auth and bounce to login.
    if (error.response?.status === 401 && !isAuthRoute) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Global error notifications for connectivity / server failures.
    if (!error.response) {
      useToastStore.getState().addToast('Network error — check your connection and try again.', 'error')
    } else if (error.response.status >= 500) {
      useToastStore.getState().addToast('Server error — please try again later.', 'error')
    }

    return Promise.reject(error)
  },
)

export default apiClient
