import apiClient from './apiClient'
import type { StatsDto } from '../types/stats'

interface StatsParams {
  from?: string
  to?: string
}

export const statsService = {
  // userId is derived server-side from the JWT (Authorization header).
  get: async ({ from, to }: StatsParams = {}): Promise<StatsDto> => {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to)   params.to   = to
    const res = await apiClient.get<StatsDto>('/api/stats', { params })
    return res.data
  },
}
