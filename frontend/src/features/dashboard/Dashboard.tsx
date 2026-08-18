import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import KpiCard from '../../components/ui/KpiCard'

import { useStats } from '../../hooks/useStats'
import { useTrades } from '../../hooks/useTrades'
import { useProfile } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'
import type { TradeDto } from '../../types/trade'
import type { DailyPnLDto } from '../../types/stats'
import { t, tPlural, type TranslationKey } from '../../i18n'

import TradeStatusBadge from '../../components/TradeStatusBadge'
import { Button, Card, EmptyState, KpiCardSkeleton, PageHeader, Skeleton, TBody, TH, THead, TR, Table, TableSkeleton, TableWrap } from '../../design-system'

const HM_COLOR: Record<string, string> = {
  'hm-0':  'bg-surface-2',
  'hm-1':  'bg-pos/15',
  'hm-2':  'bg-pos/30',
  'hm-3':  'bg-pos/50',
  'hm-4':  'bg-pos/75',
  'hm-n1': 'bg-neg/15',
  'hm-n2': 'bg-neg/30',
  'hm-n3': 'bg-neg/50',
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
    // Le colonne erano `1fr`: su desktop diventavano quadrati da ~90px e la
    // heatmap si mangiava mezza pagina. Con un tetto crescono fin dove serve
    // e poi si fermano, allineate a sinistra.
    <div style={{ display: 'grid', gridTemplateColumns: '26px repeat(13, minmax(0, 26px))', gap: 3, justifyContent: 'start' }}>
      {days.map((day, di) => (
        <Fragment key={`row-${di}`}>
          <div className="text-[9px] text-content-faint flex items-center justify-end pr-1">{day}</div>
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
    return <div className="h-[180px] flex items-center justify-center text-xs text-content-muted">{t('dash.noTradesShort')}</div>
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
  const stroke = positive ? 'rgb(var(--c-pos))' : 'rgb(var(--c-neg))'
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
        {labels.map((d, i) => <span key={i} className="text-[10px] text-content-faint">{d}</span>)}
      </div>
    </>
  )
}

/* ── RECENT TRADES TABLE ── */

function RecentTrades({ trades }: { trades: TradeDto[] }) {
  if (trades.length === 0) {
    return (
      <EmptyState
        title={t('dash.noRecentTitle')}
        description={t('dash.noRecentBody')}
        actionLabel={t('dash.logATrade')}
        actionTo="/log-trade"
      />
    )
  }

  const rows = [...trades]
    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
    .slice(0, 8)

  return (
    <TableWrap>
      <Table className="min-w-[560px]">
        <THead>
          <tr>
            <TH>{t('dash.colSymbol')}</TH>
            <TH>{t('dash.colSide')}</TH>
            <TH>{t('dash.colDate')}</TH>
            <TH>{t('dash.colSetup')}</TH>
            <TH numeric>{t('dash.colQty')}</TH>
            <TH numeric>{t('dash.colR')}</TH>
            <TH numeric>{t('dash.colPnl')}</TH>
            <TH numeric>{t('dash.colStatus')}</TH>
          </tr>
        </THead>
        <TBody>
          {rows.map(trade => (
            <TR key={trade.id}>
              <td className="py-2.5 pr-3 text-xs font-medium text-content-strong">{trade.symbol}</td>
              <td className="py-2.5 pr-3">
                <span className={`text-[11px] font-medium ${trade.direction === 'Long' ? 'text-pos' : 'text-neg'}`}>
                  {trade.direction === 'Long' ? t('dash.long') : t('dash.short')}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-[11px] text-content-secondary">
                {new Date(trade.entryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </td>
              <td className="py-2.5 pr-3 text-[11px] text-content-secondary">{trade.setup}</td>
              <td className="py-2.5 pr-3 text-[11px] text-content-secondary text-right font-mono">{trade.quantity}</td>
              {/* null quando lo stop coincideva con l'entry: lì l'R non esiste. */}
              <td className={`py-2.5 pr-3 text-[11px] text-right font-mono ${
                trade.rMultiple === null ? 'text-content-faint' : trade.rMultiple >= 0 ? 'text-pos' : 'text-neg'
              }`}>
                {trade.rMultiple === null ? '—' : fmtR(trade.rMultiple)}
              </td>
              <td className={`py-2.5 pr-3 text-[11px] text-right font-mono ${trade.pnL >= 0 ? 'text-pos' : 'text-neg'}`}>
                {fmtPnl(trade.pnL)}
              </td>
              <td className="py-2.5 text-right"><TradeStatusBadge status={trade.status} /></td>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrap>
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
/** Risultato in unità di rischio: il metro che non dipende dal capitale. */
function fmtR(n: number) {
  return `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n), 2)}R`
}

/** Il saluto seguiva l'ora solo di nome: era "Good morning" anche a mezzanotte. */
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return t('dash.goodMorning')
  if (h < 18) return t('dash.goodAfternoon')
  return t('dash.goodEvening')
}

/* ── PERIODO ── */
type PeriodKey = '1D' | '1W' | '1M' | '3M' | 'ALL'

const PERIODS: PeriodKey[] = ['1D', '1W', '1M', '3M', 'ALL']

const PERIOD_LABEL: Record<PeriodKey, TranslationKey> = {
  '1D': 'period.1D',
  '1W': 'period.1W',
  '1M': 'period.1M',
  '3M': 'period.3M',
  ALL: 'period.ALL',
}

const PERIOD_DAYS: Record<Exclude<PeriodKey, 'ALL'>, number> = {
  '1D': 0, '1W': 6, '1M': 29, '3M': 89,
}

/**
 * Estremi da mandare a /api/stats. Il backend filtra solo se ci sono *entrambi*,
 * quindi "ALL" si esprime omettendoli, non con una data lontana.
 */
function rangeFor(period: PeriodKey): { from?: string; to?: string } {
  if (period === 'ALL') return {}
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - PERIOD_DAYS[period])
  from.setHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: to.toISOString() }
}

function PeriodPicker({ value, onChange }: { value: PeriodKey; onChange: (p: PeriodKey) => void }) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 border border-line-2 rounded-md p-0.5">
      {PERIODS.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-pressed={value === p}
          title={t(PERIOD_LABEL[p])}
          className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-widest transition-all ${
            value === p ? 'bg-surface-3 text-content-strong' : 'text-content-muted hover:text-content-secondary'
          }`}
        >
          {p === 'ALL' ? t('common.all') : p}
        </button>
      ))}
    </div>
  )
}

/* ── MAIN ── */
export default function Dashboard() {
  const name = useAuthStore((s) => s.name)
  const [period, setPeriod] = useState<PeriodKey>('ALL')
  const range = useMemo(() => rangeFor(period), [period])

  const { data, isLoading, isError } = useStats(range.from, range.to)
  // La heatmap promette "Last 13 Weeks": deve restare fuori dal filtro, o con 1D
  // si svuoterebbe smentendo la propria etichetta. Query separata, cache separata.
  const { data: allTime } = useStats()

  // RecentTrades only needs the latest few; page 1 (default sort: entryTime desc) covers it.
  const { data: tradesPage, isLoading: tradesLoading, isError: tradesError } = useTrades({ pageSize: 8 })
  const trades = tradesPage?.items
  const { data: profile } = useProfile()

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Due vuoti diversi: chi non ha mai registrato un trade va invitato a farlo,
  // chi ne ha ma non in questo periodo va solo avvisato che il filtro è stretto.
  const statsReady = !isLoading && !isError
  const neverTraded = statsReady && (allTime?.totalTrades ?? 0) === 0
  const emptyPeriod = statsReady && !neverTraded && (data?.totalTrades ?? 0) === 0

  return (
    <>

      <PageHeader
        title={t('dash.greeting', { greeting: greeting(), name: profile?.firstName || name || t('dash.trader') })}
        subtitle={today}
        /* Un solo selettore per tutta la pagina: due controlli di periodo sulla
           stessa schermata finirebbero per contraddirsi. */
        actions={<PeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* Error banner */}
      {isError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-neg/10 border border-neg/20 text-neg text-xs">
          {t('dash.statsLoadFailed')}
        </div>
      )}

      {neverTraded ? (
        <EmptyState
          title={t('dash.noTradesTitle')}
          description={t('dash.noTradesBody')}
          actionLabel={t('dash.logATrade')}
          actionTo="/log-trade"
          className="bg-surface border border-line rounded-[10px]"
        />
      ) : (
      <>

      {emptyPeriod && (
        <div className="mb-3.5 px-4 py-3 rounded-[10px] bg-surface border border-line text-xs text-content-secondary flex items-center justify-between gap-3 flex-wrap">
          <span>{t('dash.emptyPeriod', { period: t(PERIOD_LABEL[period]).toLowerCase() })}</span>
          <Button size="sm" onClick={() => setPeriod('ALL')} >
            {t('dash.showAllTime')}
          </Button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-3.5 mb-3.5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label={t('dash.netPnl')}
              value={data ? `$${fmt(data.netPnL)}` : '—'}
              delta={data ? fmtR(data.netR) : undefined}
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
              label={t('dash.winRate')}
              value={data ? `${fmt(data.winRate, 1)}%` : '—'}
              delta={data ? t('dash.winLoss', { wins: data.winCount, losses: data.lossCount }) : undefined}
              deltaUp={data ? data.winRate >= 50 : undefined}
            >
              <div className="h-1 bg-surface-3 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-pos rounded-full" style={{ width: data ? `${data.winRate}%` : '0%' }} />
              </div>
              <div className="text-[10px] text-content-faint mt-1.5">
                {data ? t('dash.breakEvenCount', { count: data.breakEvenCount }) : ''}
              </div>
            </KpiCard>

            <KpiCard
              label={t('dash.expectancy')}
              value={data ? fmtR(data.expectancyR) : '—'}
              deltaUp={data ? data.expectancyR >= 0 : undefined}
            >
              <div className="text-[10px] text-content-faint mt-2">
                {data ? tPlural(data.rTradeCount, 'dash.expectancyHintOne', 'dash.expectancyHintCount') : t('dash.expectancyHint')}
              </div>
            </KpiCard>

            <KpiCard
              label={t('dash.avgRR')}
              value={data ? fmt(data.avgRR, 2) : '—'}
              delta={data ? (data.avgRR >= 2 ? t('dash.aboveTarget') : t('dash.belowTarget')) : undefined}
              deltaUp={data ? data.avgRR >= 2 : undefined}
            >
              <div className="h-7 mt-2">
                <svg viewBox="0 0 100 28" className="w-full h-7" preserveAspectRatio="none">
                  <polyline points="0,18 12,20 25,14 35,16 48,10 60,7 72,9 85,5 100,4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </KpiCard>

            <KpiCard
              label={t('dash.maxDrawdown')}
              value={data ? `-$${fmt(Math.abs(data.maxDrawdown))}` : '—'}
              delta={data ? `−${fmt(Math.abs(data.maxDrawdownR), 2)}R` : undefined}
              deltaUp={false}
            >
              {/* Il drawdown si legge contro il guadagno prodotto, non contro un
                  capitale dichiarato: quanto della salita si è restituito. */}
              <div className="h-1 bg-surface-3 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-neg rounded-full"
                  style={{ width: data && data.netR > 0 ? `${Math.min(Math.abs(data.maxDrawdownR) / data.netR * 100, 100)}%` : '100%' }}
                />
              </div>
              <div className="text-[10px] text-content-faint mt-1.5">
                {data && data.netR > 0
                  ? t('dash.gainsGivenBack', { percent: fmt(Math.abs(data.maxDrawdownR) / data.netR * 100, 0) })
                  : t('dash.noNetGain')}
              </div>
            </KpiCard>

            {/* Tre casi distinti: nessun trade (non c'è dato), trade tutti vinti
                (rapporto infinito), altrimenti il rapporto vero. */}
            <KpiCard
              label={t('dash.profitFactor')}
              value={!data || data.totalTrades === 0 ? '—' : data.profitFactor === null ? '∞' : fmt(data.profitFactor, 2)}
              delta={
                !data || data.totalTrades === 0
                  ? undefined
                  : data.profitFactor === null
                    ? t('dash.pfNoLosses')
                    : data.profitFactor >= 2 ? t('dash.pfExcellent') : data.profitFactor >= 1 ? t('dash.pfGood') : t('dash.pfNegative')
              }
              deltaUp={data && data.totalTrades > 0 ? (data.profitFactor === null || data.profitFactor >= 1) : undefined}
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
      <Card interactive className="mb-3.5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-content-muted uppercase tracking-widest">{t('dash.equityCurve')}</div>
          {/* Il periodo lo decide il selettore in testa alla pagina: qui si dichiara
              soltanto cosa si sta guardando. */}
          <span className="text-[10px] text-content-muted">{t(PERIOD_LABEL[period])}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : (
          <EquityCurve daily={data?.dailyPnL ?? []} />
        )}
      </Card>

      {/* Sessions + Setups + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">

        {/* Sessions */}
        <Card interactive>
          <div className="text-[11px] text-content-muted uppercase tracking-widest mb-4">{t('dash.sessions')}</div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {(data?.sessionStats ?? []).map(s => (
                <div key={s.session} className="bg-surface-2 border border-line rounded-md px-3.5 py-3 flex flex-col gap-1.5 cursor-pointer hover:border-line-control hover:-translate-y-px transition-all">
                  <div className="text-[11px] text-content-muted uppercase tracking-[0.05em]">{s.session}</div>
                  <div className={`font-mono font-medium text-[18px] tracking-tight ${s.pnL >= 0 ? 'text-pos' : 'text-neg'}`}>
                    {fmtPnl(s.pnL)}
                  </div>
                  <div className="text-[10px] text-content-faint">
                    {t('dash.sessionLine', { count: s.totalTrades, winRate: fmt(s.winRate, 0), r: fmtR(s.r) })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Setup Performance */}
        <Card interactive>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] text-content-muted uppercase tracking-widest">{t('dash.setupPerformance')}</div>
            <Link to="/analytics" className="text-[10px] text-content-muted px-1.5 py-0.5 rounded border border-line-2 hover:text-content-secondary transition-all">{t('common.viewAll')}</Link>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Il colore seguiva i dollari mentre il numero mostrato era in R:
                  un setup con +3.00R ma -$132 usciva verde-positivo su barra
                  ambra. R e $ possono davvero divergere fra strumenti con point
                  value diverso, quindi il colore segue il numero che si legge
                  — l'R — e i dollari si mostrano accanto quando dissentono. */}
              {(data?.setupStats ?? []).map(s => {
                const positive = s.r >= 0
                const disagree = (s.r >= 0) !== (s.pnL >= 0)
                return (
                  <div key={s.setup} className="flex items-center gap-2.5 py-2 border-b border-line last:border-0">
                    {/* Il nome prendeva flex-1 contro flex-[2] della barra e finiva
                       troncato quasi sempre ("Fair Va…"): i setup hanno nomi lunghi
                       e leggerli conta più di qualche pixel di barra. Rapporto invertito. */}
                    <div className="text-xs text-content-secondary flex-[2] min-w-0 truncate" title={s.setup}>{s.setup}</div>
                    <div className="flex-1 h-[3px] bg-surface-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${positive ? 'bg-pos' : 'bg-warn'}`} style={{ width: `${s.winRate}%` }} />
                    </div>
                    <div className="text-[11px] w-9 text-right text-content-secondary font-mono">
                      {fmt(s.winRate, 0)}%
                    </div>
                    <div
                      title={`${fmtR(s.r)} · ${fmtPnl(s.pnL)}`}
                      className={`text-[11px] w-24 text-right font-mono ${positive ? 'text-pos' : 'text-warn'}`}
                    >
                      {fmtR(s.r)}
                      {disagree && <span className="text-content-muted"> {fmtPnl(s.pnL)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Statistics */}
        <Card interactive>
          <div className="text-[11px] text-content-muted uppercase tracking-widest mb-4">{t('dash.statistics')}</div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2">
              {[
                { label: t('dash.totalTrades'), value: data ? String(data.totalTrades) : '—',               color: '' },
                { label: t('dash.bestTrade'),   value: data ? fmtPnl(data.bestTrade) : '—',                 color: 'text-pos' },
                { label: t('dash.worstTrade'),  value: data ? fmtPnl(data.worstTrade) : '—',                color: 'text-neg'   },
                { label: t('dash.avgWin'),      value: data ? `$${fmt(data.avgWin)}` : '—',                 color: '' },
                { label: t('dash.avgLoss'),     value: data ? `-$${fmt(Math.abs(data.avgLoss))}` : '—',     color: 'text-neg'   },
                { label: t('dash.bestStreak'),  value: data ? `${data.bestStreak}W` : '—',                  color: '' },
              ].map((s, i) => (
                <div key={s.label} className={`py-3 border-b border-line ${i % 2 === 1 ? 'pl-4 border-l border-line' : ''} ${i >= 4 ? 'border-b-0' : ''}`}>
                  <div className="text-[10px] text-content-faint uppercase tracking-[0.06em] mb-1">{s.label}</div>
                  <div className={`font-mono font-medium text-base tracking-tight ${s.color || 'text-content-strong'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Trades */}
      <Card interactive className="mb-3.5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-content-muted uppercase tracking-widest">{t('dash.recentTrades')}</div>
          <Link to="/trades" className="text-[10px] text-content-muted px-1.5 py-0.5 rounded border border-line-2 hover:text-content-secondary transition-all">{t('common.viewAll')} →</Link>
        </div>
        {tradesLoading ? (
          <TableSkeleton />
        ) : tradesError ? (
          <div className="text-xs text-neg py-4 text-center">{t('dash.tradesLoadFailed')}</div>
        ) : (
          <RecentTrades trades={trades ?? []} />
        )}
      </Card>

      {/* Heatmap */}
      <Card interactive>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] text-content-muted uppercase tracking-widest">{t('dash.heatmap')}</div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-content-faint">
            <span>{t('dash.less')}</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-surface-2" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pos/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-pos/75" />
            <span>{t('dash.more')}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Heatmap daily={allTime?.dailyPnL ?? []} />
        </div>
      </Card>

      </>
      )}

    </>
  )
}
