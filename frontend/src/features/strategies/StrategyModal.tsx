import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { useCreateStrategy, useUpdateStrategy } from '../../hooks/useStrategies'
import { useInstruments } from '../../hooks/useInstruments'
import { useToastStore } from '../../store/toastStore'
import type { StrategyDto } from '../../types/strategy'

interface StrategyModalProps {
  open: boolean
  onClose: () => void
  /** When set, the modal edits this strategy; otherwise it creates a new one. */
  strategy: StrategyDto | null
}

// Local, editable representation of a rule row (client key keeps React stable).
interface RuleDraft {
  key: string
  label: string
  required: boolean
}

const INPUT =
  'bg-[#141416] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-[13px] text-zinc-200 outline-none focus:border-white/[0.18] placeholder:text-zinc-700 w-full'

let ruleKeySeq = 1
const newRule = (): RuleDraft => ({ key: `r${ruleKeySeq++}`, label: '', required: false })

export default function StrategyModal({ open, onClose, strategy }: StrategyModalProps) {
  const isEdit = strategy !== null
  const addToast = useToastStore((s) => s.addToast)
  const { mutate: createStrategy, isPending: isCreating } = useCreateStrategy()
  const { mutate: updateStrategy, isPending: isUpdating } = useUpdateStrategy()
  const isPending = isCreating || isUpdating

  const { data: instruments } = useInstruments()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState<RuleDraft[]>([newRule()])
  const [instrumentIds, setInstrumentIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Re-seed the form whenever the modal opens or switches strategy (render-time,
  // matching EditTradeModal — the project forbids setState inside useEffect).
  const seedKey = open ? (strategy?.id ?? 'new') : null
  const [seededKey, setSeededKey] = useState<string | null>(null)
  if (seedKey !== null && seedKey !== seededKey) {
    setSeededKey(seedKey)
    setError(null)
    if (strategy) {
      setName(strategy.name)
      setDescription(strategy.description ?? '')
      setRules(
        [...strategy.rules]
          .sort((a, b) => a.order - b.order)
          .map((r) => ({ key: `r${ruleKeySeq++}`, label: r.label, required: r.required })),
      )
      setInstrumentIds(strategy.instrumentIds ?? [])
    } else {
      setName('')
      setDescription('')
      setRules([newRule()])
      setInstrumentIds([])
    }
  }
  // Allow re-seeding next time it reopens.
  if (seedKey === null && seededKey !== null) setSeededKey(null)

  const updateRule = (key: string, patch: Partial<RuleDraft>) =>
    setRules((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const removeRule = (key: string) => setRules((rs) => rs.filter((r) => r.key !== key))

  const toggleInstrument = (id: string) =>
    setInstrumentIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))

  const moveRule = (index: number, dir: -1 | 1) =>
    setRules((rs) => {
      const next = [...rs]
      const target = index + dir
      if (target < 0 || target >= next.length) return rs
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const handleSubmit = () => {
    const trimmedName = name.trim()
    const cleanRules = rules
      .map((r) => ({ label: r.label.trim(), required: r.required }))
      .filter((r) => r.label !== '')

    if (!trimmedName) {
      setError('Il nome della strategia è obbligatorio.')
      return
    }
    if (cleanRules.length === 0) {
      setError('Aggiungi almeno una regola.')
      return
    }

    const payload = {
      name: trimmedName,
      description: description.trim(),
      rules: cleanRules.map((r, i) => ({ label: r.label, order: i, required: r.required })),
      instrumentIds,
    }

    const onSuccess = () => {
      addToast(isEdit ? 'Strategia aggiornata.' : 'Strategia creata.', 'success')
      onClose()
    }
    const onError = (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Operazione non riuscita.'
      setError(message)
    }

    if (isEdit && strategy) {
      updateStrategy({ id: strategy.id, data: payload }, { onSuccess, onError })
    } else {
      createStrategy(payload, { onSuccess, onError })
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { if (!isPending) onClose() }}
      title={isEdit ? 'Modifica strategia' : 'Nuova strategia'}
      maxWidth="max-w-xl"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {isPending && (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" />
              </svg>
            )}
            {isEdit ? 'Salva' : 'Crea'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. Breakout London Open"
            className={INPUT}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Descrizione</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contesto, mercato, timeframe…"
            rows={2}
            className={`${INPUT} resize-none`}
          />
        </div>

        {/* Instruments (#95) — il catalogo è breve e fisso: chip a toggle invece
            di un multi-select, così i simboli si leggono tutti a colpo d'occhio. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wide">
              Strumenti
            </label>
            <span className="text-[10px] text-zinc-700">
              {instrumentIds.length === 0 ? 'tutti' : `${instrumentIds.length} selezionat${instrumentIds.length === 1 ? 'o' : 'i'}`}
            </span>
          </div>

          {instruments === undefined ? (
            <p className="text-[11px] text-zinc-700">Caricamento catalogo…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {instruments.map((ins) => {
                  const active = instrumentIds.includes(ins.instrumentId)
                  return (
                    <button
                      key={ins.instrumentId}
                      type="button"
                      onClick={() => toggleInstrument(ins.instrumentId)}
                      aria-pressed={active}
                      title={`${ins.instrumentName} · ${ins.currency} ${ins.pointValue} per point`}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                        active
                          ? 'bg-white text-black border-white'
                          : 'text-zinc-400 border-white/[0.07] hover:border-white/[0.18] hover:text-zinc-200'
                      }`}
                    >
                      {ins.symbol}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-zinc-700 leading-relaxed">
                Su quali strumenti gira questa strategia. Lasciando vuoto vale per tutti.
              </p>
            </>
          )}
        </div>

        {/* Rules editor */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-zinc-500 uppercase tracking-wide">
              Regole (condizioni oggettive di ingresso)
            </label>
            <span className="text-[10px] text-zinc-700">{rules.length} voci</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {rules.map((rule, i) => (
              <div key={rule.key} className="flex items-center gap-2">
                {/* Reorder */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveRule(i, -1)}
                    disabled={i === 0}
                    aria-label="Sposta su"
                    className="text-zinc-700 hover:text-zinc-400 disabled:opacity-30 leading-none text-[10px]"
                  >▲</button>
                  <button
                    onClick={() => moveRule(i, 1)}
                    disabled={i === rules.length - 1}
                    aria-label="Sposta giù"
                    className="text-zinc-700 hover:text-zinc-400 disabled:opacity-30 leading-none text-[10px]"
                  >▼</button>
                </div>

                <input
                  value={rule.label}
                  onChange={(e) => updateRule(rule.key, { label: e.target.value })}
                  placeholder={`Regola ${i + 1}…`}
                  className={`${INPUT} flex-1`}
                />

                <label
                  className="flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer select-none whitespace-nowrap"
                  title="Regola obbligatoria per considerare il setup valido"
                >
                  <input
                    type="checkbox"
                    checked={rule.required}
                    onChange={(e) => updateRule(rule.key, { required: e.target.checked })}
                    className="accent-white w-3.5 h-3.5"
                  />
                  Obbl.
                </label>

                <button
                  onClick={() => removeRule(rule.key)}
                  disabled={rules.length === 1}
                  aria-label="Rimuovi regola"
                  title="Rimuovi"
                  className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 3.5h9M5.5 3.5V2.3h3v1.2M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setRules((rs) => [...rs, newRule()])}
            className="self-start mt-1 px-2.5 py-1 rounded-md text-[11px] text-zinc-400 border border-dashed border-white/[0.12] hover:bg-[#1a1a1d] hover:text-zinc-200 transition-all"
          >
            + Aggiungi regola
          </button>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}
      </div>
    </Modal>
  )
}
