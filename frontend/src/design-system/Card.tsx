import { cn } from './cn'

/**
 * Il contenitore del prodotto.
 *
 * Prima la stessa ricetta era scritta in dodici grafie su dieci file, con
 * padding che oscillava fra 16, 18 e 24px, raggio fra 10 e 12 e bordo fra il
 * 4% e il 7%. Nessuna di quelle differenze era una decisione.
 */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `flush` toglie il padding: per le card che contengono solo una tabella. */
  padding?: 'default' | 'compact' | 'flush'
  /** Alza il bordo al passaggio del mouse. Solo per le card cliccabili. */
  interactive?: boolean
}

export default function Card({ className, padding = 'default', interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-line rounded-lg',
        padding === 'default' && 'p-4 lg:p-5',
        padding === 'compact' && 'p-3',
        interactive && 'hover:border-line-2 transition-colors',
        className,
      )}
      {...props}
    />
  )
}

/**
 * L'intestazione di una card: titolo a sinistra, comandi a destra.
 *
 * Il titolo è maiuscolo e spaziato — è l'unico posto in cui quel trattamento
 * resta, perché su un'etichetta di due parole aiuta a distinguerla dal
 * contenuto, mentre su una frase intera rallenta soltanto la lettura.
 */
export function CardHeader({
  title, subtitle, action, className,
}: { title: string; subtitle?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-2xs text-content-muted uppercase tracking-[0.1em]">{title}</h2>
        {subtitle && <p className="text-2xs text-content-faint mt-1 normal-case tracking-normal">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
