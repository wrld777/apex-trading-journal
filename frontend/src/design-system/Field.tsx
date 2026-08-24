import { Children, cloneElement, isValidElement, useId } from 'react'
import { cn } from './cn'

/**
 * L'involucro di un campo: etichetta, aiuto, errore.
 *
 * Il punto non è l'aspetto, è il collegamento. `Field` genera un id, lo mette
 * sul controllo che gli passi e lo lega all'etichetta con `htmlFor`, poi
 * collega aiuto ed errore con `aria-describedby`. Prima le etichette erano
 * `<label>` senza `htmlFor`: cliccarle non faceva niente e uno screen reader
 * leggeva il campo senza sapere come si chiamasse.
 *
 * Il controllo si passa come figlio normale, non come funzione: le chiamate
 * restano leggibili e nessuno deve ricordarsi di propagare le proprietà a
 * mano. Se i figli non sono un singolo elemento, l'etichetta resta senza
 * `htmlFor` invece di agganciarsi a caso.
 */

interface FieldProps {
  label: string
  /** Testo d'aiuto sotto il controllo. L'errore ha la precedenza. */
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export default function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = error ? errorId : hint ? hintId : undefined

  const child = Children.count(children) === 1 ? Children.only(children) : null
  const control = isValidElement<Record<string, unknown>>(child)
    ? cloneElement(child, {
        id: (child.props.id as string | undefined) ?? id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={isValidElement(child) ? id : undefined} className="text-2xs text-content-muted">
        {label}
        {required && <span className="text-neg ml-0.5" aria-hidden="true">*</span>}
      </label>

      {control}

      {error ? (
        /* `role="alert"` perché l'errore compare dopo un'azione: senza, chi usa
           uno screen reader non saprebbe che è successo qualcosa. */
        <p id={errorId} role="alert" className="text-2xs text-neg">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-2xs text-content-faint">{hint}</p>
      ) : null}
    </div>
  )
}
