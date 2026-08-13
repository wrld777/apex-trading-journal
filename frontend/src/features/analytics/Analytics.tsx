import { useMemo, useState } from 'react'
import { Skeleton } from '../../components/ui/Skeleton'
import { useStats } from '../../hooks/useStats'
import { useTrades } from '../../hooks/useTrades'
import type { DailyPnLDto, DayOfWeekStatsDto, StatsDto } from '../../types/stats'
import type { TradeDto } from '../../types/trade'

/* ── HELPERS ── */
function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtPnl(n: number) {
  return n >= 0 ? `+$${fmt(n)}` : `-$${fmt(Math.abs(n))}`
}

/* ── CSV EXPORT ── */
const CSV_COLUMNS: { label: string; value: (t: TradeDto) => string | number }[] = [
  { label: 'Date',      value: t => new Date(t.entryTime).toISOString() },
  { label: 'Symbol',    value: t => t.symbol },
  { label: 'Direction', value: t => t.direction },
  { label: 'Entry',     value: t => t.entryPrice },
  { label: 'Exit',      value: t => t.exitPrice },
  { label: 'Qty',       value: t => t.quantity },
  { label: 'PnL',       value: t => t.pnL },
  { label: 'RR',        value: t => t.riskReward },
  { label: 'Status',    value: t => t.status },
  { label: 'Session',   value: t => t.session },
  { label: 'Setup',     value: t => t.setup },
]

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function tradesToCsv(trades: TradeDto[]): string {
  const header = CSV_COLUMNS.map(c => c.label).join(',')
  const rows = trades.map(t => CSV_COLUMNS.map(c => csvEscape(c.value(t))).join(','))
  return [header, ...rows].join('\n')
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Cumulative equity values from daily P&L (backend returns ascending by date).
 * `pick` sceglie l'unità: dollari di default, R per le viste che devono restare
 * indipendenti dal capitale.
 */
function cumulative(
  daily: DailyPnLDto[],
  pick: (d: DailyPnLDto) => number = d => d.pnL,
): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = []
  for (const d of daily) {
    const prev = out.length ? out[out.length - 1].value : 0
    out.push({ date: d.date, value: prev + pick(d) })
  }
  return out
}

/** Underwater drawdown series (>= 0) from cumulative equity values. */
function drawdownSeries(values: number[]): number[] {
  const dd: number[] = []
  let peak = 0
  for (const v of values) {
    peak = Math.max(peak, v)
    dd.push(peak - v)
  }
  return dd
}

const DOW_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DOW_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri',
}

function EmptyChart({ height = 180 }: { height?: number }) {
  return <div style={{ height }} className="flex items-center justify-center text-xs text-zinc-600">No data for this range</div>
}

/* ── CUMULATIVE P&L ── */
function CumulativePnLChart({ daily }: { daily: DailyPnLDto[] }) {
  if (daily.length === 0) return <EmptyChart />

  const W = 400, H = 180, pad = 16
  const pts = cumulative(daily)
  const vals = pts.map(p => p.value)
  const n = pts.length
  const minV = Math.min(0, ...vals)
  const maxV = Math.max(0, ...vals)
  const range = maxV - minV || 1

  const x = (i: number) => (n === 1 ? W : (i / (n - 1)) * W)
  const y = (v: number) => pad + (1 - (v - minV) / range) * (H - 2 * pad)

  const coords = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
  const flatY = y(vals[0]).toFixed(1)
  const line = n === 1 ? `0,${flatY} ${W},${flatY}` : coords.join(' ')
  const area = `${n === 1 ? `0,${flatY} ${W},${flatY}` : coords.join(' ')} ${W},${H} 0,${H}`

  const last = vals[n - 1]
  const pos = last >= 0
  const stroke = pos ? '#22c55e' : '#ef4444'
  const zeroY = y(0)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="an-eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={pos ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'} />
          <stop offset="100%" stopColor={pos ? 'rgba(34,197,94,0)'   : 'rgba(239,68,68,0)'} />
        </linearGradient>
      </defs>
      <line x1="0" y1="45"  x2={W} y2="45"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="0" y1="90"  x2={W} y2="90"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="0" y1="135" x2={W} y2="135" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <polygon points={area} fill="url(#an-eq)" />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(255,255,255,0.12)" strokeDasharray="3,3" strokeWidth="1" />
      <text x="4" y={Math.max(y(maxV) + 4, 10)} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">{fmtPnl(maxV)}</text>
      <text x="4" y={zeroY - 3} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">$0</text>
    </svg>
  )
}

