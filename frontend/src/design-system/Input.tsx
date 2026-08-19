import { ChevronDown } from 'lucide-react'
import { cn } from './cn'

/**
 * Controlli di inserimento.
 *
 * Il bordo usa `line-control` (3,01:1 sulla superficie): sotto quel rapporto
 * un campo non si distingue dal fondo per chi ha una vista ridotta, ed è
 * proprio la soglia WCAG per gli elementi non testuali. Prima era bianco al
 * 7%, cioè 1,87:1.
 *
 * L'altezza è 36px su tutti e tre: un modulo in cui input, select e bottoni
 * hanno altezze diverse si vede subito, ed è il difetto più comune quando le
 * classi si scrivono a mano ogni volta.
 */
const base = [
  'w-full bg-surface-2 border border-line-control rounded',
  'text-sm text-content placeholder:text-content-faint',
  'outline-none transition-colors',
  'hover:border-content-faint',
  'focus:border-brand focus-visible:outline-none',
  'aria-[invalid=true]:border-neg',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ')

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Allinea a destra e passa al monospaziato: per prezzi, quantità, R. */
  numeric?: boolean
}

export function Input({ className, numeric, ...props }: InputProps) {
  return (
    <input
      className={cn(base, 'h-9 px-3', numeric && 'font-mono text-right', className)}
      {...props}
    />
  )
}

export function Textarea({ className, rows = 3, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(base, 'py-2 px-3 resize-y', className)} {...props} />
}

/**
 * Select nativa, non una lista disegnata da noi: su mobile apre il selettore
 * di sistema, che è più comodo di qualsiasi menù ricostruito, e non costa
 * dipendenze. La freccia è un'icona sovrapposta perché quella di serie non è
 * intonabile.
 */
export function Select({
  className, wrapperClassName, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** La larghezza va sul contenitore, non sulla select: la freccia è posizionata
   *  rispetto a lui, e una select più stretta del suo involucro se la ritrova
   *  staccata dal bordo. */
  wrapperClassName?: string
}) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        className={cn(base, 'h-9 pl-3 pr-9 appearance-none cursor-pointer', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted"
        aria-hidden="true"
      />
    </div>
  )
}
