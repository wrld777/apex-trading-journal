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

/* ── Le letture di comportamento (#pre-deploy) ── */
/* Scritte una per una e non da una fabbrica di hook: un helper che chiama
   `useQuery` dentro sé stesso è un hook travestito da funzione, e ogni regola
   del linter che lo riguarda va poi zittita a mano. Cinque blocchi uguali sono
   più noiosi e più onesti. */

export function useMistakeImpact() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'mistakes', userId],
    queryFn: () => analyticsService.getMistakes(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useTilt() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'tilt', userId],
    queryFn: () => analyticsService.getTilt(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useSequence() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'sequence', userId],
    queryFn: () => analyticsService.getSequence(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useRiskConsistency() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'risk', userId],
    queryFn: () => analyticsService.getRiskConsistency(),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useWeeklyReview(weekStart?: string) {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['analytics', 'weekly', userId, weekStart ?? 'current'],
    queryFn: () => analyticsService.getWeeklyReview(weekStart),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
