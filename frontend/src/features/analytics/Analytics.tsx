import { useMemo, useState } from 'react'

import { useStats } from '../../hooks/useStats'
import { useTrades } from '../../hooks/useTrades'
import type { StatsDto } from '../../types/stats'
import type { TradeDto } from '../../types/trade'
import { t as tr } from '../../i18n'
import { fmt, fmtPnl } from '../../lib/format'
import { Button, Card, CardHeader, Input, PageHeader, Skeleton } from '../../design-system'
import {
  DayOfWeekChart, DrawdownChart, EquityChart, MonthCalendar, WinLossDonut,
} from '../../components/charts'

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

/* ── KPI / KEY STATS BUILDERS ── */
function kpiBar(s: StatsDto) {
  return [
    { label: tr('dash.netPnl'),       value: fmtPnl(s.netPnL),                  color: s.netPnL >= 0 ? 'text-pos' : 'text-neg' },
    { label: tr('dash.winRate'),      value: `${fmt(s.winRate, 1)}%`,           color: 'text-content-strong' },
    // Niente "R" in coda: il RR è un rapporto fra distanze, non un R-multiplo.
    { label: tr('dash.avgRR'),        value: fmt(s.avgRR, 2),                   color: 'text-content-strong' },
    { label: tr('dash.profitFactor'), value: s.totalTrades === 0 ? '—' : s.profitFactor === null ? '∞' : fmt(s.profitFactor, 2), color: 'text-content-strong' },
    { label: tr('analytics.maxDd'),        value: `-$${fmt(Math.abs(s.maxDrawdown))}`, color: 'text-neg' },
    { label: tr('analytics.avgHold'),      value: tr('analytics.minutes', { count: fmt(s.avgHoldMinutes, 0) }), color: 'text-content-strong' },
    { label: tr('analytics.bestStreak'),   value: `${s.bestStreak}W`,                color: 'text-content-strong' },
  ]
}
function keyStats(s: StatsDto) {
  return [
    { label: tr('analytics.avgWinner'),   value: `+$${fmt(s.avgWin)}`,             color: 'text-pos' },
    { label: tr('analytics.avgLoser'),    value: `-$${fmt(Math.abs(s.avgLoss))}`,  color: 'text-neg' },
    { label: tr('analytics.largestWin'),  value: `+$${fmt(s.bestTrade)}`,          color: 'text-pos' },
    { label: tr('analytics.largestLoss'), value: `-$${fmt(Math.abs(s.worstTrade))}`, color: 'text-neg' },
    { label: tr('analytics.avgHold'),     value: tr('analytics.minutes', { count: fmt(s.avgHoldMinutes, 0) }), color: 'text-content-strong' },
    { label: tr('analytics.bestStreak'),  value: `${s.bestStreak}W`,               color: 'text-content-strong' },
    { label: tr('analytics.worstStreak'), value: `${s.worstStreak}L`,              color: 'text-neg' },
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
    downloadCsv(`rubric-trades-${stamp}.csv`, tradesToCsv(exportRows))
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

  return (
    <>

      {/* Page Header */}
      <PageHeader
        title={tr('analytics.title')}
        subtitle={tr('analytics.subtitle', { count: data?.totalTrades ?? 0 })}
        actions={
          <>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={exportRows.length === 0}
              title={exportRows.length === 0 ? tr('analytics.exportNone') : tr('analytics.exportCount', { count: exportRows.length })}
            >
              {tr('analytics.exportCsv')}
            </Button>
            <Input type="date" className="w-auto" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} aria-label={tr('analytics.fromDate')} />
            <span className="text-content-faint text-xs">→</span>
            <Input type="date" className="w-auto" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} aria-label={tr('analytics.toDate')} />
            {(from || to) && (
              <Button size="sm" onClick={() => { setFrom(''); setTo('') }}>
                {tr('analytics.clear')}
              </Button>
            )}
          </>
        }
      />

      {/* Error banner */}
      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-neg/10 border border-neg/20 text-neg text-xs">
          {tr('analytics.loadFailed')}
        </div>
      )}

      {/* KPI Bar */}
      <Card className="mb-4">
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
                  <div className={`font-mono font-medium text-lg tracking-tight ${k.color}`}>{k.value}</div>
                  <div className="text-[10px] text-content-faint uppercase tracking-widest">{k.label}</div>
                </div>
              ))}
            </div>
            <div className="hidden sm:flex items-center flex-wrap gap-6 lg:gap-8">
              {kpiBar(data).map((k, i, arr) => (
                <div key={k.label} className="flex items-center gap-6 lg:gap-8">
                  <div className="flex flex-col gap-0.5">
                    <div className={`font-mono font-medium text-lg lg:text-[20px] tracking-tight ${k.color}`}>{k.value}</div>
                    <div className="text-[10px] text-content-faint uppercase tracking-widest">{k.label}</div>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-9 bg-white/[0.04]" />}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Cumulative P&L + Drawdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <Card interactive>
          <CardHeader title={tr('analytics.cumulativePnl')} />
          {isLoading ? <Skeleton className="h-[180px] w-full" /> : <EquityChart daily={data?.dailyPnL ?? []} />}
        </Card>

        <Card interactive>
          <CardHeader title={tr('analytics.drawdown')} subtitle={tr('analytics.drawdownHint')} />
          {isLoading ? <Skeleton className="h-[180px] w-full" /> : <DrawdownChart daily={data?.dailyPnL ?? []} />}
        </Card>
      </div>

      {/* Day of Week + Win/Loss + Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-3.5">
        <Card interactive>
          <CardHeader title={tr('analytics.byDayOfWeek')} />
          {isLoading ? <Skeleton className="h-[150px] w-full" /> : <DayOfWeekChart dow={data?.dayOfWeekStats ?? []} />}
        </Card>

        <Card interactive>
          <CardHeader title={tr('analytics.winLossSplit')} />
          {isLoading || !data ? (
            <div className="flex items-center justify-center py-2"><Skeleton className="h-[120px] w-[120px] rounded-full" /></div>
          ) : (
            <WinLossDonut
              winCount={data.winCount}
              lossCount={data.lossCount}
              breakEvenCount={data.breakEvenCount}
              winRate={data.winRate}
            />
          )}
        </Card>

        <Card interactive className="sm:col-span-2 lg:col-span-1">
          <CardHeader title={tr('analytics.keyStats')} />
          {isLoading || !data ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : (
            <div className="flex flex-col">
              {keyStats(data).map(s => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                  <span className="text-xs text-content-secondary">{s.label}</span>
                  <span className={`text-xs font-mono font-medium ${s.color}`}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly Calendar */}
      <Card interactive>
        <CardHeader
          title={tr('analytics.calendar', { month: monthLabel })}
          action={
            <span className={`inline-flex px-2 py-0.5 rounded text-2xs border ${
              mtd >= 0 ? 'bg-pos/10 border-pos/20 text-pos' : 'bg-neg/10 border-neg/20 text-neg'
            }`}>
              <span className="font-mono">{fmtPnl(mtd)}</span>&nbsp;MTD
            </span>
          }
        />
        {isLoading ? <Skeleton className="h-[200px] w-full" /> : <MonthCalendar daily={data?.dailyPnL ?? []} refDate={refDate} />}
      </Card>

    </>
  )
}
