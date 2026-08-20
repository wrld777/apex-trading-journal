// Strategy analytics (#86). All shapes mirror the BE camelCase JSON.

// A reusable block of core metrics, computed over a set of trades.
export interface MetricsBlockDto {
  totalTrades: number
  winRate: number      // %
  expectancy: number   // avg PnL per trade, in $
  // L'expectancy in unità di rischio: quella in dollari cresce con la size,
  // questa no, quindi è l'unica con cui si confrontano due strategie.
  expectancyR: number
  netR: number
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

// Un mese di risultati (#116/pre-deploy). `metrics` è lo stesso blocco delle
// altre viste; `netPnL` è il totale del mese, che `metrics.expectancy` non è
// (quella è una media per trade).
export interface MonthlyPerformanceDto {
  month: string      // ISO date, primo del mese
  netPnL: number
  metrics: MetricsBlockDto
}

// One point of the discipline trend (adherence % per week/month).
export interface DisciplinePointDto {
  periodStart: string  // ISO date
  adherenceRate: number // %
  totalTrades: number
}

export type Granularity = 'week' | 'month'
