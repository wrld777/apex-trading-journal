import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from './cn'

/**
 * Tabella dati.
 *
 * La tabella era riscritta a mano in Dashboard e Trade Log, con intestazioni
 * a 1,81:1 di contrasto e allineamenti decisi cella per cella. Qui la regola
 * è una: `numeric` allinea a destra e passa al monospaziato, così le colonne
 * di cifre si leggono in verticale.
 *
 * Lo scorrimento orizzontale sta dentro `TableWrap`: una tabella larga deve
 * scorrere dentro il suo riquadro, mai far scorrere la pagina.
 */

export function TableWrap({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('overflow-x-auto', className)} {...props} />
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full text-left border-collapse', className)} {...props} />
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('text-2xs text-content-muted uppercase tracking-[0.06em]', className)}
      {...props}
    />
  )
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-line last:border-0 hover:bg-surface-3/40 transition-colors', className)}
      {...props}
    />
  )
}

type CellProps = React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }

export function TH({ className, numeric, ...props }: CellProps) {
  return (
    <th
      scope="col"
      className={cn('font-medium pb-2 px-3 first:pl-0 last:pr-0', numeric && 'text-right', className)}
      {...props}
    />
  )
}

export function TD({ className, numeric, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        'py-2.5 px-3 first:pl-0 last:pr-0 text-xs text-content-secondary',
        numeric && 'text-right font-mono',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Intestazione ordinabile. È un `<button>` dentro la cella, non la cella
 * stessa: così si raggiunge col Tab e si attiva da tastiera, cosa che una
 * `<th onClick>` non permette. `aria-sort` dice a chi non vede la freccia
 * come è ordinata la colonna.
 */
export function SortableTH({
  label, active, direction, onSort, numeric, className,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onSort: () => void
  numeric?: boolean
  className?: string
}) {
  const Icon = !active ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('font-medium pb-2 px-3 first:pl-0 last:pr-0', numeric && 'text-right', className)}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-[0.06em] rounded-sm',
          'hover:text-content transition-colors',
          active && 'text-content',
        )}
      >
        {label}
        <Icon className={cn('h-3 w-3', active ? 'text-content-secondary' : 'text-content-faint')} aria-hidden="true" />
      </button>
    </th>
  )
}
