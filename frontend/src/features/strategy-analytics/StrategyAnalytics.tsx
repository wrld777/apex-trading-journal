import { useMemo, useState } from 'react'

import { t } from '../../i18n'

import { useDiscipline, useRuleImpact, useStrategyStats } from '../../hooks/useAnalytics'
import type {
  DisciplinePointDto,
  Granularity,
  MetricsBlockDto,
  RuleImpactDto,
  StrategyStatsDto,
} from '../../types/analytics'
import { EmptyState, Skeleton } from '../../design-system'

/* ── HELPERS ── */
function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtPnl(n: number) {
  return n >= 0 ? `+$${fmt(n)}` : `-$${fmt(Math.abs(n))}`
}
function pnlColor(n: number) {
  return n > 0 ? 'text-pos' : n < 0 ? 'text-neg' : 'text-content-secondary'
}
/** Risultato in unità di rischio: il metro che non dipende dalla size. */
function fmtR(n: number) {
  return `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n), 2)}R`
}

const card = 'bg-surface border border-line rounded-[10px] hover:border-line-2 transition-colors'
const label = 'text-[11px] text-content-muted uppercase tracking-widest'

/* ── METRIC COLUMN (one of Overall / Adherent / Not adherent) ── */
function MetricColumn({ title, block, accent }: { title: string; block: MetricsBlockDto; accent: string }) {
  const empty = block.totalTrades === 0
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
        <span className="text-[10px] text-content-secondary uppercase tracking-widest truncate">{title}</span>
      </div>
      {empty ? (
        <div className="text-content-faint text-lg font-mono font-medium">—</div>
      ) : (
        <>
          <div className="font-mono font-medium text-[22px] leading-none text-content-strong mb-1.5">{fmt(block.winRate, 1)}%</div>
          <div className="flex flex-col gap-0.5">
            {/* L'expectancy in R viene prima: è quella con cui si confrontano
                due strategie. I dollari restano sotto come riferimento. */}
            <Row k={t('insights.expectancy')} v={fmtR(block.expectancyR)} vc={pnlColor(block.expectancyR)} />
            <Row k={t('insights.inDollars')} v={fmtPnl(block.expectancy)} vc="text-content-secondary" />
            <Row k={t('insights.avgRR')} v={fmt(block.avgRR, 2)} />
            <Row k={t('insights.tradesLabel')} v={String(block.totalTrades)} />
          </div>
        </>
      )}
    </div>
  )
}
function Row({ k, v, vc = 'text-content' }: { k: string; v: string; vc?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-content-muted">{k}</span>
      <span className={`text-[11px] font-mono ${vc}`}>{v}</span>
    </div>
  )
}

/* ── VERDICT: disciplined execution vs weak strategy ── */
function verdict(s: StrategyStatsDto): { text: string; cls: string } | null {
  const a = s.whenFullyAdherent
  const n = s.whenNotAdherent
  // Need enough signal on both sides to say anything meaningful.
  if (a.totalTrades < 2 || n.totalTrades < 2) return null
  const delta = a.winRate - n.winRate
  if (delta >= 15) {
    return { text: t('insights.verdictDisciplined'), cls: 'bg-warn/10 border-warn/20 text-warn' }
  }
  // Il caso opposto mancava e finiva in "allineati", che è la lettura più
  // sbagliata possibile: se rispettare la checklist va *peggio* che ignorarla,
  // il problema è nelle regole, non nell'esecuzione. È il caso più interessante.
  if (delta <= -15) {
    return { text: t('insights.verdictInverted'), cls: 'bg-brand/10 border-brand/20 text-brand' }
  }
  if (a.winRate < 45 && n.winRate < 45) {
    return { text: t('insights.verdictWeak'), cls: 'bg-neg/10 border-neg/20 text-neg' }
  }
  return { text: t('insights.verdictAligned'), cls: 'bg-neutral2/10 border-white/10 text-content-secondary' }
}

