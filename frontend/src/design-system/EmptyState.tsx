import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { cn } from './cn'

/**
 * Stato vuoto.
 *
 * Dice tre cose nell'ordine in cui servono: cosa manca, perché conta, come
 * rimediare. Senza l'azione resta una constatazione, ed è il motivo per cui
 * `actionLabel` esiste su quasi tutte le chiamate.
 */

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  actionTo?: string
  className?: string
}

export default function EmptyState({
  title, description, icon, actionLabel, actionTo, className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      <div className="text-content-faint mb-3" aria-hidden="true">
        {icon ?? <BarChart3 className="h-8 w-8" strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-medium text-content mb-1">{title}</p>
      {description && <p className="text-xs text-content-muted max-w-xs mb-4">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex h-8 items-center rounded bg-brand px-3 text-xs font-medium text-brand-ink hover:bg-brand/90 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
