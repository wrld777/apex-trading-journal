import apiClient from './apiClient'
import type { ChangePasswordRequest, UpdateProfileRequest, UserProfile } from '../types/user'

export const userService = {
  // The authenticated user is derived server-side from the JWT.
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/api/user/me')
    return res.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const res = await apiClient.put<UserProfile>('/api/user/me', data)
    return res.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put('/api/user/me/password', data)
  },
}
