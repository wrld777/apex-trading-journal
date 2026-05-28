import apiClient from './apiClient'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/auth/login', data)
    return res.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/auth/register', data)
    return res.data
  },
}