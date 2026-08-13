export interface SessionStatsDto {
  session: string
  pnL: number
  r: number
  totalTrades: number
  winRate: number
}

export interface SetupStatsDto {
  setup: string
  pnL: number
  r: number
  totalTrades: number
  winRate: number
}

export interface DayOfWeekStatsDto {
  day: string
  pnL: number
  r: number
  totalTrades: number
}

export interface DailyPnLDto {
  date: string
  pnL: number
  r: number
  totalTrades: number
}

export interface StatsDto {
  netPnL: number
  // Gli stessi risultati in unità di rischio: è il metro indipendente dal capitale.
  // rTradeCount dice su quanti trade sono calcolati — quelli con stop sull'entry
  // non hanno un R definito e restano esclusi.
  netR: number
  expectancyR: number
  maxDrawdownR: number
  rTradeCount: number
  winRate: number
  avgRR: number
  profitFactor: number
  maxDrawdown: number
  avgHoldMinutes: number
  totalTrades: number
  winCount: number
  lossCount: number
  breakEvenCount: number
  bestTrade: number
  worstTrade: number
  avgWin: number
  avgLoss: number
  bestStreak: number
  worstStreak: number
  sessionStats: SessionStatsDto[]
  setupStats: SetupStatsDto[]
  dayOfWeekStats: DayOfWeekStatsDto[]
  dailyPnL: DailyPnLDto[]
}
