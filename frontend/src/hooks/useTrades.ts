import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tradeService } from '../services/tradeService'
import { useAuthStore } from '../store/authStore'
import type { CreateTradeRequest, TradeQuery, UpdateTradeRequest } from '../types/trade'

// Returns a PagedList<TradeDto>: { items, page, pageSize, total }.
export function useTrades(query: TradeQuery = {}) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['trades', userId, query],
    queryFn: () => tradeService.getMine(query),
    enabled: !!userId,
    staleTime: 30_000,
    // Keep the current page visible while the next one loads (no flash).
    placeholderData: keepPreviousData,
  })
}

/** Un singolo trade, per la pagina di dettaglio e per la modifica. */
export function useTrade(id: string | undefined) {
  return useQuery({
    queryKey: ['trade', id],
    queryFn: () => tradeService.getById(id!),
    enabled: !!id,
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

export function useUpdateTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTradeRequest }) =>
      tradeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['trade'] })
    },
  })
}

export function useDeleteTrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tradeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    },
  })
}
