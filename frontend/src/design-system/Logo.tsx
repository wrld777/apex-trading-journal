import { cn } from './cn'

/**
 * Il marchio.
 *
 * Il segno di prima erano **tre barre crescenti**: un istogramma, cioè il
 * disegno che usano tutte le app di statistiche. Diceva "qui ci sono dei
 * numeri", che è la cosa meno distintiva che si possa dire di un prodotto — e
 * soprattutto non diceva niente di *questo* prodotto.
 *
 * Una *rubric* è una griglia di criteri espliciti con cui si valuta una
 * prestazione: nell'app è la checklist di regole di una strategia, e l'aderenza
 * a quelle regole è il dato che separa "strategia debole" da "esecuzione
 * indisciplinata". Il segno è quella griglia ridotta all'osso: tre righe, e
 * ogni riga è un criterio (il quadratino) con la sua misura (la barra).
 *
 * Il quadratino prende il colore di marca, la barra `currentColor`: così il
 * marchio si adatta al contesto in cui viene messo senza avere due versioni.
 * A 16px restano sei forme distinte — la prova che conta, perché è la
 * dimensione della scheda del browser.
 */

const ROWS = [4, 10.25, 16.5]

export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      {ROWS.map(y => (
        <g key={y}>
          <rect x={2.5} y={y} width={3.5} height={3.5} rx={1.1} fill="rgb(var(--c-brand))" />
          <rect x={8.5} y={y} width={13} height={3.5} rx={1.1} fill="currentColor" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Marchio e nome insieme. Il nome è in Syne, l'unico posto in cui quel
 * carattere compare: serve a distinguere il marchio dall'interfaccia, non a
 * decorarla.
 */
export function Wordmark({
  size = 24, hideName, className,
}: { size?: number; hideName?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 text-content-strong', className)}>
      <Logo size={size} />
      <span className={cn('font-brand font-bold text-md tracking-[0.14em]', hideName && 'lg:hidden')}>
        Rubric
      </span>
    </div>
  )
}
