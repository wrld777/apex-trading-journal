import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { useAuthStore } from '../store/authStore'
import type { Granularity } from '../types/analytics'

export function useStrategyStats() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'strategies', userId],
    queryFn: () => analyticsService.getStrategyStats(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useRuleImpact(strategyId?: string) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'rules', userId, strategyId],
    queryFn: () => analyticsService.getRuleImpact(strategyId!),
    enabled: !!userId && !!strategyId,
    staleTime: 30_000,
  })
}

/** Mese per mese, per tutte le strategie o per una sola. */
export function useMonthly(strategyId?: string) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'monthly', userId, strategyId ?? 'all'],
    queryFn: () => analyticsService.getMonthly(strategyId),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useDiscipline(granularity: Granularity) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'discipline', userId, granularity],
    queryFn: () => analyticsService.getDiscipline(granularity),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
