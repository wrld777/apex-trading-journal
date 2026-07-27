// Strategy analytics (#86). All shapes mirror the BE camelCase JSON.

// A reusable block of core metrics, computed over a set of trades.
export interface MetricsBlockDto {
  totalTrades: number
  winRate: number      // %
  expectancy: number   // avg PnL per trade
  avgRR: number
}

// Per-strategy performance, split by adherence to the checklist.
export interface StrategyStatsDto {
  strategyId: string
  strategyName: string
  overall: MetricsBlockDto
  whenFullyAdherent: MetricsBlockDto  // every rule checked
  whenNotAdherent: MetricsBlockDto    // at least one rule skipped
}

// Impact of a single rule on the win rate (respected vs violated).
export interface RuleImpactDto {
  strategyRuleId: string
  label: string
  timesRespected: number
  timesViolated: number
  winRateRespected: number
  winRateViolated: number
  impact: number   // winRateRespected - winRateViolated
}

// One point of the discipline trend (adherence % per week/month).
export interface DisciplinePointDto {
  periodStart: string  // ISO date
  adherenceRate: number // %
  totalTrades: number
}

export type Granularity = 'week' | 'month'
