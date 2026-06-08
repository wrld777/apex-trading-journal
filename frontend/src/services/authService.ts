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
}