import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn'

/**
 * Etichetta di stato.
 *
 * Le tinte semantiche restano quelle del testo, non quelle dei pieni: qui il
 * colore sta su un fondo trasparente al 10%, dove il rosso chiaro passa
 * abbondantemente. Il pieno saturo serve solo ai bottoni.
 */
const badge = cva(
  'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        pos:     'bg-pos/10 border-pos/20 text-pos',
        neg:     'bg-neg/10 border-neg/20 text-neg',
        warn:    'bg-warn/10 border-warn/20 text-warn',
        brand:   'bg-brand/10 border-brand/20 text-brand',
        neutral: 'bg-neutral2/10 border-neutral2/20 text-content-secondary',
        outline: 'bg-transparent border-line-2 text-content-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>

export default function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />
}
