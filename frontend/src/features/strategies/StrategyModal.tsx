import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { useCreateStrategy, useUpdateStrategy } from '../../hooks/useStrategies'
import { useInstruments } from '../../hooks/useInstruments'
import { useToastStore } from '../../store/toastStore'
import type { StrategyDto } from '../../types/strategy'
import { t } from '../../i18n'

interface StrategyModalProps {
  open: boolean
  onClose: () => void
  /** When set, the modal edits this strategy; otherwise it creates a new one. */
  strategy: StrategyDto | null
}

// Local, editable representation of a rule row (client key keeps React stable).
// `id` c'è solo per le regole già salvate: senza, il server le ricrea e stacca
// l'aderenza registrata sui trade.
interface RuleDraft {
  key: string
  id?: string
  label: string
  required: boolean
}

const INPUT =
  'bg-surface-2 border border-line-2 rounded-md px-2.5 py-1.5 text-[13px] text-content outline-none focus:border-line-control placeholder:text-content-faint w-full'

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
          .map((r) => ({ key: `r${ruleKeySeq++}`, id: r.id, label: r.label, required: r.required })),
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
      .map((r) => ({ id: r.id, label: r.label.trim(), required: r.required }))
      .filter((r) => r.label !== '')

    if (!trimmedName) {
      setError(t('strategyModal.nameRequired'))
      return
    }
    if (cleanRules.length === 0) {
      setError(t('strategyModal.needsOneRule'))
      return
    }

    const payload = {
      name: trimmedName,
      description: description.trim(),
      rules: cleanRules.map((r, i) => ({ id: r.id, label: r.label, order: i, required: r.required })),
      instrumentIds,
    }

    const onSuccess = () => {
      addToast(isEdit ? t('strategyModal.updated') : t('strategyModal.created'), 'success')
      onClose()
    }
    const onError = (err: unknown) => {
      const message = err instanceof Error ? err.message : t('strategyModal.failed')
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
      title={isEdit ? t('strategyModal.editTitle') : t('strategyModal.newTitle')}
      maxWidth="max-w-xl"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs text-content-secondary border border-line-2 hover:bg-surface-3 transition-all disabled:opacity-50"
          >
            {t('common.cancel')}
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
            {isEdit ? t('common.save') : t('common.create')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-content-secondary uppercase tracking-wide">{t('strategyModal.name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('strategyModal.namePlaceholder')}
            className={INPUT}
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-content-secondary uppercase tracking-wide">{t('strategyModal.description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('strategyModal.descriptionPlaceholder')}
            rows={2}
            className={`${INPUT} resize-none`}
          />
        </div>

        {/* Instruments (#95) — il catalogo è breve e fisso: chip a toggle invece
            di un multi-select, così i simboli si leggono tutti a colpo d'occhio. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-content-secondary uppercase tracking-wide">
              {t('strategyModal.instruments')}
            </label>
            <span className="text-[10px] text-content-faint">
              {instrumentIds.length === 0
                ? t('strategyModal.instrumentsAll')
                : t('strategyModal.instrumentsSelected', { count: instrumentIds.length })}
            </span>
          </div>

          {instruments === undefined ? (
            <p className="text-[11px] text-content-faint">{t('strategyModal.instrumentsLoading')}</p>
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
                      title={t('strategyModal.instrumentTitle', { name: ins.instrumentName, currency: ins.currency, pointValue: ins.pointValue })}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                        active
                          ? 'bg-white text-black border-white'
                          : 'text-content-secondary border-line-2 hover:border-line-control hover:text-content'
                      }`}
                    >
                      {ins.symbol}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-content-faint leading-relaxed">
                {t('strategyModal.instrumentsHint')}
              </p>
            </>
          )}
        </div>

        {/* Rules editor */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-content-secondary uppercase tracking-wide">
              {t('strategyModal.rules')}
            </label>
            <span className="text-[10px] text-content-faint">{t('strategyModal.rulesCount', { count: rules.length })}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {rules.map((rule, i) => (
              <div key={rule.key} className="flex items-center gap-2">
                {/* Reorder */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveRule(i, -1)}
                    disabled={i === 0}
                    aria-label={t('strategyModal.moveUp')}
                    className="text-content-faint hover:text-content-secondary disabled:opacity-30 leading-none text-[10px]"
                  >▲</button>
                  <button
                    onClick={() => moveRule(i, 1)}
                    disabled={i === rules.length - 1}
                    aria-label={t('strategyModal.moveDown')}
                    className="text-content-faint hover:text-content-secondary disabled:opacity-30 leading-none text-[10px]"
                  >▼</button>
                </div>

                <input
                  value={rule.label}
                  onChange={(e) => updateRule(rule.key, { label: e.target.value })}
                  placeholder={t('strategyModal.rulePlaceholder', { n: i + 1 })}
                  className={`${INPUT} flex-1`}
                />

                <label
                  className="flex items-center gap-1.5 text-[11px] text-content-secondary cursor-pointer select-none whitespace-nowrap"
                  title={t('strategyModal.requiredHint')}
                >
                  <input
                    type="checkbox"
                    checked={rule.required}
                    onChange={(e) => updateRule(rule.key, { required: e.target.checked })}
                    className="accent-white w-3.5 h-3.5"
                  />
                  {t('strategies.required')}
                </label>

                <button
                  onClick={() => removeRule(rule.key)}
                  disabled={rules.length === 1}
                  aria-label={t('strategyModal.removeRule')}
                  title={t('common.remove')}
                  className="p-1 rounded-md text-content-muted hover:text-neg hover:bg-neg/[0.08] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
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
            className="self-start mt-1 px-2.5 py-1 rounded-md text-[11px] text-content-secondary border border-dashed border-line-control hover:bg-surface-3 hover:text-content transition-all"
          >
            {t('strategyModal.addRule')}
          </button>
        </div>

        {error && <p className="text-[12px] text-neg">{error}</p>}
      </div>
    </Modal>
  )
}
