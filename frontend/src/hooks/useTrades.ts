import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tradeService } from '../services/tradeService'
import { useAuthStore } from '../store/authStore'
import type { CreateTradeRequest } from '../types/trade'

export function useCreateTrade() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.userId)

  return useMutation({
    mutationFn: (data: CreateTradeRequest) => {
      if (!userId) throw new Error('User not authenticated')
      return tradeService.create(userId, data)
    },
    onSuccess: () => {
      // Invalidate stats so the Dashboard reflects the new trade
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
