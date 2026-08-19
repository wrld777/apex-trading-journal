import { useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { Field } from '../../../design-system'
import { t } from '../../../i18n'

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
 */

/** Le famiglie note prendono un colore; le altre restano neutre. */
function tagTone(tag: string) {
  if (['fvg', 'breaker', 'ob'].includes(tag)) return 'bg-pos/10 border-pos/20 text-pos'
  if (['london-session', 'ny-session', 'killzone'].includes(tag)) return 'bg-brand/10 border-brand/20 text-brand'
  return 'bg-surface-3 border-line-2 text-content-secondary'
}

export default function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const commit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = draft.trim()
    if (e.key === 'Enter' && value) {
      e.preventDefault()
      if (!tags.includes(value)) onChange([...tags, value])
      setDraft('')
    }
    // Il tasto di cancellazione su un campo vuoto toglie l'ultima etichetta: è
    // il gesto che ci si aspetta, e senza servirebbe puntare la × col mouse.
    if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <Field label={t('logTrade.tags')}>
      <div
        className="flex flex-wrap gap-1.5 p-2 bg-surface-2 border border-line-control rounded min-h-[38px] items-center cursor-text focus-within:border-brand transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs border ${tagTone(tag)}`}>
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
          placeholder={t('logTrade.tagPlaceholder')}
          className="bg-transparent border-none outline-none text-xs text-content-strong placeholder:text-content-faint flex-1 min-w-[80px] px-1"
        />
      </div>
    </Field>
  )
}
