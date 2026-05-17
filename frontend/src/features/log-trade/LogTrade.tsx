import { useState } from 'react'

type Direction = 'long' | 'short'

interface ChecklistItem {
  id: number
  label: string
  checked: boolean
}

function CheckItem({ item, onToggle }: { item: ChecklistItem; onToggle: (id: number) => void }) {
  return (
    <div
      className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0 cursor-pointer select-none group"
      onClick={() => onToggle(item.id)}
      role="checkbox"
      aria-checked={item.checked}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(item.id) }}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
        item.checked ? 'bg-green-500 border-green-500' : 'border-white/[0.11] group-hover:border-white/[0.18]'
      }`}>
        {item.checked && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-xs transition-colors ${item.checked ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>
        {item.label}
      </span>
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

export default function LogTrade() {
  const [direction, setDirection] = useState<Direction>('long')
  const [tags, setTags] = useState<string[]>(['fvg', 'london-session', 'breaker'])
  const [tagInput, setTagInput] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: 'HTF bias confirmed',          checked: true  },
    { id: 2, label: 'Killzone entry window',        checked: true  },
    { id: 3, label: 'PD array identified',          checked: true  },
    { id: 4, label: 'Liquidity taken before entry', checked: false },
    { id: 5, label: 'Risk ≤ 0.5% of account',      checked: false },
    { id: 6, label: 'News events checked',          checked: false },
    { id: 7, label: 'Stop placed beyond OB',        checked: true  },
  ])

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item))
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

  return (
    <div className="p-4 lg:p-7">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Log Trade</h1>
          <p className="text-xs text-zinc-600">New entry · Fill in all required fields</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all">Save Draft</button>
          <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all">Submit Trade</button>
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
                  onClick={() => setDirection('long')}
                  className={`flex-1 py-2 rounded-md border text-xs font-medium tracking-[0.04em] transition-all ${
                    direction === 'long'
                      ? 'bg-green-500/12 border-green-500/25 text-green-500'
                      : 'bg-[#141416] border-white/[0.07] text-zinc-600 hover:border-white/[0.11] hover:text-zinc-400'
                  }`}
                >LONG</button>
                <button
                  onClick={() => setDirection('short')}
                  className={`flex-1 py-2 rounded-md border text-xs font-medium tracking-[0.04em] transition-all ${
                    direction === 'short'
                      ? 'bg-red-500/12 border-red-500/25 text-red-500'
                      : 'bg-[#141416] border-white/[0.07] text-zinc-600 hover:border-white/[0.11] hover:text-zinc-400'
                  }`}
                >SHORT</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3.5">
              <Field label="Symbol *"><Input type="text" placeholder="NQ, ES…" defaultValue="NQ" /></Field>
              <Field label="Date *"><Input type="date" defaultValue="2025-05-13" /></Field>
              <Field label="Time"><Input type="time" defaultValue="09:47" /></Field>
              <Field label="Entry Price *"><Input type="number" placeholder="0.00" defaultValue="18842.00" step="0.25" /></Field>
              <Field label="Stop Loss *"><Input type="number" placeholder="0.00" defaultValue="18810.00" step="0.25" /></Field>
              <Field label="Take Profit"><Input type="number" placeholder="0.00" defaultValue="18910.00" step="0.25" /></Field>
              <Field label="Exit Price"><Input type="number" placeholder="0.00" defaultValue="18904.25" step="0.25" /></Field>
              <Field label="Contracts / Qty"><Input type="number" placeholder="1" defaultValue="2" min="1" /></Field>
              <Field label="P&L ($)">
                <Input type="text" placeholder="Auto-calculated" defaultValue="+$1,240" className="text-green-500" readOnly />
              </Field>
            </div>
          </FormCard>

          <FormCard>
            <SectionTitle>Context</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <Field label="Session">
                <Select>
                  <option>New York Open (09:30)</option>
                  <option>Silver Bullet (10:00)</option>
                  <option>London Open (02:00)</option>
                  <option>London Close (10:00)</option>
                  <option>Asia (20:00)</option>
                </Select>
              </Field>
              <Field label="Setup / Model">
                <Select>
                  <option>Breaker Block</option>
                  <option>ICT Order Block</option>
                  <option>Fair Value Gap</option>
                  <option>Silver Bullet</option>
                  <option>Liquidity Sweep</option>
                  <option>VWAP Rejection</option>
                </Select>
              </Field>
              <Field label="HTF Bias">
                <Select><option>Bullish</option><option>Bearish</option><option>Neutral</option></Select>
              </Field>
              <Field label="Confluence Grade">
                <Select><option>A+ Setup</option><option>A Setup</option><option>B Setup</option><option>C Setup</option></Select>
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
            <div className="border border-dashed border-white/[0.11] rounded-[10px] p-6 lg:p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/[0.18] hover:bg-[#1a1a1d] transition-all text-center mb-2">
              <div className="text-zinc-600 mb-1">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="3" y="6" width="26" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="11" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                  <polyline points="3,23 10,16 15,21 20,15 29,23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-[13px] text-zinc-400">Drop chart screenshot</div>
              <div className="text-[11px] text-zinc-700">PNG, JPG, WebP · Max 10MB</div>
              <button className="mt-2 px-3 py-1.5 rounded-md text-[11px] text-zinc-400 border border-white/[0.07] hover:bg-[#141416] transition-all">Browse Files</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="aspect-video bg-[#141416] border border-white/[0.07] rounded-md flex items-center justify-center cursor-pointer hover:border-white/[0.11] transition-all" />
              <div className="aspect-video bg-[#141416] border border-dashed border-white/[0.07] rounded-md flex items-center justify-center cursor-pointer hover:border-white/[0.11] transition-all">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
                  <line x1="8" y1="5" x2="8" y2="11" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="5" y1="8" x2="11" y2="8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </FormCard>

          <FormCard>
            <SectionTitle>Pre-Trade Checklist</SectionTitle>
            <div role="list">
              {checklist.map(item => <CheckItem key={item.id} item={item} onToggle={toggleCheck} />)}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[11px] text-zinc-700">{checklist.filter(i => i.checked).length}/{checklist.length} completed</span>
              <div className="flex-1 mx-3 h-1 bg-[#1a1a1d] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(checklist.filter(i => i.checked).length / checklist.length) * 100}%` }}
                />
              </div>
            </div>
          </FormCard>

          <FormCard>
            <SectionTitle>Notes &amp; Psychology</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Trade Rationale">
                <Textarea rows={3} placeholder="Describe the setup…" defaultValue="NY session open. Price swept Asian highs, confirmed bearish displacement into 4h OB. FVG + breaker alignment." />
              </Field>
              <Field label="Emotional State">
                <Select>
                  <option>Calm &amp; Focused</option>
                  <option>Confident</option>
                  <option>Anxious</option>
                  <option>Overconfident</option>
                  <option>Revenge Mode</option>
                  <option>Distracted</option>
                </Select>
              </Field>
              <Field label="Mistakes / Lessons">
                <Textarea rows={2} placeholder="What could have been done better?" />
              </Field>
            </div>
          </FormCard>

        </div>
      </div>
    </div>
  )
}