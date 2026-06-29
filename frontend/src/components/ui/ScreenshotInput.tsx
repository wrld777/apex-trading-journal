import { useState } from 'react'
import { useToastStore } from '../../store/toastStore'

// ── Validazione URL ───────────────────────────────────────────────────────────

/** Check sintattico: è un URL http(s) ben formato? */
function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Check semantico: l'URL rende davvero un'immagine?
 * Non ci si fida dell'estensione (lo snapshot TradingView non finisce in .png):
 * si prova a caricarlo in un <img> e si ascolta onload/onerror.
 */
function isLoadableImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

const FIELD =
  'bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full transition-all focus:border-white/[0.18] focus:bg-[#1a1a1d] placeholder:text-zinc-700'

// ── Componente ────────────────────────────────────────────────────────────────

export default function ScreenshotInput({ value, onChange }: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const addToast = useToastStore((s) => s.addToast)
  const [url, setUrl] = useState('')
  const [checking, setChecking] = useState(false)

  const add = async () => {
    const candidate = url.trim()
    if (!candidate) return
    if (!isHttpUrl(candidate)) {
      addToast('Inserisci un URL http(s) valido.', 'error')
      return
    }
    if (value.includes(candidate)) {
      addToast('Screenshot già aggiunto.', 'error')
      return
    }
    setChecking(true)
    const ok = await isLoadableImage(candidate)
    setChecking(false)
    if (!ok) {
      addToast('Il link non mostra un’immagine.', 'error')
      return
    }
    onChange([...value, candidate])
    setUrl('')
  }

  const remove = (u: string) => onChange(value.filter((x) => x !== u))

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void add()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="url"
          inputMode="url"
          placeholder="Incolla il link dell'immagine (es. snapshot TradingView)…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={onKeyDown}
          className={FIELD}
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={checking || !url.trim()}
          className="shrink-0 px-3 py-2 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {checking && (
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
            </svg>
          )}
          {checking ? 'Controllo…' : 'Aggiungi'}
        </button>
      </div>

      <p className="text-[11px] text-zinc-700">
        Su TradingView: tasto destro sullo snapshot → “Copia indirizzo immagine”.
      </p>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {value.map((src) => (
            <div key={src} className="relative group aspect-video">
              <a href={src} target="_blank" rel="noreferrer">
                <img
                  src={src}
                  alt="Trade screenshot"
                  className="w-full h-full object-cover rounded-md border border-white/[0.07]"
                />
              </a>
              <button
                type="button"
                onClick={() => remove(src)}
                aria-label="Rimuovi screenshot"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
