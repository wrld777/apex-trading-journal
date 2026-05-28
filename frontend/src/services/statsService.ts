import apiClient from './apiClient'
import type { StatsDto } from '../types/stats'

interface StatsParams {
  userId: string
  from?: string
  to?: string
}

export const statsService = {
  get: async ({ userId, from, to }: StatsParams): Promise<StatsDto> => {
    const params: Record<string, string> = { userId }
    if (from) params.from = from
    if (to)   params.to   = to
    const res = await apiClient.get<StatsDto>('/api/stats', { params })
    return res.data
  },
}