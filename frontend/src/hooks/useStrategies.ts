import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { strategyService } from '../services/strategyService'
import { useAuthStore } from '../store/authStore'
import type { CreateStrategyRequest, UpdateStrategyRequest } from '../types/strategy'

export function useStrategies() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['strategies', userId],
    queryFn: () => strategyService.getMine(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useCreateStrategy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStrategyRequest) => strategyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStrategyRequest }) =>
      strategyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => strategyService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] })
    },
  })
}
