import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

/**
 * Dove sta l'API.
 *
 * In sviluppo Vite e il backend girano su porte diverse, quindi serve un
 * indirizzo assoluto (`VITE_API_URL`). In produzione è il backend stesso a
 * servire questa pagina: l'indirizzo giusto è **nessun indirizzo**, cioè un
 * percorso relativo che segue l'origine da cui il browser ha caricato l'app.
 * È anche ciò che rende l'installazione indifferente al nome della macchina —
 * `localhost`, il nome Tailscale o un dominio funzionano tutti senza ricompilare.
 */
const baseURL = import.meta.env.VITE_API_URL ?? ''
if (!baseURL && import.meta.env.DEV) {
  console.warn('[apiClient] VITE_API_URL non è impostata: in sviluppo le chiamate falliranno. Controlla il file .env.')
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
