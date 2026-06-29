import apiClient from './apiClient'
import type { CreateTradeRequest, TradeDto, UpdateTradeRequest } from '../types/trade'

export const tradeService = {
  // userId is derived server-side from the JWT (Authorization header).
  create: async (data: CreateTradeRequest): Promise<TradeDto> => {
    const res = await apiClient.post<TradeDto>('/api/trade', data)
    return res.data
  },

  getMine: async (): Promise<TradeDto[]> => {
    const res = await apiClient.get<TradeDto[]>('/api/trade')
    return res.data
  },

  update: async (id: string, data: UpdateTradeRequest): Promise<TradeDto> => {
    const res = await apiClient.put<TradeDto>(`/api/trade/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/trade/${id}`)
  },
}
