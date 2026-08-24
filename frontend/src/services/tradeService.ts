import apiClient from './apiClient'
import type {
  CreateTradeRequest,
  PagedList,
  TradeDto,
  TradeQuery,
  UpdateTradeRequest,
} from '../types/trade'

// Drop empty/undefined values: the API rejects blank enum/date/sort params.
function toParams(query: TradeQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params[key] = value as string | number
  }
  return params
}

export const tradeService = {
  // userId is derived server-side from the JWT (Authorization header).
  create: async (data: CreateTradeRequest): Promise<TradeDto> => {
    const res = await apiClient.post<TradeDto>('/api/trade', data)
    return res.data
  },

  // GET /api/trade — server-side filtered, sorted and paginated.
  getMine: async (query: TradeQuery = {}): Promise<PagedList<TradeDto>> => {
    const res = await apiClient.get<PagedList<TradeDto>>('/api/trade', {
      params: toParams(query),
    })
    return res.data
  },

  // GET /api/trade/{id} — la lettura completa: aderenza con le etichette delle
  // regole e nome della strategia, che l'elenco paginato non porta.
  getById: async (id: string): Promise<TradeDto> => {
    const res = await apiClient.get<TradeDto>(`/api/trade/${id}`)
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
