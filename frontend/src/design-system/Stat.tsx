import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import Card from './Card'
import { cn } from './cn'

/**
 * Un numero e cosa significa.
 *
 * È la forma più ripetuta del prodotto — ne esistevano cinque scritture diverse
 * su quattro file — e la più facile da sbagliare, perché mescolava due cose che
 * non sono la stessa:
 *
 *  - **il tono**: il numero è di per sé un guadagno o una perdita?
 *  - **la direzione**: il valore secondario sale o scende?
 *
 * `KpiCard` aveva un solo `deltaUp` per entrambe, così un win rate del 49,8%
 * usciva **rosso**: un dato neutro dipinto come un errore. Un win rate basso
 * non è un difetto se l'expectancy è positiva — è esattamente la lettura che
 * questa app esiste per rendere possibile. Qui il tono si dichiara a parte, e
 * il valore predefinito è `neutral`: si colora solo ciò che ha davvero un segno.
 */

const value = cva('font-mono font-medium tracking-tight leading-none', {
  variants: {
    tone: {
      neutral:  'text-content-strong',
      positive: 'text-pos',
      negative: 'text-neg',
      muted:    'text-content-faint',
    },
    size: {
      sm: 'text-md',
      md: 'text-lg',
      lg: 'text-2xl',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
})

export type StatTone = NonNullable<VariantProps<typeof value>['tone']>

const LABEL = 'text-2xs text-content-muted uppercase tracking-[0.08em]'

export interface DeltaProps {
  text: string
  /** Il verso del confronto. `flat` per un dato che non sale né scende. */
  direction?: 'up' | 'down' | 'flat'
}

/** La freccia è ridondante rispetto al colore, e va bene così: il colore da solo
 *  non arriva a chi non lo distingue. */
function Delta({ text, direction = 'flat' }: DeltaProps) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs',
      direction === 'up' && 'bg-pos/10 text-pos',
      direction === 'down' && 'bg-neg/10 text-neg',
      direction === 'flat' && 'bg-surface-3 text-content-secondary',
    )}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {text}
    </span>
  )
}

interface StatProps extends VariantProps<typeof value> {
  label: string
  /** Già formattato: la formattazione è una decisione della pagina, non della primitiva. */
  children: React.ReactNode
  /**
   * Etichetta sopra il valore. Serve quando l'etichetta è l'**identità** della
   * riga e non la sua descrizione — l'elenco delle sessioni si scorre per nome,
   * non per numero, e mettere il numero davanti costringerebbe a rileggerlo.
   */
  labelFirst?: boolean
  className?: string
}

/**
 * Numero sopra, etichetta sotto. È l'ordine giusto quando i numeri sono in
 * fila e si scorrono: si legge il valore, e l'etichetta serve solo a quelli su
 * cui ci si ferma.
 */
export function Stat({ label, children, tone, size, labelFirst, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', labelFirst && 'flex-col-reverse', className)}>
      <div className={value({ tone, size })}>{children}</div>
      <div className={LABEL}>{label}</div>
    </div>
  )
}

/**
 * Etichetta a sinistra, numero a destra. Per gli elenchi verticali, dove
 * l'allineamento a destra incolonna le cifre e le rende confrontabili.
 */
export function StatRow({
  label, children, tone, className,
}: { label: string; children: React.ReactNode; tone?: StatTone; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2 border-b border-line last:border-0', className)}>
      <span className="text-xs text-content-secondary">{label}</span>
      <span className={cn(value({ tone }), 'text-xs')}>{children}</span>
    </div>
  )
}

interface StatCardProps extends StatProps {
  /** Il confronto: sotto il valore, con il suo verso. */
  delta?: DeltaProps
  /** Una riga di spiegazione: su cosa è calcolato, cosa vuol dire. */
  hint?: string
  /** Miniatura, barra di riempimento, o qualunque supporto visivo. */
  footer?: React.ReactNode
}

/**
 * La card di una metrica: valore, confronto, spiegazione, supporto visivo.
 * Le quattro parti sono opzionali tranne la prima, e vanno sempre in
 * quest'ordine — la sequenza è il contratto.
 */
export function StatCard({ label, children, tone, delta, hint, footer, className }: StatCardProps) {
  return (
    <Card interactive className={cn('flex flex-col', className)}>
      <div className={cn(LABEL, 'mb-3.5')}>{label}</div>
      <div className={cn(value({ tone, size: 'lg' }), 'mb-2')}>{children}</div>
      {delta && <div className="mb-2"><Delta {...delta} /></div>}
      {hint && <div className="text-2xs text-content-faint">{hint}</div>}
      {footer && <div className="mt-auto pt-2">{footer}</div>}
    </Card>
  )
}
