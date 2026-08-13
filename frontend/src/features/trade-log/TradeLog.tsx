import { useMemo, useState } from 'react'
import { useTrades, useDeleteTrade } from '../../hooks/useTrades'
import { TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { useToastStore } from '../../store/toastStore'
import EditTradeModal from './EditTradeModal'
import type { Direction, TradeDto, TradeOutcome, TradeQuery, TradeStatus } from '../../types/trade'
import { t as tr } from '../../i18n'

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

const INPUT = 'bg-[#141416] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-[12px] text-zinc-300 outline-none focus:border-white/[0.18] [color-scheme:dark]'

type SortKey = 'date' | 'pnl' | 'rr'
type SortDir = 'asc' | 'desc'
const PAGE_SIZE = 15

function StatusBadge({ status }: { status: TradeDto['status'] }) {
  const map: Record<TradeDto['status'], string> = {
    Win:       'bg-green-500/10 border-green-500/20 text-green-500',
    Loss:      'bg-red-500/10 border-red-500/20 text-red-500',
    BreakEven: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  }
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] border ${map[status]}`}>{status}</span>
}

// Come si è usciti, accanto al prezzo (#96). Un'uscita manuale non aggiunge
// nulla al prezzo già mostrato, quindi resta muta.
function ExitOutcomeTag({ exits }: { exits: TradeDto['exits'] }) {
  if (!exits || exits.length === 0) return null

  const labels: Record<TradeOutcome, string> = {
    TakeProfit: 'TP',
    StopLoss: 'SL',
    BreakEven: 'BE',
    Manual: '',
  }

  const text = exits.length > 1 ? `${exits.length} uscite` : labels[exits[0].outcome]
  if (!text) return null

  return <span className="ml-1.5 text-[9px] text-zinc-600 uppercase tracking-wide">{text}</span>
}

function SortHeader({ label, col, sort, onSort, align = 'left' }: {
  label: string; col: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void; align?: 'left' | 'right'
}) {
  const active = sort.key === col
  return (
    <th
      onClick={() => onSort(col)}
      className={`font-medium pb-2 px-3 cursor-pointer select-none hover:text-zinc-400 transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={active ? 'text-zinc-400' : 'text-zinc-700'}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </span>
    </th>
  )
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
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Trade Log</h1>
          <p className="text-xs text-zinc-600">
            {isLoading ? tr('common.loading') : tr(hasFilters ? 'tradeLog.countFiltered' : 'tradeLog.count', { count: total })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-3 mb-3.5 flex flex-wrap items-center gap-2">
        <select value={symbol} onChange={e => setSymbol(e.target.value)} className={INPUT}>
          <option value="">{tr('tradeLog.filterSymbol')}</option>
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={setup} onChange={e => setSetup(e.target.value)} className={INPUT}>
          <option value="">{tr('tradeLog.filterSetup')}</option>
          {setups.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={session} onChange={e => setSession(e.target.value)} className={INPUT}>
          <option value="">{tr('tradeLog.filterSession')}</option>
          {sessions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={direction} onChange={e => setDirection(e.target.value)} className={INPUT}>
          <option value="">{tr('tradeLog.filterSide')}</option>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
          <option value="">{tr('tradeLog.filterStatus')}</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="BreakEven">Break Even</option>
        </select>
        <input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} className={INPUT} aria-label="From date" />
        <span className="text-zinc-700 text-xs">→</span>
        <input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className={INPUT} aria-label="To date" />
        {hasFilters && (
          <button onClick={clearFilters} className="px-2.5 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-[18px]">
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : isError ? (
          <div className="text-xs text-red-400 py-6 text-center">Failed to load trades.</div>
        ) : total === 0 && !hasFilters ? (
          <EmptyState
            title="No trades logged yet"
            description="Log your first trade to populate your trade log."
            actionLabel="Log a Trade"
            actionTo="/log-trade"
          />
        ) : total === 0 ? (
          <div className="text-xs text-zinc-600 py-8 text-center">{tr('tradeLog.noMatch')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead>
                  <tr className="text-[10px] text-zinc-700 uppercase tracking-[0.06em] border-b border-white/[0.04]">
                    <SortHeader label="Date" col="date" sort={sort} onSort={onSort} />
                    <th className="font-medium pb-2 px-3">Symbol</th>
                    <th className="font-medium pb-2 px-3">Side</th>
                    <th className="font-medium pb-2 px-3">Setup</th>
                    <th className="font-medium pb-2 px-3">Session</th>
                    <th className="font-medium pb-2 px-3 text-right">Qty</th>
                    <th className="font-medium pb-2 px-3 text-right">Entry</th>
                    <th className="font-medium pb-2 px-3 text-right">Exit</th>
                    <SortHeader label="P&L" col="pnl" sort={sort} onSort={onSort} align="right" />
                    <th className="font-medium pb-2 px-3 text-right">R</th>
                    <SortHeader label="RR" col="rr" sort={sort} onSort={onSort} align="right" />
                    <th className="font-medium pb-2 px-3 text-right">Status</th>
                    <th className="font-medium pb-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(t => (
                    <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500 whitespace-nowrap">{fmtDate(t.entryTime)}</td>
                      <td className="py-2.5 px-3 text-xs font-medium text-white">{t.symbol}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-medium ${t.direction === 'Long' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.direction === 'Long' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-400">{t.setup}</td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500">{t.session}</td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500 text-right font-mono">{t.quantity}</td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500 text-right font-mono">{fmtNum(t.entryPrice, 2)}</td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500 text-right font-mono">
                        {fmtNum(t.exitPrice, 2)}
                        {/* Come si è chiuso (#96): sui parziali il prezzo è una media,
                            quindi da solo direbbe poco. */}
                        <ExitOutcomeTag exits={t.exits} />
                      </td>
                      <td className={`py-2.5 px-3 text-[11px] text-right font-mono ${t.pnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmtPnl(t.pnL)}</td>
                      <td className={`py-2.5 px-3 text-[11px] text-right font-mono ${
                        t.rMultiple === null ? 'text-zinc-700' : t.rMultiple >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>{fmtR(t.rMultiple)}</td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-400 text-right font-mono">{fmtNum(t.riskReward, 2)}</td>
                      <td className="py-2.5 px-3 text-right"><StatusBadge status={t.status} /></td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTrade(t)}
                            aria-label="Edit trade"
                            title="Edit"
                            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
                          >
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                              <path d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setPendingDelete(t)}
                            aria-label="Delete trade"
                            title="Delete"
                            className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                          >
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                              <path d="M2.5 3.5h9M5.5 3.5V2.3h3v1.2M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
              <span className="text-[11px] text-zinc-600">
                {tr('tradeLog.page', { page, total: totalPages })}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {tr('tradeLog.prev')}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {tr('tradeLog.next')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
        title="Delete trade?"
        maxWidth="max-w-sm"
        footer={
          <>
            <button
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500 text-white hover:bg-red-500/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {isDeleting && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
                </svg>
              )}
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          {pendingDelete && (
            <>This will permanently delete the <span className="text-white font-medium">{pendingDelete.symbol}</span> {pendingDelete.direction} trade from {fmtDate(pendingDelete.entryTime)}. This action cannot be undone.</>
          )}
        </p>
      </Modal>
    </div>
  )
}
