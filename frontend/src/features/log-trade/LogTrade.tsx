import { useState } from 'react'
import { useCreateTrade } from '../../hooks/useTrades'
import { useStrategies } from '../../hooks/useStrategies'
import { useInstruments } from '../../hooks/useInstruments'
import { useToastStore } from '../../store/toastStore'
import ScreenshotInput from '../../components/ui/ScreenshotInput'
import type { Direction, TradeOutcome } from '../../types/trade'
import type { StrategyRuleDto } from '../../types/strategy'
import { t } from '../../i18n'

// ── Small UI helpers ──────────────────────────────────────────────────────────

// A single strategy rule rendered as an adherence checkbox (ADR 0003):
// the trader records whether the objective entry condition was met on this trade.
function RuleCheckItem({
  rule,
  checked,
  onToggle,
}: {
  rule: StrategyRuleDto
  checked: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-2 border-b border-line last:border-0 cursor-pointer select-none group"
      onClick={() => onToggle(rule.id)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(rule.id) }}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
        checked ? 'bg-pos border-pos' : 'border-line-control group-hover:border-line-control'
      }`}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-xs transition-colors ${checked ? 'text-content-muted line-through' : 'text-content-secondary'}`}>
        {rule.label}
      </span>
      {rule.required && (
        <span className="ml-auto shrink-0 text-[9px] font-medium tracking-[0.08em] px-1.5 py-0.5 rounded bg-warn/10 border border-warn/20 text-warn/90">
          {t('strategies.required')}
        </span>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-content-muted tracking-[0.04em]">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-surface-2 border border-line-2 rounded-md px-3 py-2 text-[13px] text-content-strong outline-none w-full transition-all
        focus:border-line-control focus:bg-surface-3 placeholder:text-content-faint ${props.className ?? ''}`}
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="bg-surface-2 border border-line-2 rounded-md px-3 py-2 text-[13px] text-content-strong outline-none w-full cursor-pointer transition-all focus:border-line-control appearance-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2352525b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
      }}
    >
      {children}
    </select>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`bg-surface-2 border border-line-2 rounded-md px-3 py-2 text-[13px] text-content-strong outline-none w-full transition-all resize-y
        focus:border-line-control focus:bg-surface-3 placeholder:text-content-faint ${props.className ?? ''}`}
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-content-faint">{children}</span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-[10px] p-4 lg:p-6">
      {children}
    </div>
  )
}

// ── Esiti di uscita (#96) ─────────────────────────────────────────────────────

// TP e SL derivano il prezzo dai livelli del trade: senza quel livello l'esito
// non è selezionabile, invece di far fallire il submit lato server.
const OUTCOMES: {
  value: TradeOutcome
  label: string
  hint: string
  disabled?: (form: typeof DEFAULT_FORM) => boolean
}[] = [
  { value: 'TakeProfit', label: t('logTrade.outcomeTakeProfit'), hint: t('logTrade.hintTakeProfit'), disabled: (f) => !f.takeProfit },
  { value: 'StopLoss', label: t('logTrade.outcomeStopLoss'), hint: t('logTrade.hintStopLoss'), disabled: (f) => !f.stopLoss },
  { value: 'BreakEven', label: t('logTrade.outcomeBreakEven'), hint: t('logTrade.hintBreakEven') },
  { value: 'Manual', label: t('logTrade.outcomeManual'), hint: t('logTrade.hintManual') },
]

interface PartialDraft {
  key: string
  outcome: TradeOutcome
  contracts: string
  price: string
}

let partialKeySeq = 1
const newPartial = (): PartialDraft => ({
  key: `x${partialKeySeq++}`,
  outcome: 'TakeProfit',
  contracts: '',
  price: '',
})

// ── Default form state ────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  instrumentId: '',
  date: '',
  time: '',
  entryPrice: '',
  stopLoss: '',
  takeProfit: '',
  exitPrice: '',
  quantity: '',
  session: 'New York Open (09:30)',
  setup: 'Breaker Block',
  htfBias: 'Bullish',
  grade: 'A+ Setup',
  rationale: '',
  emotionalState: 'Calm & Focused',
  mistakes: '',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LogTrade() {
  const { mutate: createTrade, isPending } = useCreateTrade()
  const { data: strategies = [] } = useStrategies()
  const { data: instruments = [], isLoading: instrumentsLoading } = useInstruments()
  const addToast = useToastStore((s) => s.addToast)

  const [direction, setDirection] = useState<Direction>('Long')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [strategyId, setStrategyId] = useState('')
  // Adherence keyed by StrategyRule id → whether the rule was followed on this trade.
  const [ruleChecks, setRuleChecks] = useState<Record<string, boolean>>({})
  // Uscita (#96): esito singolo, oppure righe parziali quando la sezione è aperta.
  const [outcome, setOutcome] = useState<TradeOutcome | ''>('')
  const [partialsOpen, setPartialsOpen] = useState(false)
  const [partials, setPartials] = useState<PartialDraft[]>([newPartial()])

  const selectedInstrument = instruments.find((i) => i.instrumentId === form.instrumentId) ?? null
  // Price steps follow the instrument's tick size (0.25 on index futures, 0.01 on CL…).
  const priceStep = selectedInstrument ? String(selectedInstrument.tickSize) : '0.25'

  const selectedStrategy = strategies.find((s) => s.id === strategyId) ?? null
  const checkedCount = selectedStrategy
    ? selectedStrategy.rules.filter((r) => ruleChecks[r.id]).length
    : 0

  // Una strategia dichiara su quali strumenti gira (#95): se ne ha, il select
  // mostra solo quelli. Elenco vuoto = nessun vincolo, si vede tutto il catalogo.
  const strategyInstrumentIds = selectedStrategy?.instrumentIds ?? []
  const visibleInstruments =
    strategyInstrumentIds.length > 0
      ? instruments.filter((i) => strategyInstrumentIds.includes(i.instrumentId))
      : instruments

  const quantityNumber = parseInt(form.quantity, 10) || 0
  const partialContracts = partials.reduce((sum, p) => sum + (parseInt(p.contracts, 10) || 0), 0)

  // Che prezzo userà il server per l'esito scelto, detto in chiaro nel form.
  const outcomePriceLabel =
    outcome === 'TakeProfit'
      ? t('logTrade.levelTakeProfit', { price: form.takeProfit || '—' })
      : outcome === 'StopLoss'
        ? t('logTrade.levelStopLoss', { price: form.stopLoss || '—' })
        : t('logTrade.levelEntry', { price: form.entryPrice || '—' })

  const updatePartial = (key: string, patch: Partial<PartialDraft>) =>
    setPartials((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)))

  const addPartial = () => setPartials((ps) => [...ps, newPartial()])

  const removePartial = (key: string) => setPartials((ps) => ps.filter((p) => p.key !== key))

  const togglePartials = () =>
    setPartialsOpen((open) => {
      // Rientrando su uscita singola le righe non servono più; entrando, si parte
      // da una riga sola così il primo parziale è già pronto da compilare.
      setPartials([newPartial()])
      return !open
    })

  const handleChange = (field: keyof typeof DEFAULT_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const selectStrategy = (id: string) => {
    setStrategyId(id)
    const s = strategies.find((x) => x.id === id)
    // Reset adherence to the chosen strategy's rules, all unchecked.
    setRuleChecks(s ? Object.fromEntries(s.rules.map((r) => [r.id, false])) : {})

    // Lo strumento già scelto può non rientrare tra quelli della nuova strategia:
    // lasciarlo selezionato ma fuori lista significherebbe un select che mostra
    // il placeholder e invia comunque il vecchio id.
    const allowed = s?.instrumentIds ?? []
    if (allowed.length > 0 && form.instrumentId && !allowed.includes(form.instrumentId)) {
      setForm((prev) => ({ ...prev, instrumentId: '' }))
    }
  }

  const toggleRule = (id: string) => {
    setRuleChecks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const tagColor = (tag: string) => {
    if (['fvg', 'breaker', 'ob'].includes(tag)) return 'bg-pos/10 border-pos/20 text-pos'
    if (['london-session', 'ny-session', 'killzone'].includes(tag)) return 'bg-brand/10 border-brand/20 text-brand'
    return 'bg-surface-3 border-line-2 text-content-secondary'
  }

  const resetForm = () => {
    setForm(DEFAULT_FORM)
    setDirection('Long')
    setTags([])
    setTagInput('')
    setScreenshots([])
    setStrategyId('')
    setRuleChecks({})
    setOutcome('')
    setPartialsOpen(false)
    setPartials([newPartial()])
  }

  const handleSubmit = () => {
    // Basic validation
    if (!form.instrumentId || !form.date || !form.entryPrice || !form.stopLoss || !form.quantity) {
      addToast('Please fill in all required fields.', 'error')
      return
    }

    // Uscita (#96). Il trade si registra sempre già chiuso, quindi l'esito è
    // obbligatorio e sui parziali i contratti devono coprire tutta la quantità.
    if (!partialsOpen && outcome === '') {
      addToast(t('logTrade.chooseOutcome'), 'error')
      return
    }
    if (!partialsOpen && outcome === 'Manual' && !form.exitPrice) {
      addToast(t('logTrade.manualNeedsPrice'), 'error')
      return
    }
    if (partialsOpen) {
      if (partials.some((p) => (parseInt(p.contracts, 10) || 0) <= 0)) {
        addToast(t('logTrade.everyExitNeedsContracts'), 'error')
        return
      }
      if (partials.some((p) => p.outcome === 'Manual' && !p.price)) {
        addToast(t('logTrade.manualNeedsPricePlural'), 'error')
        return
      }
      if (partialContracts !== quantityNumber) {
        addToast(
          t('logTrade.exitsMismatch', { done: partialContracts, total: quantityNumber }),
          'error',
        )
        return
      }
    }

    const entryTime = form.time
      ? `${form.date}T${form.time}:00.000Z`
      : `${form.date}T00:00:00.000Z`

    createTrade(
      {
        instrumentId: form.instrumentId,
        direction,
        entryPrice: parseFloat(form.entryPrice),
        stopLoss: parseFloat(form.stopLoss),
        takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : 0,
        exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : 0,
        quantity: parseInt(form.quantity, 10),
        entryTime,
        session: form.session,
        setup: form.setup,
        htfBias: form.htfBias,
        grade: form.grade,
        rationale: form.rationale,
        emotionalState: form.emotionalState,
        mistakes: form.mistakes,
        tags,
        screenshots,
        strategyId: strategyId || null,
        ruleChecks: selectedStrategy
          ? selectedStrategy.rules.map((r) => ({ strategyRuleId: r.id, checked: !!ruleChecks[r.id] }))
          : [],
        // Esito singolo oppure parziali: `exits` vince quando c'è, quindi si manda
        // solo la forma effettivamente usata.
        ...(partialsOpen
          ? {
              exits: partials.map((p, i) => ({
                outcome: p.outcome,
                contracts: parseInt(p.contracts, 10),
                price: p.outcome === 'Manual' ? parseFloat(p.price) : undefined,
                order: i,
              })),
            }
          : { outcome: outcome as TradeOutcome }),
      },
      {
        onSuccess: () => {
          addToast('Trade logged successfully!', 'success')
          resetForm()
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to log trade. Please try again.'
          addToast(message, 'error')
        },
      }
    )
  }

  return (
    <div className="p-4 lg:p-7">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-sans font-bold text-xl tracking-tight text-content-strong leading-none mb-1">{t('logTrade.title')}</h1>
          <p className="text-xs text-content-muted">{t('logTrade.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetForm}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs text-content-secondary border border-line-2 hover:bg-surface-3 transition-all disabled:opacity-50"
          >
            {t('logTrade.reset')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {isPending && (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
              </svg>
            )}
            {isPending ? t('logTrade.submitting') : t('logTrade.submit')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-3.5">

          <FormCard>
            <SectionTitle>{t('logTrade.sectionTradeDetails')}</SectionTitle>
            <div className="mb-3.5">
              <label className="text-[11px] text-content-muted tracking-[0.04em] block mb-1.5">{t('logTrade.direction')}</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setDirection('Long')}
                  className={`flex-1 py-2 rounded-md border text-xs font-medium tracking-[0.04em] transition-all ${
                    direction === 'Long'
                      ? 'bg-pos/12 border-pos/25 text-pos'
                      : 'bg-surface-2 border-line-2 text-content-muted hover:border-line-control hover:text-content-secondary'
                  }`}
                >{t('logTrade.long')}</button>
                <button
                  onClick={() => setDirection('Short')}
                  className={`flex-1 py-2 rounded-md border text-xs font-medium tracking-[0.04em] transition-all ${
                    direction === 'Short'
                      ? 'bg-neg/12 border-neg/25 text-neg'
                      : 'bg-surface-2 border-line-2 text-content-muted hover:border-line-control hover:text-content-secondary'
                  }`}
                >{t('logTrade.short')}</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3.5">
              <div className="col-span-2">
                <Field label={t('logTrade.instrument')}>
                  <Select
                    value={form.instrumentId}
                    onChange={handleChange('instrumentId')}
                    disabled={instrumentsLoading}
                  >
                    <option value="">
                      {instrumentsLoading ? t('common.loading') : t('logTrade.selectInstrument')}
                    </option>
                    {visibleInstruments.map((i) => (
                      <option key={i.instrumentId} value={i.instrumentId}>
                        {i.symbol} · {i.instrumentName}
                      </option>
                    ))}
                  </Select>
                </Field>
                {strategyInstrumentIds.length > 0 && (
                  <p className="text-[10px] text-content-muted mt-1.5">
                    Limitato ai {visibleInstruments.length} strumenti di{' '}
                    <span className="text-content-secondary">{selectedStrategy?.name}</span>.
                  </p>
                )}
                {/* The point value is the whole reason this is a catalog and not free
                    text: showing it makes the P&L scale explicit before submitting. */}
                {selectedInstrument && (
                  <p className="text-[10px] text-content-muted mt-1.5">
                    {selectedInstrument.currency} {selectedInstrument.pointValue} per point ·
                    tick {selectedInstrument.tickSize} = {selectedInstrument.currency} {selectedInstrument.tickValue}
                  </p>
                )}
              </div>
              <Field label={t('logTrade.date')}>
                <Input
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                />
              </Field>
              <Field label={t('logTrade.time')}>
                <Input
                  type="time"
                  value={form.time}
                  onChange={handleChange('time')}
                />
              </Field>
              <Field label={t('logTrade.entryPrice')}>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.entryPrice}
                  onChange={handleChange('entryPrice')}
                  step={priceStep}
                />
              </Field>
              <Field label={t('logTrade.stopLoss')}>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.stopLoss}
                  onChange={handleChange('stopLoss')}
                  step={priceStep}
                />
              </Field>
              <Field label={t('logTrade.takeProfit')}>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.takeProfit}
                  onChange={handleChange('takeProfit')}
                  step={priceStep}
                />
              </Field>
              <Field label={t('logTrade.quantity')}>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.quantity}
                  onChange={handleChange('quantity')}
                  min="1"
                />
              </Field>
            </div>

            {/* Uscita (#96) — si ragiona per esito, non per prezzo: il prezzo
                di TP/SL/BE è già nei campi sopra e lo deriva il server. */}
            <SectionTitle>{t('logTrade.exitSection')}</SectionTitle>

            {!partialsOpen ? (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOutcome(o.value)}
                      aria-pressed={outcome === o.value}
                      disabled={o.disabled?.(form) ?? false}
                      title={o.hint}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        outcome === o.value
                          ? 'bg-white text-black border-white'
                          : 'text-content-secondary border-line-2 hover:border-line-control hover:text-content'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {outcome === 'Manual' ? (
                  <div className="max-w-[220px] mb-2">
                    <Field label={t('logTrade.exitPrice')}>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={form.exitPrice}
                        onChange={handleChange('exitPrice')}
                        step={priceStep}
                      />
                    </Field>
                  </div>
                ) : outcome !== '' ? (
                  <p className="text-[11px] text-content-muted mb-2">
                    {t('logTrade.derivedPrice', { level: outcomePriceLabel })}
                  </p>
                ) : (
                  <p className="text-[11px] text-content-muted mb-2">{t('logTrade.chooseOutcome')}</p>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-2 mb-2">
                {partials.map((p, i) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <div className="w-[130px] shrink-0">
                      <Select
                        value={p.outcome}
                        onChange={(e) => updatePartial(p.key, { outcome: e.target.value as TradeOutcome })}
                      >
                        {OUTCOMES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="w-[110px] shrink-0">
                      <Input
                        type="number"
                        placeholder={t('logTrade.contractsPlaceholder')}
                        value={p.contracts}
                        onChange={(e) => updatePartial(p.key, { contracts: e.target.value })}
                        min="1"
                      />
                    </div>
                    {p.outcome === 'Manual' && (
                      <div className="w-[130px] shrink-0">
                        <Input
                          type="number"
                          placeholder={t('logTrade.pricePlaceholder')}
                          value={p.price}
                          onChange={(e) => updatePartial(p.key, { price: e.target.value })}
                          step={priceStep}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePartial(p.key)}
                      disabled={partials.length === 1}
                      aria-label={t('logTrade.removeExit', { n: i + 1 })}
                      className="p-1 rounded-md text-content-muted hover:text-neg hover:bg-neg/[0.08] transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 3.5h9M5.5 3.5V2.3h3v1.2M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={addPartial}
                    className="px-2.5 py-1 rounded-md text-[11px] text-content-secondary border border-dashed border-line-control hover:bg-surface-3 hover:text-content transition-all"
                  >
                    {t('logTrade.addExit')}
                  </button>
                  {/* Il trade si registra già chiuso: se i contratti non tornano
                      il server rifiuta, tanto vale dirlo subito. */}
                  <span
                    className={`text-[11px] ${
                      quantityNumber > 0 && partialContracts === quantityNumber
                        ? 'text-content-muted'
                        : 'text-warn/90'
                    }`}
                  >
                    {t('logTrade.contractsTally', { done: partialContracts, total: quantityNumber || '—' })}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={togglePartials}
              className="text-[11px] text-content-secondary hover:text-content transition-colors underline underline-offset-2"
            >
              {partialsOpen ? t('logTrade.backToSingleExit') : t('logTrade.scaledOut')}
            </button>
          </FormCard>

          {/* I valori delle tendine qui sotto restano stringhe fisse e non passano
              dal dizionario: vengono salvati così com'è sul trade e i filtri del
              Trade Log ci fanno match. Tradurli scollegherebbe i trade già
              registrati dai loro filtri — sono dati, non interfaccia. */}
          <FormCard>
            <SectionTitle>{t('logTrade.sectionContext')}</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <Field label={t('logTrade.session')}>
                <Select value={form.session} onChange={handleChange('session')}>
                  <option>New York Open (09:30)</option>
                  <option>Silver Bullet (10:00)</option>
                  <option>London Open (02:00)</option>
                  <option>London Close (10:00)</option>
                  <option>Asia (20:00)</option>
                </Select>
              </Field>
              <Field label={t('logTrade.setup')}>
                <Select value={form.setup} onChange={handleChange('setup')}>
                  <option>Breaker Block</option>
                  <option>ICT Order Block</option>
                  <option>Fair Value Gap</option>
                  <option>Silver Bullet</option>
                  <option>Liquidity Sweep</option>
                  <option>VWAP Rejection</option>
                </Select>
              </Field>
              <Field label={t('logTrade.htfBias')}>
                <Select value={form.htfBias} onChange={handleChange('htfBias')}>
                  <option>Bullish</option>
                  <option>Bearish</option>
                  <option>Neutral</option>
                </Select>
              </Field>
              <Field label={t('logTrade.grade')}>
                <Select value={form.grade} onChange={handleChange('grade')}>
                  <option>A+ Setup</option>
                  <option>A Setup</option>
                  <option>B Setup</option>
                  <option>C Setup</option>
                </Select>
              </Field>
            </div>
            <Field label={t('logTrade.tags')}>
              <div
                className="flex flex-wrap gap-1.5 p-2 bg-surface-2 border border-line-2 rounded-md min-h-[40px] items-center cursor-text focus-within:border-line-control transition-all"
                onClick={() => document.getElementById('tag-input')?.focus()}
              >
                {tags.map(tag => (
                  <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${tagColor(tag)}`}>
                    {tag}
                    <button onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:opacity-70 ml-0.5">×</button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder={t('logTrade.tagPlaceholder')}
                  className="bg-transparent border-none outline-none text-xs text-content-strong placeholder:text-content-faint flex-1 min-w-[80px] px-1"
                />
              </div>
            </Field>
          </FormCard>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-3.5">

          <FormCard>
            <SectionTitle>{t('logTrade.sectionScreenshot')}</SectionTitle>
            <ScreenshotInput value={screenshots} onChange={setScreenshots} />
          </FormCard>

          <FormCard>
            <SectionTitle>{t('logTrade.sectionStrategy')}</SectionTitle>
            <Field label={t('logTrade.strategy')}>
              <Select value={strategyId} onChange={(e) => selectStrategy(e.target.value)}>
                <option value="">{t('logTrade.noStrategy')}</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>

            {selectedStrategy ? (
              selectedStrategy.rules.length > 0 ? (
                <div className="mt-3.5">
                  <div role="list">
                    {selectedStrategy.rules.map((rule) => (
                      <RuleCheckItem
                        key={rule.id}
                        rule={rule}
                        checked={!!ruleChecks[rule.id]}
                        onToggle={toggleRule}
                      />
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                    <span className="text-[11px] text-content-faint">{checkedCount}/{selectedStrategy.rules.length} followed</span>
                    <div className="flex-1 mx-3 h-1 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pos rounded-full transition-all duration-500"
                        style={{ width: `${(checkedCount / selectedStrategy.rules.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-content-muted mt-3.5">{t('logTrade.strategyNoRules')}</p>
              )
            ) : (
              <p className="text-[11px] text-content-muted mt-3.5 leading-relaxed">
                {t('logTrade.strategyHint')}
              </p>
            )}
          </FormCard>

          <FormCard>
            <SectionTitle>{t('logTrade.sectionNotes')}</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label={t('logTrade.rationale')}>
                <Textarea
                  rows={3}
                  placeholder={t('logTrade.rationalePlaceholder')}
                  value={form.rationale}
                  onChange={handleChange('rationale')}
                />
              </Field>
              <Field label={t('logTrade.emotionalState')}>
                <Select value={form.emotionalState} onChange={handleChange('emotionalState')}>
                  <option>Calm &amp; Focused</option>
                  <option>Confident</option>
                  <option>Anxious</option>
                  <option>Overconfident</option>
                  <option>Revenge Mode</option>
                  <option>Distracted</option>
                </Select>
              </Field>
              <Field label={t('logTrade.mistakes')}>
                <Textarea
                  rows={2}
                  placeholder={t('logTrade.mistakesPlaceholder')}
                  value={form.mistakes}
                  onChange={handleChange('mistakes')}
                />
              </Field>
            </div>
          </FormCard>

        </div>
      </div>
    </div>
  )
}
