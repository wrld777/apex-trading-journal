export type Direction = 'Long' | 'Short'
export type TradeStatus = 'Win' | 'Loss' | 'BreakEven'

// Server-side paged response wrapper (GET /api/trade).
export interface PagedList<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

// Query params accepted by GET /api/trade. Only set fields are sent.
export interface TradeQuery {
  from?: string
  to?: string
  symbol?: string
  setup?: string
  session?: string
  direction?: Direction
  status?: TradeStatus
  page?: number
  pageSize?: number
  sort?: 'entryTime' | 'pnl' | 'riskReward' | 'symbol'
  sortDir?: 'asc' | 'desc'
}

export interface TradeDto {
  id: string
  symbol: string
  direction: Direction
  entryPrice: number
  stopLoss: number
  takeProfit: number
  exitPrice: number
  quantity: number
  pnL: number
  riskReward: number
  entryTime: string
  exitTime: string | null
  status: TradeStatus
  session: string
  setup: string
  htfBias: string
  grade: string
  rationale: string
  emotionalState: string
  mistakes: string
  tags: string[]
  screenshots: string[]
  createdAt: string
}

export interface CreateTradeRequest {
  symbol: string
  direction: Direction
  entryPrice: number
  stopLoss: number
  takeProfit: number
  exitPrice: number
  quantity: number
  entryTime: string
  session: string
  setup: string
  htfBias: string
  grade: string
  rationale: string
  emotionalState: string
  mistakes: string
  tags: string[]
  screenshots: string[]
}

export interface UpdateTradeRequest {
  exitPrice: number
  exitTime: string | null
  rationale: string
  emotionalState: string
  mistakes: string
  tags: string[]
  screenshots: string[]
}