import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tradeService } from '../services/tradeService'
import { useAuthStore } from '../store/authStore'
import type { CreateTradeRequest } from '../types/trade'

export function useTrades() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['trades', userId],
    queryFn: () => tradeService.getMine(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useCreateTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTradeRequest) => tradeService.create(data),
    onSuccess: () => {
      // Invalidate stats and the trades list so the UI reflects the new trade
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    },
  })
}
