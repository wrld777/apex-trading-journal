import apiClient from './apiClient'
import type { CreateTradeRequest, TradeDto } from '../types/trade'

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
}
