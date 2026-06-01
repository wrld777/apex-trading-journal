import { Fragment } from 'react'
import KpiCard from '../../components/ui/KpiCard'
import { Skeleton, KpiCardSkeleton, TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { useStats } from '../../hooks/useStats'
import { useTrades } from '../../hooks/useTrades'
import { useAuthStore } from '../../store/authStore'
import type { TradeDto } from '../../types/trade'
import type { DailyPnLDto } from '../../types/stats'

const HM_COLOR: Record<string, string> = {
  'hm-0':  'bg-[#141416]',
  'hm-1':  'bg-green-500/15',
  'hm-2':  'bg-green-500/30',
  'hm-3':  'bg-green-500/50',
  'hm-4':  'bg-green-500/75',
  'hm-n1': 'bg-red-500/15',
  'hm-n2': 'bg-red-500/30',
  'hm-n3': 'bg-red-500/50',
}

/* ── HEATMAP ── */
function Heatmap({ daily }: { daily: DailyPnLDto[] }) {
  const days  = ['M', 'T', 'W', 'T', 'F']
  const weeks = 13

  // Index P&L by calendar day (YYYY-MM-DD)
  const pnlByDate = new Map<string, number>()
  for (const d of daily) pnlByDate.set(d.date.slice(0, 10), d.pnL)

  const maxAbs = daily.reduce((m, d) => Math.max(m, Math.abs(d.pnL)), 0)

  // Monday of the current week, then rewind 12 weeks → 13-week window
  const today = new Date()
  const daysFromMonday = (today.getDay() + 6) % 7
  const startMonday = new Date(today)
  startMonday.setDate(today.getDate() - daysFromMonday - (weeks - 1) * 7)

  const keyOf = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

  const bucket = (pnl: number | undefined) => {
    if (pnl === undefined || pnl === 0 || maxAbs === 0) return 'hm-0'
    const ratio = Math.abs(pnl) / maxAbs
    return pnl > 0
      ? `hm-${Math.min(Math.ceil(ratio * 4), 4)}`
      : `hm-n${Math.min(Math.ceil(ratio * 3), 3)}`
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '26px repeat(13, 1fr)', gap: 2 }}>
      {days.map((day, di) => (
        <Fragment key={`row-${di}`}>
          <div className="text-[9px] text-zinc-700 flex items-center justify-end pr-1">{day}</div>
          {Array.from({ length: weeks }).map((_, w) => {
            const cellDate = new Date(startMonday)
            cellDate.setDate(startMonday.getDate() + w * 7 + di)
            const pnl = pnlByDate.get(keyOf(cellDate))
            const cls = bucket(pnl)
            const label = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const title = pnl !== undefined
              ? `${label}: ${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toLocaleString('en-US')}`
              : `${label}: no trades`
            return (
              <div
                key={`${di}-${w}`}
                title={title}
                className={`aspect-square rounded-[2px] cursor-pointer hover:opacity-80 ${HM_COLOR[cls]}`}
              />
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

/* ── EQUITY CURVE ── */
function EquityCurve({ daily }: { daily: DailyPnLDto[] }) {
  if (daily.length === 0) {
    return <div className="h-[180px] flex items-center justify-center text-xs text-zinc-600">No trades yet</div>
  }

  const W = 800, H = 180, pad = 16

  // Cumulative equity (backend returns dailyPnL ascending by date)
  const points: { date: string; value: number }[] = []
  for (const d of daily) {
    const prev = points.length ? points[points.length - 1].value : 0
    points.push({ date: d.date, value: prev + d.pnL })
  }
  const values = points.map(p => p.value)
  const n = points.length

  const minV = Math.min(0, ...values)
  const maxV = Math.max(0, ...values)
  const range = maxV - minV || 1

  const xOf = (i: number) => (n === 1 ? W : (i / (n - 1)) * W)
  const yOf = (v: number) => pad + (1 - (v - minV) / range) * (H - 2 * pad)

  const coords = points.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`)
  const flatY = yOf(values[0]).toFixed(1)
  const line = n === 1 ? `0,${flatY} ${W},${flatY}` : coords.join(' ')
  const area = `${n === 1 ? `0,${flatY} ${W},${flatY}` : coords.join(' ')} ${W},${H} 0,${H}`

  const lastValue = values[n - 1]
  const positive = lastValue >= 0
  const stroke = positive ? '#22c55e' : '#ef4444'
  const lastX = xOf(n - 1)
  const lastY = yOf(lastValue)

  // Up to 4 evenly spaced date labels
  const idx = n === 1 ? [0] : [...new Set([0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1])]
  const labels = idx.map(i => new Date(points[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

  return (
    <>
      <div style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={positive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'} />
              <stop offset="100%" stopColor={positive ? 'rgba(34,197,94,0)'    : 'rgba(239,68,68,0)'} />
            </linearGradient>
          </defs>
          <line x1="0" y1="40"  x2={W} y2="40"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="0" y1="90"  x2={W} y2="90"  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="0" y1="140" x2={W} y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <polygon points={area} fill="url(#eq-grad)" />
          <polyline points={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lastX} cy={lastY} r="4" fill={stroke} />
          <circle cx={lastX} cy={lastY} r="8" fill={positive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'} />
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        {labels.map((d, i) => <span key={i} className="text-[10px] text-zinc-700">{d}</span>)}
      </div>
    </>
  )
}

/* ── RECENT TRADES TABLE ── */
function StatusBadge({ status }: { status: TradeDto['status'] }) {
  const map: Record<TradeDto['status'], string> = {
    Win:       'bg-green-500/10 border-green-500/20 text-green-500',
    Loss:      'bg-red-500/10 border-red-500/20 text-red-500',
    BreakEven: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  }
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] border ${map[status]}`}>{status}</span>
}

function RecentTrades({ trades }: { trades: TradeDto[] }) {
  if (trades.length === 0) {
    return (
      <EmptyState
        title="No trades logged yet"
        description="Your most recent trades will show up here once you log one."
        actionLabel="Log a Trade"
        actionTo="/log-trade"
      />
    )
  }

  const rows = [...trades]
    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
    .slice(0, 8)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="text-[10px] text-zinc-700 uppercase tracking-[0.06em]">
            <th className="font-medium pb-2 pr-3">Symbol</th>
            <th className="font-medium pb-2 pr-3">Side</th>
            <th className="font-medium pb-2 pr-3">Date</th>
            <th className="font-medium pb-2 pr-3">Setup</th>
            <th className="font-medium pb-2 pr-3 text-right">Qty</th>
            <th className="font-medium pb-2 pr-3 text-right">P&L</th>
            <th className="font-medium pb-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="py-2.5 pr-3 text-xs font-medium text-white">{t.symbol}</td>
              <td className="py-2.5 pr-3">
                <span className={`text-[11px] font-medium ${t.direction === 'Long' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.direction === 'Long' ? 'LONG' : 'SHORT'}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-[11px] text-zinc-500">
                {new Date(t.entryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </td>
              <td className="py-2.5 pr-3 text-[11px] text-zinc-500">{t.setup}</td>
              <td className="py-2.5 pr-3 text-[11px] text-zinc-500 text-right font-mono">{t.quantity}</td>
              <td className={`py-2.5 pr-3 text-[11px] text-right font-mono ${t.pnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {fmtPnl(t.pnL)}
              </td>
              <td className="py-2.5 text-right"><StatusBadge status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── HELPERS ── */
function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtPnl(n: number) {
  const s = n >= 0 ? `+$${fmt(n)}` : `-$${fmt(Math.abs(n))}`
  return s
}

/* ── MAIN ── */
export default function Dashboard() {
  const name = useAuthStore((s) => s.name)
  const { data, isLoading, isError } = useStats()
  const { data: trades, isLoading: tradesLoading, isError: tradesError } = useTrades()

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // No data once stats have loaded successfully with zero trades.
  const noData = !isLoading && !isError && (data?.totalTrades ?? 0) === 0

  return (
    <div className="p-4 lg:p-7">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">
            Good morning, {name ?? 'Trader'}.
          </h1>
          <p className="text-xs text-zinc-600">{today} · NQ Futures · Funded $150k</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">May 2025</button>
          <button className="px-3 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">All Time</button>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          Failed to load stats. Check your connection or try again later.
        </div>
      )}

      {noData ? (
        <EmptyState
          title="No trades yet"
          description="Log your first trade to start tracking your performance, equity curve and analytics."
          actionLabel="Log a Trade"
          actionTo="/log-trade"
          className="bg-[#111113] border border-white/[0.04] rounded-[10px]"
        />
      ) : (
      <>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-3.5 mb-3.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Net P&L"
              value={data ? `$${fmt(data.netPnL)}` : '—'}
              delta={data ? `${data.netPnL >= 0 ? '+' : ''}${fmt(data.netPnL / 150000 * 100, 1)}% of capital` : undefined}
              deltaUp={data ? data.netPnL >= 0 : undefined}
            >
              <div className="h-7 mt-2">
                <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
                  <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(34,197,94,0.2)"/><stop offset="100%" stopColor="rgba(34,197,94,0)"/></linearGradient></defs>
                  <polyline points="0,22 15,18 28,20 40,10 55,8 68,12 80,5 100,3" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <polygon points="0,22 15,18 28,20 40,10 55,8 68,12 80,5 100,3 100,28 0,28" fill="url(#lg1)"/>
                </svg>
              </div>
            </KpiCard>

            <KpiCard
              label="Win Rate"
              value={data ? `${fmt(data.winRate, 1)}%` : '—'}
              delta={data ? `${data.winCount}W / ${data.lossCount}L` : undefined}
              deltaUp={data ? data.winRate >= 50 : undefined}
            >
              <div className="h-1 bg-[#1a1a1d] rounded-full overflow-hidden mt-2">
                <div className="h-full bg-green-500 rounded-full" style={{ width: data ? `${data.winRate}%` : '0%' }} />
              </div>
              <div className="text-[10px] text-zinc-700 mt-1.5">
                {data ? `${data.breakEvenCount} B/E` : ''}
              </div>
            </KpiCard>

            <KpiCard
              label="Avg RR"
              value={data ? fmt(data.avgRR, 2) : '—'}
              delta={data ? (data.avgRR >= 2 ? 'Above target' : 'Below target') : undefined}
              deltaUp={data ? data.avgRR >= 2 : undefined}
            >
              <div className="h-7 mt-2">
                <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
                  <polyline points="0,18 12,20 25,14 35,16 48,10 60,7 72,9 85,5 100,4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </KpiCard>

            <KpiCard
              label="Max Drawdown"
              value={data ? `-$${fmt(Math.abs(data.maxDrawdown))}` : '—'}
              delta={data ? `${fmt(Math.abs(data.maxDrawdown) / 150000 * 100, 2)}% of capital` : undefined}
              deltaUp={false}
            >
              <div className="h-1 bg-[#1a1a1d] rounded-full overflow-hidden mt-2">
                <div className="h-full bg-red-500 rounded-full" style={{ width: data ? `${Math.min(Math.abs(data.maxDrawdown) / 7500 * 100, 100)}%` : '0%' }} />
              </div>
              <div className="text-[10px] text-zinc-700 mt-1.5">Limit 5% ($7,500)</div>
            </KpiCard>

            <KpiCard
              label="Profit Factor"
              value={data ? fmt(data.profitFactor, 2) : '—'}
              delta={data ? (data.profitFactor >= 2 ? 'Excellent' : data.profitFactor >= 1 ? 'Good' : 'Negative edge') : undefined}
              deltaUp={data ? data.profitFactor >= 1 : undefined}
            >
              <div className="h-7 mt-2">
                <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
                  <rect x="5"  y="12" width="10" height="15" rx="1" fill="rgba(34,197,94,0.5)"/>
                  <rect x="20" y="8"  width="10" height="19" rx="1" fill="rgba(34,197,94,0.5)"/>
                  <rect x="35" y="15" width="10" height="12" rx="1" fill="rgba(239,68,68,0.4)"/>
                  <rect x="50" y="6"  width="10" height="21" rx="1" fill="rgba(34,197,94,0.5)"/>
                  <rect x="65" y="10" width="10" height="17" rx="1" fill="rgba(34,197,94,0.5)"/>
                  <rect x="80" y="18" width="10" height="9"  rx="1" fill="rgba(239,68,68,0.4)"/>
                </svg>
              </div>
            </KpiCard>
          </>
        )}
      </div>

      {/* Equity Curve */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] mb-3.5 hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Equity Curve</div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-zinc-600">Live</span>
            <div className="w-px h-3 bg-white/[0.04] mx-1" />
            {['1D','1W','1M','3M'].map(t => (
              <button key={t} className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                t === '1W' ? 'bg-[#1a1a1d] border-white/[0.07] text-white' : 'border-white/[0.07] text-zinc-600 hover:text-zinc-400'
              }`}>{t}</button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : (
          <EquityCurve daily={data?.dailyPnL ?? []} />
        )}
      </div>

      {/* Sessions + Setups + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">

        {/* Sessions */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Sessions</div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {(data?.sessionStats ?? []).map(s => (
                <div key={s.session} className="bg-[#141416] border border-white/[0.04] rounded-md px-3.5 py-3 flex flex-col gap-1.5 cursor-pointer hover:border-white/[0.11] hover:-translate-y-px transition-all">
                  <div className="text-[11px] text-zinc-600 uppercase tracking-[0.05em]">{s.session}</div>
                  <div className={`font-display font-bold text-[18px] tracking-tight ${s.pnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {fmtPnl(s.pnL)}
                  </div>
                  <div className="text-[10px] text-zinc-700">
                    {s.totalTrades} trades · {fmt(s.winRate, 0)}% WR
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Setup Performance */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Setup Performance</div>
            <button className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-white/[0.07] hover:text-zinc-400 transition-all">View All</button>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : (
            <div className="flex flex-col">
              {(data?.setupStats ?? []).map(s => {
                const positive = s.pnL >= 0
                return (
                  <div key={s.setup} className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
                    <div className="text-xs text-zinc-400 flex-1">{s.setup}</div>
                    <div className="flex-[2] h-[3px] bg-[#1a1a1d] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${positive ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${s.winRate}%` }} />
                    </div>
                    <div className={`text-[11px] w-9 text-right ${positive ? 'text-green-500' : 'text-amber-500'}`}>
                      {fmt(s.winRate, 0)}%
                    </div>
                    <div className={`text-[11px] w-16 text-right font-mono ${positive ? 'text-green-500' : 'text-zinc-600'}`}>
                      {fmtPnl(s.pnL)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-4">Statistics</div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2">
              {[
                { label: 'Total Trades', value: data ? String(data.totalTrades) : '—',               color: '' },
                { label: 'Best Trade',   value: data ? fmtPnl(data.bestTrade) : '—',                 color: 'text-green-500' },
                { label: 'Worst Trade',  value: data ? fmtPnl(data.worstTrade) : '—',                color: 'text-red-500'   },
                { label: 'Avg Win',      value: data ? `$${fmt(data.avgWin)}` : '—',                 color: '' },
                { label: 'Avg Loss',     value: data ? `-$${fmt(Math.abs(data.avgLoss))}` : '—',     color: 'text-red-500'   },
                { label: 'Best Streak',  value: data ? `${data.bestStreak}W` : '—',                  color: '' },
              ].map((s, i) => (
                <div key={s.label} className={`py-3 border-b border-white/[0.04] ${i % 2 === 1 ? 'pl-4 border-l border-white/[0.04]' : ''} ${i >= 4 ? 'border-b-0' : ''}`}>
                  <div className="text-[10px] text-zinc-700 uppercase tracking-[0.06em] mb-1">{s.label}</div>
                  <div className={`font-display font-bold text-base tracking-tight ${s.color || 'text-white'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] mb-3.5 hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Recent Trades</div>
          <button className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded border border-white/[0.07] hover:text-zinc-400 transition-all">View All →</button>
        </div>
        {tradesLoading ? (
          <TableSkeleton />
        ) : tradesError ? (
          <div className="text-xs text-red-400 py-4 text-center">Failed to load trades.</div>
        ) : (
          <RecentTrades trades={trades ?? []} />
        )}
      </div>

      {/* Heatmap */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px] hover:border-white/[0.07] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Activity Heatmap — Last 13 Weeks</div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-700">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#141416]" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/75" />
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            <Heatmap daily={data?.dailyPnL ?? []} />
          </div>
        </div>
      </div>

      </>
      )}

    </div>
  )
}
