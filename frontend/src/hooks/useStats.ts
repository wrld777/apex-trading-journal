import { useQuery } from '@tanstack/react-query'
import { statsService } from '../services/statsService'
import { useAuthStore } from '../store/authStore'

export function useStats(from?: string, to?: string) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['stats', userId, from, to],
    queryFn: () => statsService.get({ userId: userId!, from, to }),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
