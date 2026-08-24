import { Check } from 'lucide-react'
import { cn } from './cn'

/**
 * Casella di spunta.
 *
 * L'`<input type="checkbox">` c'è davvero, solo reso invisibile: la spunta
 * disegnata gli sta sopra. La checklist delle regole era un `<div
 * role="checkbox">` con `onKeyDown` scritto a mano — funzionava con Invio e
 * spazio, ma restava fuori dalla gestione nativa dei moduli, e ogni comando
 * ricostruito è un comando che va poi mantenuto.
 *
 * L'input è **figlio diretto** della label, non annidato nel riquadro: solo
 * così è il fratello precedente di ciò che deve comandare, e le varianti
 * `peer-checked:` valgono davvero. Annidato, quelle classi si scrivono uguali
 * e non fanno niente — è il modo più silenzioso di rompere un controllo.
 */
export default function Checkbox({
  label, trailing, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode
  /** Contenuto allineato a destra: un badge, un conteggio. */
  trailing?: React.ReactNode
}) {
  return (
    <label className={cn('flex items-center gap-2.5 py-2 cursor-pointer select-none group', className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className={cn(
        'w-4 h-4 rounded border border-line-control flex items-center justify-center shrink-0 transition-colors',
        'group-hover:border-content-faint',
        'peer-checked:bg-pos peer-checked:border-pos peer-checked:[&_svg]:opacity-100',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-brand/60 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface',
        'peer-disabled:opacity-40',
      )}>
        <Check className="h-3 w-3 text-bg opacity-0" strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="text-xs text-content-secondary min-w-0 transition-colors peer-checked:text-content-muted peer-checked:line-through">
        {label}
      </span>
      {trailing}
    </label>
  )
}
