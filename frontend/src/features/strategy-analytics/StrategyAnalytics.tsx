import { useMemo, useState } from 'react'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useDiscipline, useRuleImpact, useStrategyStats } from '../../hooks/useAnalytics'
import type {
  DisciplinePointDto,
  Granularity,
  MetricsBlockDto,
  RuleImpactDto,
  StrategyStatsDto,
} from '../../types/analytics'

/* ── HELPERS ── */
function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtPnl(n: number) {
  return n >= 0 ? `+$${fmt(n)}` : `-$${fmt(Math.abs(n))}`
}
function pnlColor(n: number) {
  return n > 0 ? 'text-green-500' : n < 0 ? 'text-red-500' : 'text-zinc-400'
}
/** Risultato in unità di rischio: il metro che non dipende dalla size. */
function fmtR(n: number) {
  return `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n), 2)}R`
}

const card = 'bg-[#111113] border border-white/[0.04] rounded-[10px] hover:border-white/[0.07] transition-colors'
const label = 'text-[11px] text-zinc-600 uppercase tracking-widest'

/* ── METRIC COLUMN (one of Overall / Adherent / Not adherent) ── */
function MetricColumn({ title, block, accent }: { title: string; block: MetricsBlockDto; accent: string }) {
  const empty = block.totalTrades === 0
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest truncate">{title}</span>
      </div>
      {empty ? (
        <div className="text-zinc-700 text-lg font-display font-bold">—</div>
      ) : (
        <>
          <div className="font-display font-bold text-[22px] leading-none text-white mb-1.5">{fmt(block.winRate, 1)}%</div>
          <div className="flex flex-col gap-0.5">
            {/* L'expectancy in R viene prima: è quella con cui si confrontano
                due strategie. I dollari restano sotto come riferimento. */}
            <Row k="Expectancy" v={fmtR(block.expectancyR)} vc={pnlColor(block.expectancyR)} />
            <Row k="in $" v={fmtPnl(block.expectancy)} vc="text-zinc-500" />
            <Row k="Avg RR" v={fmt(block.avgRR, 2)} />
            <Row k="Trades" v={String(block.totalTrades)} />
          </div>
        </>
      )}
    </div>
  )
}
function Row({ k, v, vc = 'text-zinc-300' }: { k: string; v: string; vc?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-zinc-600">{k}</span>
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
    return { text: 'Funziona quando segui le regole → esecuzione indisciplinata', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400' }
  }
  // Il caso opposto mancava e finiva in "allineati", che è la lettura più
  // sbagliata possibile: se rispettare la checklist va *peggio* che ignorarla,
  // il problema è nelle regole, non nell'esecuzione. È il caso più interessante.
  if (delta <= -15) {
    return { text: 'Va meglio quando le salti → le regole non descrivono ciò che funziona', cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400' }
  }
  if (a.winRate < 45 && n.winRate < 45) {
    return { text: 'Scarsa anche eseguita bene → strategia da rivedere', cls: 'bg-red-500/10 border-red-500/20 text-red-400' }
  }
  return { text: 'Aderenza e risultati allineati', cls: 'bg-zinc-500/10 border-white/10 text-zinc-400' }
}

/* ── STRATEGY CARD ── */
function StrategyCard({ s }: { s: StrategyStatsDto }) {
  const v = verdict(s)
  return (
    <div className={`${card} p-4 lg:p-[18px]`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-white truncate">{s.strategyName}</div>
        <div className={`text-[11px] font-mono ${pnlColor(s.overall.expectancyR)}`} title={`${fmtPnl(s.overall.expectancy)} per trade`}>
          {fmtR(s.overall.expectancyR)} exp
        </div>
      </div>
      <div className="flex gap-3">
        <MetricColumn title="Tutti" block={s.overall} accent="bg-zinc-500" />
        <div className="w-px bg-white/[0.05]" />
        <MetricColumn title="Checklist 100%" block={s.whenFullyAdherent} accent="bg-green-500" />
        <div className="w-px bg-white/[0.05]" />
        <MetricColumn title="Regole saltate" block={s.whenNotAdherent} accent="bg-red-500" />
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
    return <div className="py-8 text-center text-xs text-zinc-600">Nessuna aderenza registrata per questa strategia.</div>

  return (
    <div className="flex flex-col gap-1.5">
      {rules.map(r => {
        // impact ∈ [-100, 100]; scale bar width off its magnitude.
        const width = Math.min(Math.abs(r.impact), 100)
        const pos = r.impact >= 0
        return (
          <div key={r.strategyRuleId} className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[#141416] border border-white/[0.04]">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-200 truncate mb-1">{r.label}</div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                <span className="text-green-500/80">✓ {r.timesRespected} · {fmt(r.winRateRespected, 0)}%</span>
                <span className="text-red-500/80">✗ {r.timesViolated} · {fmt(r.winRateViolated, 0)}%</span>
              </div>
            </div>
            <div className="w-24 shrink-0">
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <div className={`h-full rounded-full ${pos ? 'bg-green-500/70' : 'bg-red-500/70'}`} style={{ width: `${width}%` }} />
              </div>
            </div>
            <div className={`w-14 text-right text-xs font-mono font-medium shrink-0 ${pos ? 'text-green-500' : 'text-red-500'}`}>
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
    return <div className="h-[180px] flex items-center justify-center text-xs text-zinc-600">Nessun dato di aderenza</div>

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
      <polyline points={line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.adherenceRate)} r="2.5" fill="#3b82f6" />
      ))}
      <text x="4" y={y(100) + 10} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">100%</text>
      <text x={W - 4} y={y(last) - 6} textAnchor="end" fill="#3b82f6" fontSize="10" fontFamily="monospace">{fmt(last, 0)}%</text>
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

  const selectCls = 'bg-[#141416] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-white/[0.18] [color-scheme:dark]'

  return (
    <div className="p-4 lg:p-7">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Strategy Insights</h1>
        <p className="text-xs text-zinc-600">Aderenza e disciplina · {strategies?.length ?? 0} strategie con trade</p>
      </div>

      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          Impossibile caricare le analytics. Riprova più tardi.
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
            title="Nessun dato per strategia"
            description="Logga qualche trade selezionando una strategia e spuntando la checklist: qui vedrai come cambia il rendimento quando segui (o salti) le regole."
            actionLabel="Log Trade"
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
            <div className={label}>Impatto per regola</div>
            {strategies && strategies.length > 0 && (
              <select value={activeId} onChange={e => setSelectedId(e.target.value)} className={selectCls} aria-label="Strategia">
                {strategies.map(s => <option key={s.strategyId} value={s.strategyId}>{s.strategyName}</option>)}
              </select>
            )}
          </div>
          {!strategies || strategies.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-600">—</div>
          ) : (
            <>
              <p className="text-[10px] text-zinc-600 mb-3">
                Win rate quando <span className="text-green-500/80">{activeName || 'la regola'}</span> è rispettata vs violata. Barra = impatto.
              </p>
              <RuleImpactTable rules={rules} isLoading={rulesLoading} />
            </>
          )}
        </div>

        {/* Discipline trend */}
        <div className={`${card} p-4 lg:p-[18px]`}>
          <div className="flex items-center justify-between mb-4">
            <div className={label}>Trend disciplina</div>
            <div className="flex items-center gap-1 bg-[#141416] border border-white/[0.07] rounded-md p-0.5">
              {(['week', 'month'] as Granularity[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGran(g)}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-widest transition-all ${
                    gran === g ? 'bg-[#1f1f23] text-white' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {g === 'week' ? 'Settimana' : 'Mese'}
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
