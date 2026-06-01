import apiClient from './apiClient'
import type { CreateTradeRequest, TradeDto } from '../types/trade'

export const tradeService = {
  create: async (userId: string, data: CreateTradeRequest): Promise<TradeDto> => {
    const res = await apiClient.post<TradeDto>('/api/trade', { ...data, userId })
    return res.data
  },

  getByUser: async (userId: string): Promise<TradeDto[]> => {
    const res = await apiClient.get<TradeDto[]>(`/api/trade/${userId}`)
    return res.data
  },
}
