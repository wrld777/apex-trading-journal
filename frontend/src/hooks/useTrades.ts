import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tradeService } from '../services/tradeService'
import { useAuthStore } from '../store/authStore'
import type { CreateTradeRequest } from '../types/trade'

export function useTrades() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['trades', userId],
    queryFn: () => tradeService.getByUser(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useCreateTrade() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (data: CreateTradeRequest) => {
      if (!userId) throw new Error('User not authenticated')
      return tradeService.create(userId, data)
    },
    onSuccess: () => {
      // Invalidate stats and the trades list so the UI reflects the new trade
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    },
  })
}
