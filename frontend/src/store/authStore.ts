import { create } from 'zustand'

interface AuthState {
  token: string | null
  userId: string | null
  name: string | null
  email: string | null
  setAuth: (token: string, userId: string, name: string, email: string) => void
  clearAuth: () => void
}

const stored = localStorage.getItem('apex-auth')
const initial = stored ? JSON.parse(stored) : { token: null, userId: null, name: null, email: null }

export const useAuthStore = create<AuthState>()((set) => ({
  ...initial,
  setAuth: (token, userId, name, email) => {
    localStorage.setItem('apex-auth', JSON.stringify({ token, userId, name, email }))
    set({ token, userId, name, email })
  },
  clearAuth: () => {
    localStorage.removeItem('apex-auth')
    set({ token: null, userId: null, name: null, email: null })
  },
}))