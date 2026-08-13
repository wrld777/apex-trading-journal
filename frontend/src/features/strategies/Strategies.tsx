import { useState } from 'react'
import { useStrategies, useDeleteStrategy } from '../../hooks/useStrategies'
import { useInstruments } from '../../hooks/useInstruments'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import StrategyModal from './StrategyModal'
import { useStrategyStats } from '../../hooks/useAnalytics'
import { useToastStore } from '../../store/toastStore'
import type { StrategyDto } from '../../types/strategy'
import type { MetricsBlockDto } from '../../types/analytics'

function fmtR(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}R`
}

/**
 * Riga di risultati sulla card. Senza, la pagina elencava le strategie senza
 * dire quale funziona — che è l'unica domanda che ci si fa guardandola.
 */
function CardStats({ block }: { block: MetricsBlockDto | undefined }) {
  if (!block || block.totalTrades === 0) {
    return <span className="text-[10px] text-zinc-700">Nessun trade collegato</span>
  }
  return (
    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
      <span>{block.totalTrades} trade</span>
      <span>{block.winRate.toFixed(0)}% WR</span>
      <span className={block.expectancyR >= 0 ? 'text-green-500' : 'text-red-500'}>
        {fmtR(block.expectancyR)} / trade
      </span>
    </div>
  )
}

function StrategyCard({
  strategy,
  symbolById,
  stats,
  onEdit,
  onDelete,
}: {
  strategy: StrategyDto
  symbolById: Map<string, string>
  stats: MetricsBlockDto | undefined
  onEdit: () => void
  onDelete: () => void
}) {
  const rules = [...strategy.rules].sort((a, b) => a.order - b.order)
  // Il catalogo può non essere ancora arrivato: in quel caso salto l'id invece
  // di mostrarne il guid.
  const symbols = strategy.instrumentIds
    .map((id) => symbolById.get(id))
    .filter((s): s is string => s !== undefined)
    .sort()
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 flex flex-col gap-3 hover:border-white/[0.08] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{strategy.name}</h3>
          {strategy.description && (
            <p className="text-[12px] text-zinc-600 mt-0.5 line-clamp-2">{strategy.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            aria-label="Modifica strategia"
            title="Modifica"
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            aria-label="Elimina strategia"
            title="Elimina"
            className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 3.5h9M5.5 3.5V2.3h3v1.2M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <CardStats block={stats} />

      {symbols.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {symbols.map((s) => (
            <span
              key={s}
              className="text-[10px] font-medium text-zinc-400 border border-white/[0.07] rounded px-1.5 py-0.5"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1 pt-1 border-t border-white/[0.04]">
        <span className="text-[10px] text-zinc-700 uppercase tracking-wide">
          {rules.length} regol{rules.length === 1 ? 'a' : 'e'}
        </span>
        <ul className="flex flex-col gap-1 mt-1">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-[12px] text-zinc-400">
              <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
              <span className="truncate">{r.label}</span>
              {r.required && (
                <span className="ml-auto text-[9px] text-amber-500/80 border border-amber-500/20 bg-amber-500/10 rounded px-1 py-0.5 uppercase tracking-wide shrink-0">
                  Obbl.
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 flex flex-col gap-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
      <div className="pt-2 border-t border-white/[0.04] flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export default function Strategies() {
  const { data: strategies, isLoading, isError } = useStrategies()
  const { data: instruments } = useInstruments()
  const { data: strategyStats } = useStrategyStats()
  const { mutate: deleteStrategy, isPending: isDeleting } = useDeleteStrategy()
  const addToast = useToastStore((s) => s.addToast)

  const [modalOpen, setModalOpen] = useState(false)
  const [editStrategy, setEditStrategy] = useState<StrategyDto | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StrategyDto | null>(null)

  const openCreate = () => {
    setEditStrategy(null)
    setModalOpen(true)
  }
  const openEdit = (s: StrategyDto) => {
    setEditStrategy(s)
    setModalOpen(true)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteStrategy(pendingDelete.id, {
      onSuccess: () => {
        addToast('Strategia eliminata.', 'success')
        setPendingDelete(null)
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Eliminazione non riuscita.'
        addToast(message, 'error')
      },
    })
  }

  const list = strategies ?? []
  const symbolById = new Map((instruments ?? []).map((i) => [i.instrumentId, i.symbol]))
  // Le stats arrivano solo per le strategie che hanno trade: la card gestisce
  // da sé il caso mancante, quindi non serve attenderle per disegnare la lista.
  const statsById = new Map((strategyStats ?? []).map((s) => [s.strategyId, s.overall]))

  return (
    <div className="p-4 lg:p-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">
            Strategie
          </h1>
          <p className="text-xs text-zinc-600">
            {isLoading ? 'Loading…' : `${list.length} strateg${list.length === 1 ? 'ia' : 'ie'}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all self-start sm:self-auto"
        >
          + Nuova strategia
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4">
          <div className="text-xs text-red-400 py-6 text-center">Impossibile caricare le strategie.</div>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4">
          <EmptyState
            title="Nessuna strategia"
            description="Crea la tua prima strategia e definisci le regole oggettive di ingresso."
          />
          <div className="flex justify-center -mt-4 pb-2">
            <button
              onClick={openCreate}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
            >
              Crea una strategia
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {list.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              symbolById={symbolById}
              stats={statsById.get(s.id)}
              onEdit={() => openEdit(s)}
              onDelete={() => setPendingDelete(s)}
            />
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <StrategyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        strategy={editStrategy}
      />

      {/* Delete confirmation */}
      <Modal
        open={pendingDelete !== null}
        onClose={() => { if (!isDeleting) setPendingDelete(null) }}
        title="Eliminare la strategia?"
        maxWidth="max-w-sm"
        footer={
          <>
            <button
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-500 text-white hover:bg-red-500/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
            >
              {isDeleting && (
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
                </svg>
              )}
              {isDeleting ? 'Eliminando…' : 'Elimina'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          {pendingDelete && (
            <>
              Questo eliminerà definitivamente la strategia{' '}
              <span className="text-white font-medium">{pendingDelete.name}</span> e le sue regole. L'azione non è
              reversibile.
            </>
          )}
        </p>
      </Modal>
    </div>
  )
}
