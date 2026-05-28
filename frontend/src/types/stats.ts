export interface SessionStatsDto {
  session: string
  pnL: number
  totalTrades: number
  winRate: number
}

export interface SetupStatsDto {
  setup: string
  pnL: number
  totalTrades: number
  winRate: number
}

export interface DayOfWeekStatsDto {
  day: string
  pnL: number
  totalTrades: number
}

export interface DailyPnLDto {
  date: string
  pnL: number
  totalTrades: number
}

export interface StatsDto {
  netPnL: number
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