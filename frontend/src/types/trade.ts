export type Direction = 'Long' | 'Short'
export type TradeStatus = 'Win' | 'Loss' | 'BreakEven'

// Per-trade adherence: which strategy rule was followed on this trade (ADR 0003).
// Sent on create/update — the server persists a TradeRuleCheck row per entry.
export interface TradeRuleCheckInput {
  strategyRuleId: string
  checked: boolean
}

// Adherence as returned on a trade: rule metadata is denormalized (joined from
// StrategyRule) so the trade view can render the checklist without a second fetch.
export interface TradeRuleCheckDto {
  strategyRuleId: string
  label: string
  order: number
  required: boolean
  checked: boolean
}

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
  // Strategy link + adherence (ADR 0003). strategyId is nullable for trades
  // logged without a strategy; ruleChecks is empty in that case.
  strategyId: string | null
  strategyName: string | null
  ruleChecks: TradeRuleCheckDto[]
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
  // ADR 0003 — optional strategy + per-rule adherence captured at log time.
  strategyId: string | null
  ruleChecks: TradeRuleCheckInput[]
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