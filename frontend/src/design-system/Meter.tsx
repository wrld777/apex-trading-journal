import { cn } from './cn'

/**
 * Barra di riempimento: una percentuale letta come lunghezza.
 *
 * Era scritta a mano quattro volte, con spessori 1, 1.5 e 3px e fondi diversi.
 * Non è un `<progress>`: quello dichiara un'operazione in corso, mentre qui si
 * sta mostrando una proporzione già misurata.
 *
 * `role="meter"` con i valori dichiarati: senza, chi usa uno screen reader
 * riceve un elemento vuoto — e il numero che la barra rappresenta a volte non è
 * scritto da nessuna parte accanto.
 */
export default function Meter({
  value, tone = 'bg-brand', label, className,
}: { value: number; tone?: string; label?: string; className?: string }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1 w-full bg-surface-3 rounded-full overflow-hidden', className)}
    >
      <div className={cn('h-full rounded-full transition-[width]', tone)} style={{ width: `${pct}%` }} />
    </div>
  )
}
