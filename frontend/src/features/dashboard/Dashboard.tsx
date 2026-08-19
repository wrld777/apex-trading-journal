import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import KpiCard from '../../components/ui/KpiCard'

import { useStats } from '../../hooks/useStats'
import { useTrades } from '../../hooks/useTrades'
import { useProfile } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'
import type { TradeDto } from '../../types/trade'
import { t, tPlural, type TranslationKey } from '../../i18n'
import { fmt, fmtPnl, fmtR } from '../../lib/format'
import { cumulative } from '../../lib/series'

import TradeStatusBadge from '../../components/TradeStatusBadge'
import { ActivityHeatmap, EquityChart } from '../../components/charts'
import { Sparkline } from '../../design-system/charts'
import { Button, Card, CardHeader, EmptyState, KpiCardSkeleton, PageHeader, Skeleton, TBody, TH, THead, TR, Table, TableSkeleton, TableWrap } from '../../design-system'

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

  // La miniatura sulla card del P&L netto: la stessa curva del grafico grande,
  // ridotta a una riga. Ha senso solo con almeno due giorni.
  const equity = useMemo(() => cumulative(data?.dailyPnL ?? []).map(p => p.value), [data])

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
              {/* Il disegno qui era finto: sei coppie di coordinate scritte a
                  mano, identiche per ogni utente e per ogni periodo. Ora è la
                  curva vera del periodo selezionato — e dove la serie non c'è,
                  non compare niente. */}
              <div className="mt-2">
                <Sparkline
                  values={equity}
                  tone={data && data.netPnL >= 0 ? 'pos' : 'neg'}
                  label={t('dash.netPnlSpark')}
                />
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
              <div className="text-2xs text-content-faint mt-2">{t('dash.avgRRHint')}</div>
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
              <div className="text-2xs text-content-faint mt-2">
                {data && data.totalTrades > 0 ? t('dash.pfHint', { won: fmt(data.avgWin * data.winCount), lost: fmt(Math.abs(data.avgLoss) * data.lossCount) }) : ''}
              </div>
            </KpiCard>
          </>
        )}
      </div>

      {/* Equity Curve */}
      <Card interactive className="mb-3.5">
        {/* Il periodo lo decide il selettore in testa alla pagina: qui si dichiara
            soltanto cosa si sta guardando. */}
        <CardHeader
          title={t('dash.equityCurve')}
          action={<span className="text-2xs text-content-muted">{t(PERIOD_LABEL[period])}</span>}
        />
        {isLoading ? <Skeleton className="h-[180px] w-full" /> : <EquityChart daily={data?.dailyPnL ?? []} />}
      </Card>

      {/* Sessions + Setups + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">

        {/* Sessions */}
        <Card interactive>
          <CardHeader title={t('dash.sessions')} />
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
          <CardHeader
            title={t('dash.setupPerformance')}
            action={<Link to="/analytics" className="text-2xs text-content-muted px-1.5 py-0.5 rounded border border-line-2 hover:text-content-secondary transition-colors">{t('common.viewAll')}</Link>}
          />
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
          <CardHeader title={t('dash.statistics')} />
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
        <CardHeader
          title={t('dash.recentTrades')}
          action={<Link to="/trades" className="text-2xs text-content-muted px-1.5 py-0.5 rounded border border-line-2 hover:text-content-secondary transition-colors">{t('common.viewAll')} →</Link>}
        />
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
        <CardHeader
          title={t('dash.heatmap')}
          action={
            <div className="hidden sm:flex items-center gap-1 text-2xs text-content-faint">
              <span>{t('dash.less')}</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-neg/50" />
              <div className="w-2.5 h-2.5 rounded-sm bg-surface-2" />
              <div className="w-2.5 h-2.5 rounded-sm bg-pos/30" />
              <div className="w-2.5 h-2.5 rounded-sm bg-pos/75" />
              <span>{t('dash.more')}</span>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <ActivityHeatmap daily={allTime?.dailyPnL ?? []} />
        </div>
      </Card>

      </>
      )}

    </>
  )
}
