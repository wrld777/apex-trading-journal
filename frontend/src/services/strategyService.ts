import apiClient from './apiClient'
import type {
  CreateStrategyRequest,
  StrategyDto,
  UpdateStrategyRequest,
} from '../types/strategy'

export const strategyService = {
  // userId is derived server-side from the JWT (Authorization header).
  getMine: async (): Promise<StrategyDto[]> => {
    const res = await apiClient.get<StrategyDto[]>('/api/strategy')
    return res.data
  },

  create: async (data: CreateStrategyRequest): Promise<StrategyDto> => {
    const res = await apiClient.post<StrategyDto>('/api/strategy', data)
    return res.data
  },

  update: async (id: string, data: UpdateStrategyRequest): Promise<StrategyDto> => {
    const res = await apiClient.put<StrategyDto>(`/api/strategy/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/strategy/${id}`)
  },
}
