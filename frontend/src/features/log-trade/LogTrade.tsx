import { useState } from 'react'
import { useCreateTrade } from '../../hooks/useTrades'
import { useStrategies } from '../../hooks/useStrategies'
import { useInstruments } from '../../hooks/useInstruments'
import { useToastStore } from '../../store/toastStore'
import ScreenshotInput from '../../components/ui/ScreenshotInput'
import type { Direction } from '../../types/trade'
import type { StrategyRuleDto } from '../../types/strategy'

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
      className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0 cursor-pointer select-none group"
      onClick={() => onToggle(rule.id)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(rule.id) }}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
        checked ? 'bg-green-500 border-green-500' : 'border-white/[0.11] group-hover:border-white/[0.18]'
      }`}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-xs transition-colors ${checked ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>
        {rule.label}
      </span>
      {rule.required && (
        <span className="ml-auto shrink-0 text-[9px] font-medium tracking-[0.08em] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500/90">
          OBBL.
        </span>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-zinc-600 tracking-[0.04em]">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full transition-all
        focus:border-white/[0.18] focus:bg-[#1a1a1d] placeholder:text-zinc-700 ${props.className ?? ''}`}
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full cursor-pointer transition-all focus:border-white/[0.18] appearance-none"
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
      className={`bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full transition-all resize-y
        focus:border-white/[0.18] focus:bg-[#1a1a1d] placeholder:text-zinc-700 ${props.className ?? ''}`}
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-zinc-700">{children}</span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-6">
      {children}
    </div>
  )
}

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

  const selectedInstrument = instruments.find((i) => i.instrumentId === form.instrumentId) ?? null
  // Price steps follow the instrument's tick size (0.25 on index futures, 0.01 on CL…).
  const priceStep = selectedInstrument ? String(selectedInstrument.tickSize) : '0.25'

  const selectedStrategy = strategies.find((s) => s.id === strategyId) ?? null
  const checkedCount = selectedStrategy
    ? selectedStrategy.rules.filter((r) => ruleChecks[r.id]).length
    : 0

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
    if (['fvg', 'breaker', 'ob'].includes(tag)) return 'bg-green-500/10 border-green-500/20 text-green-500'
    if (['london-session', 'ny-session', 'killzone'].includes(tag)) return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    return 'bg-[#1a1a1d] border-white/[0.07] text-zinc-400'
  }

  const resetForm = () => {
    setForm(DEFAULT_FORM)
    setDirection('Long')
    setTags([])
    setTagInput('')
    setScreenshots([])
    setStrategyId('')
    setRuleChecks({})
  }

  const handleSubmit = () => {
    // Basic validation
    if (!form.instrumentId || !form.date || !form.entryPrice || !form.stopLoss || !form.quantity) {
      addToast('Please fill in all required fields.', 'error')
      return
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
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Log Trade</h1>
          <p className="text-xs text-zinc-600">New entry · Fill in all required fields</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetForm}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-50"
          >
            Reset
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
            {isPending ? 'Submitting…' : 'Submit Trade'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-3.5">

          <FormCard>
            <SectionTitle>Trade Details</SectionTitle>
            <div className="mb-3.5">
              <label className="text-[11px] text-zinc-600 tracking-[0.04em] block mb-1.5">Direction</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setDirection('Long')}
                  className={`flex-1 py-2 rounded-md border text-xs font-medium tracking-[0.04em] transition-all ${
                    direction === 'Long'
                      ? 'bg-green-500/12 border-green-500/25 text-green-500'
                      : 'bg-[#141416] border-white/[0.07] text-zinc-600 hover:border-white/[0.11] hover:text-zinc-400'
                  }`}
                >LONG</button>
                <button
                  onClick={() => setDirection('Short')}
                  className={`flex-1 py-2 rounded-md border text-xs font-medium tracking-[0.04em] transition-all ${
                    direction === 'Short'
                      ? 'bg-red-500/12 border-red-500/25 text-red-500'
                      : 'bg-[#141416] border-white/[0.07] text-zinc-600 hover:border-white/[0.11] hover:text-zinc-400'
                  }`}
                >SHORT</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3.5">
              <div className="col-span-2">
                <Field label="Instrument *">
                  <Select
                    value={form.instrumentId}
                    onChange={handleChange('instrumentId')}
                    disabled={instrumentsLoading}
                  >
                    <option value="">
                      {instrumentsLoading ? 'Loading…' : '— Select instrument —'}
                    </option>
                    {instruments.map((i) => (
                      <option key={i.instrumentId} value={i.instrumentId}>
                        {i.symbol} · {i.instrumentName}
                      </option>
                    ))}
                  </Select>
                </Field>
                {/* The point value is the whole reason this is a catalog and not free
                    text: showing it makes the P&L scale explicit before submitting. */}
                {selectedInstrument && (
                  <p className="text-[10px] text-zinc-600 mt-1.5">
                    {selectedInstrument.currency} {selectedInstrument.pointValue} per point ·
                    tick {selectedInstrument.tickSize} = {selectedInstrument.currency} {selectedInstrument.tickValue}
                  </p>
                )}
              </div>
              <Field label="Date *">
                <Input
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                />
              </Field>
              <Field label="Time">
                <Input
                  type="time"
                  value={form.time}
                  onChange={handleChange('time')}
                />
              </Field>
              <Field label="Entry Price *">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.entryPrice}
                  onChange={handleChange('entryPrice')}
                  step={priceStep}
                />
              </Field>
              <Field label="Stop Loss *">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.stopLoss}
                  onChange={handleChange('stopLoss')}
                  step={priceStep}
                />
              </Field>
              <Field label="Take Profit">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.takeProfit}
                  onChange={handleChange('takeProfit')}
                  step={priceStep}
                />
              </Field>
              <Field label="Exit Price">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.exitPrice}
                  onChange={handleChange('exitPrice')}
                  step={priceStep}
                />
              </Field>
              <Field label="Contracts / Qty *">
                <Input
                  type="number"
                  placeholder="1"
                  value={form.quantity}
                  onChange={handleChange('quantity')}
                  min="1"
                />
              </Field>
            </div>
          </FormCard>

          <FormCard>
            <SectionTitle>Context</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <Field label="Session">
                <Select value={form.session} onChange={handleChange('session')}>
                  <option>New York Open (09:30)</option>
                  <option>Silver Bullet (10:00)</option>
                  <option>London Open (02:00)</option>
                  <option>London Close (10:00)</option>
                  <option>Asia (20:00)</option>
                </Select>
              </Field>
              <Field label="Setup / Model">
                <Select value={form.setup} onChange={handleChange('setup')}>
                  <option>Breaker Block</option>
                  <option>ICT Order Block</option>
                  <option>Fair Value Gap</option>
                  <option>Silver Bullet</option>
                  <option>Liquidity Sweep</option>
                  <option>VWAP Rejection</option>
                </Select>
              </Field>
              <Field label="HTF Bias">
                <Select value={form.htfBias} onChange={handleChange('htfBias')}>
                  <option>Bullish</option>
                  <option>Bearish</option>
                  <option>Neutral</option>
                </Select>
              </Field>
              <Field label="Confluence Grade">
                <Select value={form.grade} onChange={handleChange('grade')}>
                  <option>A+ Setup</option>
                  <option>A Setup</option>
                  <option>B Setup</option>
                  <option>C Setup</option>
                </Select>
              </Field>
            </div>
            <Field label="Tags">
              <div
                className="flex flex-wrap gap-1.5 p-2 bg-[#141416] border border-white/[0.07] rounded-md min-h-[40px] items-center cursor-text focus-within:border-white/[0.18] transition-all"
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
                  placeholder="Add tag…"
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-700 flex-1 min-w-[80px] px-1"
                />
              </div>
            </Field>
          </FormCard>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-3.5">

          <FormCard>
            <SectionTitle>Screenshot</SectionTitle>
            <ScreenshotInput value={screenshots} onChange={setScreenshots} />
          </FormCard>

          <FormCard>
            <SectionTitle>Strategy &amp; Adherence</SectionTitle>
            <Field label="Strategy">
              <Select value={strategyId} onChange={(e) => selectStrategy(e.target.value)}>
                <option value="">— No strategy —</option>
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
                  <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-700">{checkedCount}/{selectedStrategy.rules.length} followed</span>
                    <div className="flex-1 mx-3 h-1 bg-[#1a1a1d] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${(checkedCount / selectedStrategy.rules.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-600 mt-3.5">This strategy has no rules yet.</p>
              )
            ) : (
              <p className="text-[11px] text-zinc-600 mt-3.5 leading-relaxed">
                Select a strategy to load its objective entry rules and record which you followed on this trade.
              </p>
            )}
          </FormCard>

          <FormCard>
            <SectionTitle>Notes &amp; Psychology</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Trade Rationale">
                <Textarea
                  rows={3}
                  placeholder="Describe the setup…"
                  value={form.rationale}
                  onChange={handleChange('rationale')}
                />
              </Field>
              <Field label="Emotional State">
                <Select value={form.emotionalState} onChange={handleChange('emotionalState')}>
                  <option>Calm &amp; Focused</option>
                  <option>Confident</option>
                  <option>Anxious</option>
                  <option>Overconfident</option>
                  <option>Revenge Mode</option>
                  <option>Distracted</option>
                </Select>
              </Field>
              <Field label="Mistakes / Lessons">
                <Textarea
                  rows={2}
                  placeholder="What could have been done better?"
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