/* ── STRATEGY CARD ── */
function StrategyCard({ s }: { s: StrategyStatsDto }) {
  const v = verdict(s)
  return (
    <div className={`${card} p-4 lg:p-[18px]`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-content-strong truncate">{s.strategyName}</div>
        <div className={`text-[11px] font-mono ${pnlColor(s.overall.expectancyR)}`} title={t('insights.expTitle', { value: fmtPnl(s.overall.expectancy) })}>
          {t('insights.expShort', { value: fmtR(s.overall.expectancyR) })}
        </div>
      </div>
      <div className="flex gap-3">
        <MetricColumn title={t('insights.all')} block={s.overall} accent="bg-content-muted" />
        <div className="w-px bg-white/[0.05]" />
        <MetricColumn title={t('insights.fullChecklist')} block={s.whenFullyAdherent} accent="bg-pos" />
        <div className="w-px bg-white/[0.05]" />
        <MetricColumn title={t('insights.rulesSkipped')} block={s.whenNotAdherent} accent="bg-neg" />
      </div>
      {v && (
        <div className={`mt-4 px-3 py-2 rounded-md border text-[11px] ${v.cls}`}>{v.text}</div>
      )}
    </div>
  )
}

/* ── RULE IMPACT TABLE ── */
function RuleImpactTable({ rules, isLoading }: { rules: RuleImpactDto[] | undefined; isLoading: boolean }) {
  if (isLoading) return <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
  if (!rules || rules.length === 0)
    return <div className="py-8 text-center text-xs text-content-muted">{t('insights.noAdherence')}</div>

  return (
    <div className="flex flex-col gap-1.5">
      {rules.map(r => {
        // impact ∈ [-100, 100]; scale bar width off its magnitude.
        const width = Math.min(Math.abs(r.impact), 100)
        const pos = r.impact >= 0
        return (
          <div key={r.strategyRuleId} className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface-2 border border-line">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-content truncate mb-1">{r.label}</div>
              <div className="flex items-center gap-3 text-[10px] text-content-muted font-mono">
                <span className="text-pos/80 font-mono">✓ {r.timesRespected} · {fmt(r.winRateRespected, 0)}%</span>
                <span className="text-neg/80 font-mono">✗ {r.timesViolated} · {fmt(r.winRateViolated, 0)}%</span>
              </div>
            </div>
            <div className="w-24 shrink-0">
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <div className={`h-full rounded-full ${pos ? 'bg-pos/70' : 'bg-neg/70'}`} style={{ width: `${width}%` }} />
              </div>
            </div>
            <div className={`w-14 text-right text-xs font-mono font-medium shrink-0 ${pos ? 'text-pos' : 'text-neg'}`}>
              {pos ? '+' : ''}{fmt(r.impact, 0)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── DISCIPLINE TREND (adherence % over time) ── */
function DisciplineChart({ points }: { points: DisciplinePointDto[] }) {
  if (points.length === 0)
    return <div className="h-[180px] flex items-center justify-center text-xs text-content-muted">{t('insights.noAdherenceData')}</div>

  const W = 400, H = 180, pad = 18
  const n = points.length
  const vals = points.map(p => p.adherenceRate)
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * (W - pad) + pad / 2)
  const y = (v: number) => pad + (1 - v / 100) * (H - 2 * pad) // 0..100 fixed scale

  const coords = points.map((p, i) => `${x(i).toFixed(1)},${y(p.adherenceRate).toFixed(1)}`)
  const line = n === 1 ? `${pad / 2},${y(vals[0])} ${W},${y(vals[0])}` : coords.join(' ')
  const area = `${line} ${x(n - 1).toFixed(1)},${H - pad} ${x(0).toFixed(1)},${H - pad}`
  const last = vals[n - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="disc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0)" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map(g => (
        <line key={g} x1="0" y1={y(g)} x2={W} y2={y(g)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <line x1="0" y1={y(100)} x2={W} y2={y(100)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" strokeWidth="1" />
      <polygon points={area} fill="url(#disc-grad)" />
      <polyline points={line} fill="none" stroke="rgb(var(--c-brand))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.adherenceRate)} r="2.5" fill="rgb(var(--c-brand))" />
      ))}
      <text x="4" y={y(100) + 10} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">100%</text>
      <text x={W - 4} y={y(last) - 6} textAnchor="end" fill="rgb(var(--c-brand))" fontSize="10" fontFamily="monospace">{fmt(last, 0)}%</text>
    </svg>
  )
}

/* ── MAIN ── */
export default function StrategyAnalytics() {
  const { data: strategies, isLoading, isError } = useStrategyStats()
  const [selectedId, setSelectedId] = useState<string>('')
  const [gran, setGran] = useState<Granularity>('week')

  // Default the rule-impact selector to the first strategy with trades.
  const activeId = selectedId || strategies?.[0]?.strategyId || ''
  const { data: rules, isLoading: rulesLoading } = useRuleImpact(activeId || undefined)
  const { data: discipline, isLoading: discLoading } = useDiscipline(gran)

  const activeName = useMemo(
    () => strategies?.find(s => s.strategyId === activeId)?.strategyName ?? '',
    [strategies, activeId],
  )

  const selectCls = 'bg-surface-2 border border-line-2 rounded-md px-2.5 py-1.5 text-[11px] text-content outline-none focus:border-line-control [color-scheme:dark]'

  return (
    <div className="p-4 lg:p-7">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-sans font-bold text-xl tracking-tight text-content-strong leading-none mb-1">{t('insights.title')}</h1>
        <p className="text-xs text-content-muted">{t('insights.subtitle', { count: strategies?.length ?? 0 })}</p>
      </div>

      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-neg/10 border border-neg/20 text-neg text-xs">
          {t('insights.loadFailed')}
        </div>
      )}

      {/* Per-strategy cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[190px] w-full rounded-[10px]" />)}
        </div>
      ) : !strategies || strategies.length === 0 ? (
        <div className={`${card} mb-3.5`}>
          <EmptyState
            title={t('insights.emptyTitle')}
            description={t('insights.emptyBody')}
            actionLabel={t('nav.logTrade')}
            actionTo="/log-trade"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
          {strategies.map(s => <StrategyCard key={s.strategyId} s={s} />)}
        </div>
      )}

      {/* Rule impact + Discipline trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Rule impact */}
        <div className={`${card} p-4 lg:p-[18px]`}>
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className={label}>{t('insights.ruleImpact')}</div>
            {strategies && strategies.length > 0 && (
              <select value={activeId} onChange={e => setSelectedId(e.target.value)} className={selectCls} aria-label={t('insights.strategyAria')}>
                {strategies.map(s => <option key={s.strategyId} value={s.strategyId}>{s.strategyName}</option>)}
              </select>
            )}
          </div>
          {!strategies || strategies.length === 0 ? (
            <div className="py-8 text-center text-xs text-content-muted">—</div>
          ) : (
            <>
              <p className="text-[10px] text-content-muted mb-3">
                {t('insights.ruleImpactHint', { name: activeName || t('common.rule') })}
              </p>
              <RuleImpactTable rules={rules} isLoading={rulesLoading} />
            </>
          )}
        </div>

        {/* Discipline trend */}
        <div className={`${card} p-4 lg:p-[18px]`}>
          <div className="flex items-center justify-between mb-4">
            <div className={label}>{t('insights.disciplineTrend')}</div>
            <div className="flex items-center gap-1 bg-surface-2 border border-line-2 rounded-md p-0.5">
              {(['week', 'month'] as Granularity[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGran(g)}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-widest transition-all ${
                    gran === g ? 'bg-surface-3 text-content-strong' : 'text-content-muted hover:text-content-secondary'
                  }`}
                >
                  {g === 'week' ? t('insights.week') : t('insights.month')}
                </button>
              ))}
            </div>
          </div>
          {discLoading ? <Skeleton className="h-[180px] w-full" /> : <DisciplineChart points={discipline ?? []} />}
        </div>
      </div>
    </div>
  )
}
