import { useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { Field } from '../../../design-system'
import { t, type TranslationKey } from '../../../i18n'

/**
 * Etichette libere, una per Invio.
 *
 * Il riquadro portava il focus al campo con `document.getElementById`: un id
 * fisso in una pagina che potrebbe montare due volte lo stesso modulo, e una
 * ricerca nel DOM per raggiungere un elemento che sta due righe sopra. Ora è
 * un ref, e l'id lo genera React.
 *
 * Le etichette duplicate non si aggiungono: la stessa etichetta due volte sullo
 * stesso trade non significa niente e sporca i conteggi.
 *
 * I **suggerimenti** sotto al campo non sono una comodità: senza, "revenge
 * trade" e "revenge-trade" diventano due etichette diverse, e ogni conteggio si
 * dimezza senza che nessuno se ne accorga. Riproporre quelle già usate è ciò
 * che tiene insieme il vocabolario.
 */

/** Le famiglie note prendono un colore; le altre restano neutre. */
function defaultTone(tag: string) {
  if (['fvg', 'breaker', 'ob'].includes(tag)) return 'bg-pos/10 border-pos/20 text-pos'
  if (['london-session', 'ny-session', 'killzone'].includes(tag)) return 'bg-brand/10 border-brand/20 text-brand'
  return 'bg-surface-3 border-line-2 text-content-secondary'
}

export default function TagInput({
  tags, onChange, labelKey = 'logTrade.tags', placeholderKey = 'logTrade.tagPlaceholder',
  suggestions = [], tone = defaultTone, hint,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  labelKey?: TranslationKey
  placeholderKey?: TranslationKey
  /** Etichette già usate in passato, da riproporre per non frammentare il vocabolario. */
  suggestions?: string[]
  tone?: (tag: string) => string
  hint?: string
}) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const add = (value: string) => {
    const clean = value.trim()
    if (!clean) return
    // Il confronto ignora le maiuscole: "Revenge trade" e "revenge trade" sono
    // lo stesso errore, e contarli separati sarebbe peggio che non contarli.
    if (!tags.some(x => x.toLowerCase() === clean.toLowerCase())) onChange([...tags, clean])
    setDraft('')
  }

  const commit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && draft.trim()) {
      e.preventDefault()
      add(draft)
    }
    // Il tasto di cancellazione su un campo vuoto toglie l'ultima etichetta: è
    // il gesto che ci si aspetta, e senza servirebbe puntare la × col mouse.
    if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  const unused = suggestions.filter(s => !tags.some(x => x.toLowerCase() === s.toLowerCase())).slice(0, 8)

  return (
    <Field label={t(labelKey)} hint={hint}>
      <div className="flex flex-col gap-2">
        <div
          className="flex flex-wrap gap-1.5 p-2 bg-surface-2 border border-line-control rounded min-h-[38px] items-center cursor-text focus-within:border-brand transition-colors"
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map(tag => (
            <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs border ${tone(tag)}`}>
              {tag}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange(tags.filter(x => x !== tag)) }}
                aria-label={t('logTrade.removeTag', { tag })}
                className="rounded-full hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={id}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={commit}
            placeholder={t(placeholderKey)}
            className="bg-transparent border-none outline-none text-xs text-content-strong placeholder:text-content-faint flex-1 min-w-[80px] px-1"
          />
        </div>

        {unused.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {unused.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="px-2 py-0.5 rounded text-2xs border border-dashed border-line-2 text-content-muted hover:text-content hover:border-content-faint transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  )
}
