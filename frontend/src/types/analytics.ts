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
  // L'incertezza dell'expectancy: con pochi trade "+0.85R" è un intervallo, non
  // un numero, e leggerlo come assodato è il modo più comune di rovinarsi una
  // strategia che funzionava.
  expectancyRStdErr: number
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


// ── Le letture che dicono *perché* i numeri sono quelli ──────────────────────

/** Quanto costa un errore, contato invece che raccontato. */
export interface MistakeImpactDto {
  tag: string
  occurrences: number
  netR: number
  netPnL: number
  winRate: number
  /** R medio con l'etichetta meno R medio senza: è il costo dell'errore. */
  avgRDelta: number
}

/** Come si va dopo una perdita, rispetto a tutto il resto. */
export interface TiltDto {
  afterLoss: MetricsBlockDto
  afterWin: MetricsBlockDto
  baseline: MetricsBlockDto
  medianMinutesAfterLoss: number
}

export interface SequenceBucketDto {
  position: number
  label: string
  metrics: MetricsBlockDto
  netPnL: number
}

/** Il primo, il secondo, il terzo trade della giornata. */
export interface SequenceDto {
  buckets: SequenceBucketDto[]
  avgTradesPerDay: number
  maxTradesInADay: number
  tradingDays: number
}

export interface RiskPointDto {
  date: string
  risk: number
  rMultiple: number | null
}

/** Quanto varia il rischio da un trade all'altro. */
export interface RiskConsistencyDto {
  tradesWithRisk: number
  medianRisk: number
  minRisk: number
  maxRisk: number
  /** Coefficiente di variazione in %: sotto 25 la size è di fatto costante. */
  variationPct: number
  points: RiskPointDto[]
}

export interface SlippedRuleDto {
  label: string
  strategyName: string
  timesSkipped: number
  timesTotal: number
}

/** La settimana appena passata, accanto a quella prima. */
export interface WeeklyReviewDto {
  weekStart: string
  thisWeek: MetricsBlockDto
  lastWeek: MetricsBlockDto
  netPnL: number
  lastWeekNetPnL: number
  adherence: number
  lastWeekAdherence: number
  slippedRules: SlippedRuleDto[]
  mistakes: MistakeImpactDto[]
  tradingDays: number
}
