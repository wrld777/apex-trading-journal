import apiClient from './apiClient'
import type {
  DisciplinePointDto,
  Granularity,
  MistakeImpactDto,
  MonthlyPerformanceDto,
  RiskConsistencyDto,
  RuleImpactDto,
  SequenceDto,
  StrategyStatsDto,
  TiltDto,
  WeeklyReviewDto,
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

  // Tutte le strategie insieme, oppure una sola: senza il filtro il mese di una
  // strategia sparisce dentro il totale.
  getMonthly: async (strategyId?: string): Promise<MonthlyPerformanceDto[]> => {
    const res = await apiClient.get<MonthlyPerformanceDto[]>('/api/analytics/monthly', {
      params: strategyId ? { strategyId } : undefined,
    })
    return res.data
  },

  getDiscipline: async (granularity: Granularity): Promise<DisciplinePointDto[]> => {
    const res = await apiClient.get<DisciplinePointDto[]>('/api/analytics/discipline', {
      params: { granularity },
    })
    return res.data
  },

  getMistakes: async (): Promise<MistakeImpactDto[]> => {
    const res = await apiClient.get<MistakeImpactDto[]>('/api/analytics/mistakes')
    return res.data
  },

  getTilt: async (): Promise<TiltDto> => {
    const res = await apiClient.get<TiltDto>('/api/analytics/tilt')
    return res.data
  },

  getSequence: async (): Promise<SequenceDto> => {
    const res = await apiClient.get<SequenceDto>('/api/analytics/sequence')
    return res.data
  },

  getRiskConsistency: async (): Promise<RiskConsistencyDto> => {
    const res = await apiClient.get<RiskConsistencyDto>('/api/analytics/risk')
    return res.data
  },

  getWeeklyReview: async (weekStart?: string): Promise<WeeklyReviewDto> => {
    const res = await apiClient.get<WeeklyReviewDto>('/api/analytics/weekly', {
      params: weekStart ? { weekStart } : undefined,
    })
    return res.data
  },
}