/* ── DRAWDOWN ── */
function DrawdownChart({ daily }: { daily: DailyPnLDto[] }) {
  if (daily.length === 0) return <EmptyChart />

  // Il drawdown si misura in R: quante unità di rischio si sono restituite dal
  // picco. Prima era in dollari, letto contro un capitale fisso di fantasia.
  const W = 400, topY = 20, bottomY = 160
  const pts = cumulative(daily, d => d.r)
  const dd = drawdownSeries(pts.map(p => p.value))
  const maxDD = Math.max(...dd, 0)
  const scaleMax = Math.max(maxDD, 1)
  const n = dd.length

  const x = (i: number) => (n === 1 ? W : (i / (n - 1)) * W)
  const y = (v: number) => topY + (v / scaleMax) * (bottomY - topY)

  const coords = dd.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const flatY = y(dd[0]).toFixed(1)
  const line = n === 1 ? `0,${flatY} ${W},${flatY}` : coords.join(' ')
  const area = `${n === 1 ? `0,${flatY} ${W},${flatY}` : coords.join(' ')} ${W},${topY} 0,${topY}`

  const maxIdx = dd.indexOf(maxDD)
  const maxX = x(maxIdx)
  const maxY = y(maxDD)

  return (
    <svg viewBox={`0 0 ${W} 180`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="dd-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(239,68,68,0)" />
          <stop offset="100%" stopColor="rgba(239,68,68,0.2)" />
        </linearGradient>
      </defs>
      <line x1="0" y1={topY} x2={W} y2={topY} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <polygon points={area} fill="url(#dd-grad)" />
      <polyline points={line} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {maxDD > 0 && (
        <>
          <circle cx={maxX} cy={maxY} r="3" fill="#ef4444" />
          <text x={Math.min(maxX + 4, W - 40)} y={maxY + 14} fill="rgba(239,68,68,0.6)" fontSize="9" fontFamily="monospace">
            −{maxDD.toFixed(2)}R
          </text>
        </>
      )}
    </svg>
  )
}

/* ── DAY OF WEEK ── */
function DayOfWeekChart({ dow }: { dow: DayOfWeekStatsDto[] }) {
  const byDay = new Map(dow.map(d => [d.day, d.pnL]))
  const bars = DOW_ORDER.map(day => ({ day: DOW_SHORT[day], pnl: byDay.get(day) ?? 0 }))
  const maxAbs = Math.max(...bars.map(b => Math.abs(b.pnl)), 1)

  return (
    <div className="flex items-end gap-2 h-[100px] pb-1">
      {bars.map(b => {
        const pos = b.pnl >= 0
        const h = (Math.abs(b.pnl) / maxAbs) * 90
        return (
          <div key={b.day} className="flex-1 flex flex-col items-center gap-1" title={`${b.day}: ${fmtPnl(b.pnl)}`}>
            <div className={`w-full rounded-t-sm ${pos ? 'bg-green-500/50' : 'bg-red-500/45'}`} style={{ height: Math.max(h, b.pnl !== 0 ? 4 : 0) }} />
            <div className="text-[9px] text-zinc-700">{b.day}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── WIN / LOSS DONUT ── */
function WinLossDonut({ winCount, lossCount, winRate }: { winCount: number; lossCount: number; winRate: number }) {
  const total = winCount + lossCount
  const C = 2 * Math.PI * 38 // ≈ 238.76
  const winDash = total > 0 ? (winCount / total) * C : 0
  const lossDash = total > 0 ? (lossCount / total) * C : 0

  return (
    <>
      <div className="flex items-center justify-center py-2">
        <svg width="90" height="90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#141416" strokeWidth="18" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="18"
            strokeDasharray={`${winDash} ${C - winDash}`} strokeDashoffset="0" strokeLinecap="round"
            transform="rotate(-90 50 50)" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="18"
            strokeDasharray={`${lossDash} ${C - lossDash}`} strokeDashoffset={`${-winDash}`} strokeLinecap="round"
            transform="rotate(-90 50 50)" />
          <text x="50" y="47" textAnchor="middle" fill="#f4f4f5" fontSize="13" fontFamily="Syne, sans-serif" fontWeight="700">{fmt(winRate, 1)}%</text>
          <text x="50" y="59" textAnchor="middle" fill="#3f3f46" fontSize="7" fontFamily="monospace">WIN RATE</text>
        </svg>
      </div>
      <div className="flex justify-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500" />Wins {winCount}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600"><div className="w-1.5 h-1.5 rounded-full bg-red-500" />Losses {lossCount}</div>
      </div>
    </>
  )
}

/* ── MONTHLY CALENDAR ── */
function Calendar({ daily, refDate }: { daily: DailyPnLDto[]; refDate: Date }) {
  const year = refDate.getFullYear()
  const month = refDate.getMonth()

  const pnlByDay = new Map<number, number>()
  for (const d of daily) {
    const dt = new Date(d.date)
    if (dt.getFullYear() === year && dt.getMonth() === month) {
      pnlByDay.set(dt.getDate(), (pnlByDay.get(dt.getDate()) ?? 0) + d.pnL)
    }
  }
  const maxAbs = Math.max(...[...pnlByDay.values()].map(Math.abs), 1)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadOffset = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const cells: React.ReactNode[] = []
  for (let i = 0; i < leadOffset; i++) cells.push(<div key={`empty-${i}`} className="aspect-square" />)

  for (let d = 1; d <= daysInMonth; d++) {
    const pnl = pnlByDay.get(d)
    let cls = 'bg-[#141416] text-zinc-700'
    if (pnl !== undefined && pnl !== 0) {
      const strong = Math.abs(pnl) > 0.6 * maxAbs
      cls = pnl > 0
        ? (strong ? 'bg-green-500/22 text-green-500 border border-green-500/25' : 'bg-green-500/12 text-green-500 border border-green-500/15')
        : 'bg-red-500/10 text-red-500 border border-red-500/12'
    }
    const pnlStr = pnl !== undefined && pnl !== 0
      ? (pnl > 0 ? `+$${(pnl / 1000).toFixed(1)}k` : `-$${(Math.abs(pnl) / 1000).toFixed(1)}k`)
      : ''

    cells.push(
      <div
        key={d}
        title={pnl !== undefined ? `${month + 1}/${d}: ${fmtPnl(pnl)}` : `${month + 1}/${d}`}
        className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all hover:opacity-80 hover:scale-105 ${cls}`}
      >
        <span className="text-[9px] leading-none">{d}</span>
        {pnlStr && <span className="text-[8px] font-medium leading-none">{pnlStr}</span>}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-[9px] text-zinc-700 uppercase tracking-widest pb-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>
    </div>
  )
}

/* ── KPI / KEY STATS BUILDERS ── */
function kpiBar(s: StatsDto) {
  return [
    { label: 'Net P&L',       value: fmtPnl(s.netPnL),                  color: s.netPnL >= 0 ? 'text-green-500' : 'text-red-500' },
    { label: 'Win Rate',      value: `${fmt(s.winRate, 1)}%`,           color: 'text-white' },
    { label: 'Avg RR',        value: `${fmt(s.avgRR, 2)}R`,             color: 'text-white' },
    { label: 'Profit Factor', value: s.totalTrades === 0 ? '—' : s.profitFactor === null ? '∞' : fmt(s.profitFactor, 2), color: 'text-white' },
    { label: 'Max DD',        value: `-$${fmt(Math.abs(s.maxDrawdown))}`, color: 'text-red-500' },
    { label: 'Avg Hold',      value: `${fmt(s.avgHoldMinutes, 0)} min`, color: 'text-white' },
    { label: 'Best Streak',   value: `${s.bestStreak}W`,                color: 'text-white' },
  ]
}
function keyStats(s: StatsDto) {
  return [
    { label: 'Avg Winner',   value: `+$${fmt(s.avgWin)}`,             color: 'text-green-500' },
    { label: 'Avg Loser',    value: `-$${fmt(Math.abs(s.avgLoss))}`,  color: 'text-red-500' },
    { label: 'Largest Win',  value: `+$${fmt(s.bestTrade)}`,          color: 'text-green-500' },
    { label: 'Largest Loss', value: `-$${fmt(Math.abs(s.worstTrade))}`, color: 'text-red-500' },
    { label: 'Avg Hold',     value: `${fmt(s.avgHoldMinutes, 0)} min`, color: 'text-white' },
    { label: 'Best Streak',  value: `${s.bestStreak}W`,               color: 'text-white' },
    { label: 'Worst Streak', value: `${s.worstStreak}L`,              color: 'text-red-500' },
  ]
}

/* ── MAIN ── */
export default function Analytics() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // `to` is made inclusive (end of day) before hitting GET /api/stats
  const { data, isLoading, isError } = useStats(
    from || undefined,
    to ? `${to}T23:59:59` : undefined,
  )
  // For CSV export only: narrow the server fetch to the active range, then the
  // client-side exportRows below applies the exact inclusive bounds. `to` is
  // bumped +1 day so trades on the end day aren't dropped by the server.
  const toExclusive = to
    ? new Date(new Date(`${to}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10)
    : undefined
  const { data: tradesPage } = useTrades({ from: from || undefined, to: toExclusive, pageSize: 100 })
  const trades = tradesPage?.items

  // Trades within the active date range (UTC bounds), oldest first — for CSV export.
  const exportRows = useMemo(() => {
    const fromT = from ? Date.parse(`${from}T00:00:00Z`) : -Infinity
    const toT = to ? Date.parse(`${to}T23:59:59.999Z`) : Infinity
    return (trades ?? [])
      .filter(t => {
        const e = new Date(t.entryTime).getTime()
        return e >= fromT && e <= toT
      })
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
  }, [trades, from, to])

  const handleExport = () => {
    if (exportRows.length === 0) return
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`apex-trades-${stamp}.csv`, tradesToCsv(exportRows))
  }

  const refDate = useMemo(() => {
    if (to) return new Date(to)
    const dp = data?.dailyPnL
    if (dp && dp.length) return new Date(dp[dp.length - 1].date)
    return new Date()
  }, [to, data])

  const monthLabel = refDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const mtd = (data?.dailyPnL ?? [])
    .filter(d => {
      const dt = new Date(d.date)
      return dt.getFullYear() === refDate.getFullYear() && dt.getMonth() === refDate.getMonth()
    })
    .reduce((sum, d) => sum + d.pnL, 0)

  const dateInput = 'bg-[#141416] border border-white/[0.07] rounded-md px-2 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-white/[0.18] [color-scheme:dark]'

  return (
    <div className="p-4 lg:p-7">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Analytics</h1>
          <p className="text-xs text-zinc-600">Deep performance analysis · {data?.totalTrades ?? 0} trades</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            disabled={exportRows.length === 0}
            title={exportRows.length === 0 ? 'No trades to export' : `Export ${exportRows.length} trades`}
            className="px-3 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
          <input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} className={dateInput} aria-label="From date" />
          <span className="text-zinc-700 text-xs">→</span>
          <input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className={dateInput} aria-label="To date" />
          {(from || to) && (
            <button
              onClick={() => { setFrom(''); setTo('') }}
              className="px-2.5 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          Failed to load analytics. Check your connection or try again later.
        </div>
      )}

      {/* KPI Bar */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 mb-4">
        {isLoading || !data ? (
          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5"><Skeleton className="h-5 w-16" /><Skeleton className="h-2.5 w-12" /></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {kpiBar(data).map(k => (
                <div key={k.label} className="flex flex-col gap-0.5">
                  <div className={`font-display font-bold text-lg tracking-tight ${k.color}`}>{k.value}</div>
                  <div className="text-[10px] text-zinc-700 uppercase tracking-widest">{k.label}</div>
                </div>
              ))}
            </div>
            <div className="hidden sm:flex items-center flex-wrap gap-6 lg:gap-8">
              {kpiBar(data).map((k, i, arr) => (
                <div key={k.label} className="flex items-center gap-6 lg:gap-8">
                  <div className="flex flex-col gap-0.5">
                    <div className={`font-display font-bold text-lg lg:text-[20px] tracking-tight ${k.color}`}>{k.value}</div>
                    <div className="text-[10px] text-zinc-700 uppercase tracking-widest">{k.label}</div>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-9 bg-white/[0.04]" />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cumulative P&L + Drawdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Cumulative P&L</div>
          {isLoading ? <Skeleton className="h-[180px] w-full" /> : <CumulativePnLChart daily={data?.dailyPnL ?? []} />}
        </div>

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Drawdown Analysis</div>
          {isLoading ? <Skeleton className="h-[180px] w-full" /> : <DrawdownChart daily={data?.dailyPnL ?? []} />}
        </div>
      </div>

      {/* Day of Week + Win/Loss + Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-3.5">
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">P&L by Day of Week</div>
          {isLoading ? <Skeleton className="h-[100px] w-full" /> : <DayOfWeekChart dow={data?.dayOfWeekStats ?? []} />}
        </div>

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-2">Win / Loss Split</div>
          {isLoading || !data ? (
            <div className="flex items-center justify-center py-2"><Skeleton className="h-[90px] w-[90px] rounded-full" /></div>
          ) : (
            <WinLossDonut winCount={data.winCount} lossCount={data.lossCount} winRate={data.winRate} />
          )}
        </div>

        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-3">Key Stats</div>
          {isLoading || !data ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : (
            <div className="flex flex-col">
              {keyStats(data).map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-zinc-500">{s.label}</span>
                  <span className={`text-xs font-mono font-medium ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Calendar */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Monthly P&L Calendar — {monthLabel}</div>
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border ${
            mtd >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {fmtPnl(mtd)} MTD
          </span>
        </div>
        {isLoading ? <Skeleton className="h-[200px] w-full" /> : <Calendar daily={data?.dailyPnL ?? []} refDate={refDate} />}
      </div>

    </div>
  )
}
