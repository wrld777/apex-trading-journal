import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ScreenshotInput from '../../components/ui/ScreenshotInput'
import { useUpdateTrade } from '../../hooks/useTrades'
import { useToastStore } from '../../store/toastStore'
import type { TradeDto, TradeOutcome, UpdateTradeRequest } from '../../types/trade'
import { t } from '../../i18n'

const OUTCOME_LABELS: Record<TradeOutcome, string> = {
  TakeProfit: 'TP',
  StopLoss: 'SL',
  BreakEven: 'BE',
  Manual: 'Manual',
}

const EMOTIONAL_STATES = [
  'Calm & Focused',
  'Confident',
  'Anxious',
  'Overconfident',
  'Revenge Mode',
  'Distracted',
]

const FIELD = 'bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full transition-all focus:border-white/[0.18] focus:bg-[#1a1a1d] placeholder:text-zinc-700 [color-scheme:dark]'

// ISO (UTC) → value for <input type="datetime-local"> (treats stored time as UTC wall-clock).
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}
// datetime-local value → ISO UTC string (consistent with how entryTime is stored).
function localInputToIso(value: string): string | null {
  if (!value) return null
  return `${value}:00.000Z`
}

export default function EditTradeModal({ trade, open, onClose }: {
  trade: TradeDto | null
  open: boolean
  onClose: () => void
}) {
  const { mutate: updateTrade, isPending } = useUpdateTrade()
  const addToast = useToastStore((s) => s.addToast)

  const [exitPrice, setExitPrice] = useState('')
  const [exitTime, setExitTime] = useState('')
  const [rationale, setRationale] = useState('')
  const [emotionalState, setEmotionalState] = useState(EMOTIONAL_STATES[0])
  const [mistakes, setMistakes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])

  // Re-seed the form whenever a different trade is opened.
  const [seededId, setSeededId] = useState<string | null>(null)
  if (trade && trade.id !== seededId) {
    setSeededId(trade.id)
    setExitPrice(trade.exitPrice ? String(trade.exitPrice) : '')
    setExitTime(isoToLocalInput(trade.exitTime))
    setRationale(trade.rationale ?? '')
    setEmotionalState(trade.emotionalState || EMOTIONAL_STATES[0])
    setMistakes(trade.mistakes ?? '')
    setTags(trade.tags ?? [])
    setTagInput('')
    setScreenshots(trade.screenshots ?? [])
  }

  // Un trade chiuso in un'unica uscita manuale è l'unico caso in cui ha senso
  // ritoccare il prezzo a mano: negli altri il prezzo lo deriva il server
  // dall'esito, e sui parziali non c'è un singolo prezzo da editare (#96).
  const exits = trade?.exits ?? []
  const isSimpleManualExit = exits.length <= 1 && (exits[0]?.outcome ?? 'Manual') === 'Manual'

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) setTags((prev) => [...prev, tagInput.trim()])
      setTagInput('')
    }
  }
  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const handleSave = () => {
    if (!trade) return

    const data: UpdateTradeRequest = {
      exitPrice: exitPrice ? parseFloat(exitPrice) : 0,
      exitTime: localInputToIso(exitTime),
      rationale,
      emotionalState,
      mistakes,
      tags,
      screenshots,
      // L'update ricostruisce le uscite da zero (#96): quelle non semplici vanno
      // rimandate uguali, o un trade con parziali diventerebbe un'uscita manuale
      // unica al prezzo medio. Qui si modifica solo il caso a uscita singola.
      ...(isSimpleManualExit
        ? { outcome: 'Manual' as const }
        : {
            exits: exits.map((e, i) => ({
              outcome: e.outcome,
              contracts: e.contracts,
              price: e.outcome === 'Manual' ? e.price : undefined,
              time: e.time,
              order: i,
            })),
          }),
    }

    updateTrade(
      { id: trade.id, data },
      {
        onSuccess: () => {
          addToast('Trade updated.', 'success')
          onClose()
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to update trade.'
          addToast(message, 'error')
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={trade ? `Edit ${trade.symbol} · ${trade.direction}` : 'Edit Trade'}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs text-zinc-400 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {isPending && (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
              </svg>
            )}
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          {isSimpleManualExit ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Exit Price</span>
              <input type="number" step="0.25" placeholder="0.00" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className={FIELD} />
            </label>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-zinc-600 tracking-[0.04em]">{t('tradeLog.exits')}</span>
              <div className="flex flex-col gap-1 pt-1">
                {exits.map((e, i) => (
                  <span key={i} className="text-[11px] text-zinc-400 font-mono">
                    {e.contracts}× {OUTCOME_LABELS[e.outcome]} @ {e.price}
                  </span>
                ))}
              </div>
            </div>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Exit Time</span>
            <input type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} className={FIELD} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Emotional State</span>
          <select
            value={emotionalState}
            onChange={(e) => setEmotionalState(e.target.value)}
            className={`${FIELD} cursor-pointer appearance-none`}
          >
            {EMOTIONAL_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Trade Rationale</span>
          <textarea rows={3} placeholder="Describe the setup…" value={rationale} onChange={(e) => setRationale(e.target.value)} className={`${FIELD} resize-y`} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Mistakes / Lessons</span>
          <textarea rows={2} placeholder="What could have been done better?" value={mistakes} onChange={(e) => setMistakes(e.target.value)} className={`${FIELD} resize-y`} />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Screenshots</span>
          <ScreenshotInput value={screenshots} onChange={setScreenshots} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-zinc-600 tracking-[0.04em]">Tags</span>
          <div
            className="flex flex-wrap gap-1.5 p-2 bg-[#141416] border border-white/[0.07] rounded-md min-h-[40px] items-center cursor-text focus-within:border-white/[0.18] transition-all"
            onClick={() => document.getElementById('edit-tag-input')?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border bg-[#1a1a1d] border-white/[0.07] text-zinc-400">
                {tag}
                <button onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:opacity-70 ml-0.5">×</button>
              </span>
            ))}
            <input
              id="edit-tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag…"
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-zinc-700 flex-1 min-w-[80px] px-1"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
