import { cn } from './cn'

/**
 * Scelta fra poche opzioni che stanno tutte a vista.
 *
 * Era riscritto quattro volte — periodo della Dashboard, granularità di
 * Insights, direzione e esito del Log Trade — ogni volta con la sua idea di
 * stato attivo. Tre su quattro erano `<button>` senza `aria-pressed`: chi usa
 * uno screen reader sentiva quattro bottoni identici senza sapere quale fosse
 * quello scelto.
 *
 * Non è un `<select>` perché le opzioni sono poche e il confronto fra loro fa
 * parte della scelta; non è un gruppo di radio perché l'aspetto è quello di un
 * comando, non di un modulo.
 */

export interface Segment<T extends string> {
  value: T
  label: string
  /** Cosa comporta l'opzione: compare al passaggio del mouse e come `aria-label`. */
  hint?: string
  disabled?: boolean
}

export default function SegmentedControl<T extends string>({
  value, onChange, options, label, size = 'sm', tone, className,
}: {
  value: T | ''
  onChange: (value: T) => void
  options: Segment<T>[]
  /** A cosa serve il gruppo nel suo insieme. */
  label: string
  size?: 'sm' | 'md'
  /** Colore dell'opzione scelta, quando il segno conta (long/short). */
  tone?: (value: T) => string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center gap-1 bg-surface-2 border border-line-2 rounded-md p-0.5', className)}
    >
      {options.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            disabled={o.disabled}
            title={o.hint}
            className={cn(
              'rounded transition-colors whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              size === 'sm' ? 'px-2.5 py-1 text-2xs uppercase tracking-widest' : 'px-3 py-1.5 text-xs font-medium',
              active
                ? tone?.(o.value) ?? 'bg-surface-3 text-content-strong'
                : 'text-content-muted hover:text-content-secondary',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
