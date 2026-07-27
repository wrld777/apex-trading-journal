import apiClient from './apiClient'
import type {
  DisciplinePointDto,
  Granularity,
  RuleImpactDto,
  StrategyStatsDto,
} from '../types/analytics'

export const analyticsService = {
  // userId is derived server-side from the JWT (Authorization header).
  getStrategyStats: async (): Promise<StrategyStatsDto[]> => {
    const res = await apiClient.get<StrategyStatsDto[]>('/api/analytics/strategies')
    return res.data
  },

  getRuleImpact: async (strategyId: string): Promise<RuleImpactDto[]> => {
    const res = await apiClient.get<RuleImpactDto[]>(`/api/analytics/strategies/${strategyId}/rules`)
    return res.data
  },

  getDiscipline: async (granularity: Granularity): Promise<DisciplinePointDto[]> => {
    const res = await apiClient.get<DisciplinePointDto[]>('/api/analytics/discipline', {
      params: { granularity },
    })
    return res.data
  },
}
