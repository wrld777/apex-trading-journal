export type Direction = 'Long' | 'Short'
export type TradeStatus = 'Win' | 'Loss' | 'BreakEven'

// Come si è chiusa un'uscita (#96). Il prezzo si digita solo su 'Manual':
// per gli altri esiti lo deriva il server dai livelli del trade.
export type TradeOutcome = 'TakeProfit' | 'StopLoss' | 'BreakEven' | 'Manual'

// Una singola uscita. In invio il prezzo serve solo se l'esito è manuale; in
// lettura è sempre valorizzato.
export interface TradeExitInput {
  outcome: TradeOutcome
  price?: number
  contracts: number
  time?: string | null
  order: number
}

export interface TradeExitDto {
  outcome: TradeOutcome
  price: number
  contracts: number
  time: string | null
  order: number
}

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
  instrumentId: string
  // Read-only: joined from the instrument catalog server-side (#94).
  symbol: string
  direction: Direction
  entryPrice: number
  stopLoss: number
  takeProfit: number
  exitPrice: number
  quantity: number
  pnL: number
  riskReward: number
  // Lo stesso PnL in unità di rischio, con segno. null quando lo stop coincide
  // con l'entry e l'R non è definito.
  rMultiple: number | null
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
  // Come si è usciti (#96): una riga nel caso normale, più righe sui parziali.
  exits: TradeExitDto[]
}

export interface CreateTradeRequest {
  // The instrument is picked from the catalog: its point value is what turns the
  // price difference into currency (#94). The symbol is no longer free text.
  instrumentId: string
  direction: Direction
  entryPrice: number
  stopLoss: number
  takeProfit: number
  exitPrice: number
  quantity: number
  entryTime: string
  // Quando si è usciti. Senza, la durata di un trade non è calcolabile e
  // `avgHoldMinutes` resta a zero (#53).
  exitTime: string | null
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
  // #96 — o l'esito singolo (uscita unica su tutta la quantità) o le uscite
  // parziali. `exits` vince su `outcome` quando è valorizzata.
  outcome?: TradeOutcome
  exits?: TradeExitInput[]
}

// La PUT rimpiazza il trade per intero, quindi manda gli stessi campi della
// create — compresi quelli "del prima" (strumento, direzione, livelli, size,
// orario d'ingresso). Prima qui c'era solo il "dopo": chi sbagliava un lottaggio
// doveva cancellare il trade e rifarlo.
export type UpdateTradeRequest = CreateTradeRequest
