import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from './cn'

/**
 * Il bottone del prodotto.
 *
 * Sostituisce sette stringhe di classi diverse sparse nelle pagine, che
 * dicevano tutte la stessa cosa con misure leggermente diverse.
 *
 * Sui pieni l'inchiostro è scelto per contrasto, non per abitudine: il rosso
 * chiaro con testo bianco regge 3,76:1, sotto la soglia di 4,5, quindi il
 * pieno distruttivo usa `neg-solid` (4,83:1 col bianco). Sul blu di marca
 * vale il contrario: passa l'inchiostro scuro, 5,41:1.
 */
const button = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap',
    'font-medium rounded transition-colors',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary:   'bg-brand text-brand-ink hover:bg-brand/90',
        secondary: 'border border-line-control text-content hover:bg-surface-3 hover:text-content-strong',
        ghost:     'text-content-secondary hover:bg-surface-3 hover:text-content-strong',
        danger:    'bg-neg-solid text-neg-ink hover:bg-neg-solid/90',
      },
      size: {
        /* 28px: solo per i comandi dentro una riga densa (tabelle, filtri). */
        sm: 'h-7 px-2.5 text-2xs',
        md: 'h-8 px-3 text-xs',
        lg: 'h-10 px-4 text-sm',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & {
    /** Mostra un indicatore e blocca il bottone senza cambiarne la larghezza. */
    loading?: boolean
  }

export default function Button({
  className, variant, size, block, loading, disabled, children, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(button({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

/**
 * Bottone di sola icona. Esiste come componente a sé perché ha due vincoli che
 * il bottone normale non ha: l'etichetta accessibile è obbligatoria — senza,
 * uno screen reader legge solo "pulsante" — e l'area di tocco non scende sotto
 * i 36px, mentre le icone del Trade Log stavano a 24.
 */
type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { label: string }

export function IconButton({ className, variant = 'ghost', label, children, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        button({ variant }),
        'h-9 w-9 p-0 shrink-0',
        className,
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
}
