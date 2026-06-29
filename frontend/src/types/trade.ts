export type Direction = 'Long' | 'Short'
export type TradeStatus = 'Win' | 'Loss' | 'BreakEven'

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