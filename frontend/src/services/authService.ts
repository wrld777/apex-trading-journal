import apiClient from './apiClient'
import type { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse } from '../types/auth'

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/auth/login', data)
    return res.data
  },

  // Register does not return a token — the user must log in afterwards.
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await apiClient.post<RegisterResponse>('/api/auth/register', data)
    return res.data
  },

  // Riesce sempre, anche per un indirizzo che non ha un account: il server non
  // dice quali email sono registrate, e il client non deve fingere di saperlo.
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/api/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/api/auth/reset-password', { token, newPassword })
  },
}