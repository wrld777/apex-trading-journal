import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/authStore'
import type { UpdateProfileRequest } from '../types/user'

export function useProfile() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userService.getProfile(),
    enabled: !!userId,
    staleTime: 60_000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
