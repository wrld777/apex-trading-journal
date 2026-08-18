import { useMemo, useState } from 'react'
import { useTrades, useDeleteTrade } from '../../hooks/useTrades'

import { useToastStore } from '../../store/toastStore'
import EditTradeModal from './EditTradeModal'
import type { Direction, TradeDto, TradeOutcome, TradeQuery, TradeStatus } from '../../types/trade'
import { t as tr } from '../../i18n'

import TradeStatusBadge from '../../components/TradeStatusBadge'

import { Pencil, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, IconButton, Input, Modal, Select, SortableTH, TBody, TH, THead, TR, Table, TableSkeleton, TableWrap } from '../../design-system'

/* ── helpers ── */
function fmtNum(n: number, d = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtPnl(n: number) {
  return n >= 0 ? `+$${fmtNum(n)}` : `-$${fmtNum(Math.abs(n))}`
}
/**
 * Risultato in unità di rischio, col segno. Il RR accanto è una magnitudine:
 * senza questa colonna un trade perso mostrava `RR 1.00`, identico a un vinto
 * da 1R.
 */
function fmtR(n: number | null) {
  if (n === null) return '—'
  return `${n >= 0 ? '+' : '−'}${fmtNum(Math.abs(n), 2)}R`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' })
}

type SortKey = 'date' | 'pnl' | 'rr'
type SortDir = 'asc' | 'desc'
const PAGE_SIZE = 15

// Come si è usciti, accanto al prezzo (#96). Un'uscita manuale non aggiunge
// nulla al prezzo già mostrato, quindi resta muta.
function ExitOutcomeTag({ exits }: { exits: TradeDto['exits'] }) {
  if (!exits || exits.length === 0) return null

  const labels: Record<TradeOutcome, string> = {
    TakeProfit: tr('tradeLog.exitTp'),
    StopLoss: tr('tradeLog.exitSl'),
    BreakEven: tr('tradeLog.exitBe'),
    Manual: '',
  }

  const text = exits.length > 1
    ? tr('tradeLog.exitsCount', { count: exits.length })
    : labels[exits[0].outcome]
  if (!text) return null

  return <span className="ml-1.5 text-[9px] text-content-muted uppercase tracking-wide">{text}</span>
}

export default function TradeLog() {
  const { mutate: deleteTrade, isPending: isDeleting } = useDeleteTrade()
  const addToast = useToastStore((s) => s.addToast)

  const [editTrade, setEditTrade] = useState<TradeDto | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TradeDto | null>(null)

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteTrade(pendingDelete.id, {
      onSuccess: () => {
        addToast('Trade deleted.', 'success')
        setPendingDelete(null)
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to delete trade.'
        addToast(message, 'error')
      },
    })
  }

  const [symbol, setSymbol] = useState('')
  const [setup, setSetup] = useState('')
  const [session, setSession] = useState('')
  const [direction, setDirection] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' })
  const [page, setPage] = useState(1)

  const hasFilters = !!(symbol || setup || session || direction || status || from || to)

  // Reset to first page when filters/sort change (adjust state during render).
  const filterKey = `${symbol}|${setup}|${session}|${direction}|${status}|${from}|${to}|${sort.key}|${sort.dir}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  // Map the table's sort keys onto the API's sort fields.
  const sortField: TradeQuery['sort'] =
    sort.key === 'date' ? 'entryTime' : sort.key === 'pnl' ? 'pnl' : 'riskReward'
  // `to` is made inclusive of the end day (+1 day): the API compares against UTC midnight.
  const toExclusive = to
    ? new Date(new Date(`${to}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10)
    : undefined

  const query: TradeQuery = {
    symbol: symbol.trim() || undefined,
    setup: setup || undefined,
    session: session || undefined,
    direction: (direction || undefined) as Direction | undefined,
    status: (status || undefined) as TradeStatus | undefined,
    from: from || undefined,
    to: toExclusive,
    sort: sortField,
    sortDir: sort.dir,
    page,
    pageSize: PAGE_SIZE,
  }

  const { data, isLoading, isError } = useTrades(query)
  const rows = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // A delete on the last page can leave us past the end: snap back into range.
  if (data && page > totalPages) setPage(totalPages)

  // Distinct setups/sessions for the filter dropdowns (from the 100 most recent trades).
  const { data: optionsPage } = useTrades({ pageSize: 100 })
  const setups = useMemo(
    () => [...new Set((optionsPage?.items ?? []).map(t => t.setup))].filter(Boolean).sort(),
    [optionsPage],
  )
  const sessions = useMemo(
    () => [...new Set((optionsPage?.items ?? []).map(t => t.session))].filter(Boolean).sort(),
    [optionsPage],
  )
  // Since #94 the server matches the symbol exactly against the instrument catalog,
  // so a free-text box would return nothing while the user is still typing.
  const symbols = useMemo(
    () => [...new Set((optionsPage?.items ?? []).map(t => t.symbol))].filter(Boolean).sort(),
    [optionsPage],
  )

  const onSort = (key: SortKey) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  const clearFilters = () => {
    setSymbol(''); setSetup(''); setSession(''); setDirection(''); setStatus(''); setFrom(''); setTo('')
  }

  return (
    <div className="p-4 lg:p-7">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-sans font-bold text-xl tracking-tight text-content-strong leading-none mb-1">{tr('tradeLog.title')}</h1>
          <p className="text-xs text-content-muted">
            {isLoading ? tr('common.loading') : tr(hasFilters ? 'tradeLog.countFiltered' : 'tradeLog.count', { count: total })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card padding="compact" className="mb-3.5 flex flex-wrap items-center gap-2">
        <Select value={symbol} onChange={e => setSymbol(e.target.value)}>
          <option value="">{tr('tradeLog.filterSymbol')}</option>
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={setup} onChange={e => setSetup(e.target.value)}>
          <option value="">{tr('tradeLog.filterSetup')}</option>
          {setups.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={session} onChange={e => setSession(e.target.value)}>
          <option value="">{tr('tradeLog.filterSession')}</option>
          {sessions.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={direction} onChange={e => setDirection(e.target.value)}>
          <option value="">{tr('tradeLog.filterSide')}</option>
          <option value="Long">{tr('tradeLog.sideLong')}</option>
          <option value="Short">{tr('tradeLog.sideShort')}</option>
        </Select>
        <Select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">{tr('tradeLog.filterStatus')}</option>
          <option value="Win">{tr('tradeLog.statusWin')}</option>
          <option value="Loss">{tr('tradeLog.statusLoss')}</option>
          <option value="BreakEven">{tr('tradeLog.statusBreakEven')}</option>
        </Select>
        <Input type="date" className="w-auto" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} aria-label={tr('tradeLog.fromDate')} />
        <span className="text-content-faint text-xs">→</span>
        <Input type="date" className="w-auto" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} aria-label={tr('tradeLog.toDate')} />
        {hasFilters && (
          <Button size="sm" onClick={clearFilters} >
            {tr('common.clear')}
          </Button>
        )}
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : isError ? (
          <div className="text-xs text-neg py-6 text-center">{tr('tradeLog.loadFailed')}</div>
        ) : total === 0 && !hasFilters ? (
          <EmptyState
            title={tr('tradeLog.emptyTitle')}
            description={tr('tradeLog.emptyBody')}
            actionLabel={tr('tradeLog.logATrade')}
            actionTo="/log-trade"
          />
        ) : total === 0 ? (
          <div className="text-xs text-content-muted py-8 text-center">{tr('tradeLog.noMatch')}</div>
        ) : (
          <>
            <TableWrap>
              <Table className="min-w-[940px]">
                <THead>
                  <tr className="border-b border-line">
                    <SortableTH label={tr('tradeLog.colDate')} active={sort.key === 'date'} direction={sort.dir} onSort={() => onSort('date')} />
                    <TH>{tr('tradeLog.colSymbol')}</TH>
                    <TH>{tr('tradeLog.colSide')}</TH>
                    <TH>{tr('tradeLog.colSetup')}</TH>
                    <TH>{tr('tradeLog.colSession')}</TH>
                    <TH numeric>{tr('tradeLog.colQty')}</TH>
                    <TH numeric>{tr('tradeLog.colEntry')}</TH>
                    <TH numeric>{tr('tradeLog.colExit')}</TH>
                    <SortableTH label={tr('tradeLog.colPnl')} active={sort.key === 'pnl'} direction={sort.dir} onSort={() => onSort('pnl')} numeric />
                    <TH numeric>{tr('tradeLog.colR')}</TH>
                    <SortableTH label={tr('tradeLog.colRr')} active={sort.key === 'rr'} direction={sort.dir} onSort={() => onSort('rr')} numeric />
                    <TH numeric>{tr('tradeLog.colStatus')}</TH>
                    <TH numeric>{tr('tradeLog.colActions')}</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map(t => (
                    <TR key={t.id}>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary whitespace-nowrap">{fmtDate(t.entryTime)}</td>
                      <td className="py-2.5 px-3 text-xs font-medium text-content-strong">{t.symbol}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-medium ${t.direction === 'Long' ? 'text-pos' : 'text-neg'}`}>
                          {t.direction === 'Long' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary">{t.setup}</td>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary">{t.session}</td>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary text-right font-mono">{t.quantity}</td>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary text-right font-mono">{fmtNum(t.entryPrice, 2)}</td>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary text-right font-mono">
                        {fmtNum(t.exitPrice, 2)}
                        {/* Come si è chiuso (#96): sui parziali il prezzo è una media,
                            quindi da solo direbbe poco. */}
                        <ExitOutcomeTag exits={t.exits} />
                      </td>
                      <td className={`py-2.5 px-3 text-[11px] text-right font-mono ${t.pnL >= 0 ? 'text-pos' : 'text-neg'}`}>{fmtPnl(t.pnL)}</td>
                      <td className={`py-2.5 px-3 text-[11px] text-right font-mono ${
                        t.rMultiple === null ? 'text-content-faint' : t.rMultiple >= 0 ? 'text-pos' : 'text-neg'
                      }`}>{fmtR(t.rMultiple)}</td>
                      <td className="py-2.5 px-3 text-[11px] text-content-secondary text-right font-mono">{fmtNum(t.riskReward, 2)}</td>
                      <td className="py-2.5 px-3 text-right"><TradeStatusBadge status={t.status} /></td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton onClick={() => setEditTrade(t)} label={tr('tradeLog.editAria')}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            onClick={() => setPendingDelete(t)}
                            label={tr('tradeLog.deleteAria')}
                            className="hover:text-neg"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </IconButton>
                        </div>
                      </td>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
              <span className="text-[11px] text-content-muted">
                {tr('tradeLog.page', { page, total: totalPages })}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded-md text-[11px] text-content-secondary border border-line-2 hover:bg-surface-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {tr('tradeLog.prev')}
                </button>
                <Button size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  
                >
                  {tr('tradeLog.next')}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Edit modal */}
      <EditTradeModal
        trade={editTrade}
        open={editTrade !== null}
        onClose={() => setEditTrade(null)}
      />

      {/* Delete confirmation */}
      <Modal
        open={pendingDelete !== null}
        onClose={() => { if (!isDeleting) setPendingDelete(null) }}
        title={tr('tradeLog.deleteTitle')}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {tr('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={isDeleting}>
              {isDeleting ? tr('common.deleting') : tr('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-content-secondary leading-relaxed">
          {pendingDelete && (
            tr('tradeLog.deleteBody', {
              symbol: pendingDelete.symbol,
              direction: pendingDelete.direction,
              date: fmtDate(pendingDelete.entryTime),
            })
          )}
        </p>
      </Modal>
    </div>
  )
}
