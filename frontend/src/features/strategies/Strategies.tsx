import { useState } from 'react'
import { useStrategies, useDeleteStrategy } from '../../hooks/useStrategies'
import { useInstruments } from '../../hooks/useInstruments'

import StrategyModal from './StrategyModal'
import { useStrategyStats } from '../../hooks/useAnalytics'
import { useToastStore } from '../../store/toastStore'
import type { StrategyDto } from '../../types/strategy'
import type { MetricsBlockDto } from '../../types/analytics'
import { t, tPlural } from '../../i18n'
import { Button, Card, EmptyState, Modal, PageHeader, Skeleton } from '../../design-system'

function fmtR(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}R`
}

/**
 * Riga di risultati sulla card. Senza, la pagina elencava le strategie senza
 * dire quale funziona — che è l'unica domanda che ci si fa guardandola.
 */
function CardStats({ block }: { block: MetricsBlockDto | undefined }) {
  if (!block || block.totalTrades === 0) {
    return <span className="text-[10px] text-content-faint">{t('strategies.noTrades')}</span>
  }
  return (
    <div className="flex items-center gap-3 text-[10px] text-content-muted font-mono">
      <span>{t('strategies.statsLine', { count: block.totalTrades, winRate: block.winRate.toFixed(0) })}</span>
      <span className={block.expectancyR >= 0 ? 'text-pos' : 'text-neg'}>
        {fmtR(block.expectancyR)} / {t('common.trade')}
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
    <Card interactive className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-content-strong truncate">{strategy.name}</h3>
          {strategy.description && (
            <p className="text-[12px] text-content-muted mt-0.5 line-clamp-2">{strategy.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            aria-label={t('strategies.editAria')}
            title={t('common.edit')}
            className="p-1.5 rounded-md text-content-secondary hover:text-content-strong hover:bg-white/[0.06] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            aria-label={t('strategies.deleteAria')}
            title={t('common.delete')}
            className="p-1.5 rounded-md text-content-secondary hover:text-neg hover:bg-neg/[0.08] transition-all"
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
              className="text-[10px] font-medium text-content-secondary border border-line-2 rounded px-1.5 py-0.5"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1 pt-1 border-t border-line">
        <span className="text-[10px] text-content-faint uppercase tracking-wide">
          {tPlural(rules.length, 'strategies.rulesCountOne', 'strategies.rulesCount')}
        </span>
        <ul className="flex flex-col gap-1 mt-1">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-[12px] text-content-secondary">
              <span className="w-1 h-1 rounded-full bg-content-faint shrink-0" />
              <span className="truncate">{r.label}</span>
              {r.required && (
                <span className="ml-auto text-[9px] text-warn/80 border border-warn/20 bg-warn/10 rounded px-1 py-0.5 uppercase tracking-wide shrink-0">
                  {t('strategies.required')}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="flex flex-col gap-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
      <div className="pt-2 border-t border-line flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </Card>
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
        addToast(t('strategies.deleted'), 'success')
        setPendingDelete(null)
      },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : t('strategies.deleteFailed')
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
    <>
      {/* Header */}
      <PageHeader
        title={t('strategies.title')}
        subtitle={isLoading ? t('common.loading') : tPlural(list.length, 'strategies.countOne', 'strategies.count')}
        actions={
          <>
            <Button variant="primary" className="self-start sm:self-auto"
          onClick={openCreate}
          
        >
          {t('strategies.new')}
        </Button>
          </>
        }
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <Card>
          <div className="text-xs text-neg py-6 text-center">{t('strategies.loadFailed')}</div>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            title={t('strategies.emptyTitle')}
            description={t('strategies.emptyBody')}
          />
          <div className="flex justify-center -mt-4 pb-2">
            <Button variant="primary"
              onClick={openCreate}
              
            >
              {t('strategies.new')}
            </Button>
          </div>
        </Card>
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
        title={t('strategies.deleteTitle')}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={isDeleting}>
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-content-secondary leading-relaxed">
          {pendingDelete && t('strategies.deleteBody', { name: pendingDelete.name })}
        </p>
      </Modal>
    </>
  )
}
