import { cn } from './cn'

/**
 * Segnaposto di caricamento.
 *
 * `aria-hidden` perché uno scheletro non è informazione: chi usa uno screen
 * reader non deve sentirsi leggere una fila di blocchi vuoti. Lo stato di
 * caricamento va annunciato dal contenitore che ospita i dati.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse bg-surface-3 rounded', className)} />
}

/** Ingombro di una `StatCard`: etichetta, valore, confronto. */
export function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-line rounded-lg p-4 lg:p-5">
      <Skeleton className="h-3 w-16 mb-4" />
      <Skeleton className="h-7 w-24 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Righe impilate, per tabelle ed elenchi. */
export function TableSkeleton({ rows = 5, rowClassName = 'h-9' }: { rows?: number; rowClassName?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn('w-full', rowClassName)} />
      ))}
    </div>
  )
}
