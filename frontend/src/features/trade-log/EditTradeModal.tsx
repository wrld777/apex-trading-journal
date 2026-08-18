import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ScreenshotInput from '../../components/ui/ScreenshotInput'
import { useUpdateTrade } from '../../hooks/useTrades'
import { useToastStore } from '../../store/toastStore'
import type { TradeDto, TradeOutcome, UpdateTradeRequest } from '../../types/trade'
import { t } from '../../i18n'

const OUTCOME_LABELS: Record<TradeOutcome, string> = {
  TakeProfit: t('tradeLog.exitTp'),
  StopLoss: t('tradeLog.exitSl'),
  BreakEven: t('tradeLog.exitBe'),
  Manual: t('logTrade.outcomeManual'),
}

const EMOTIONAL_STATES = [
  'Calm & Focused',
  'Confident',
  'Anxious',
  'Overconfident',
  'Revenge Mode',
  'Distracted',
]

const FIELD = 'bg-surface-2 border border-line-2 rounded-md px-3 py-2 text-[13px] text-content-strong outline-none w-full transition-all focus:border-line-control focus:bg-surface-3 placeholder:text-content-faint [color-scheme:dark]'

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
      title={trade ? t('tradeLog.editTitleTrade', { symbol: trade.symbol, direction: trade.direction }) : t('tradeLog.editTitle')}
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
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {isPending && (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
              </svg>
            )}
            {isPending ? t('common.saving') : t('common.saveChanges')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          {isSimpleManualExit ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.exitPriceLabel')}</span>
              <input type="number" step="0.25" placeholder="0.00" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className={FIELD} />
            </label>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('tradeLog.exits')}</span>
              <div className="flex flex-col gap-1 pt-1">
                {exits.map((e, i) => (
                  <span key={i} className="text-[11px] text-content-secondary font-mono">
                    {e.contracts}× {OUTCOME_LABELS[e.outcome]} @ {e.price}
                  </span>
                ))}
              </div>
            </div>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.exitTime')}</span>
            <input type="datetime-local" value={exitTime} onChange={(e) => setExitTime(e.target.value)} className={FIELD} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.emotionalState')}</span>
          <select
            value={emotionalState}
            onChange={(e) => setEmotionalState(e.target.value)}
            className={`${FIELD} cursor-pointer appearance-none`}
          >
            {EMOTIONAL_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.rationale')}</span>
          <textarea rows={3} placeholder={t('logTrade.rationalePlaceholder')} value={rationale} onChange={(e) => setRationale(e.target.value)} className={`${FIELD} resize-y`} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.mistakes')}</span>
          <textarea rows={2} placeholder={t('logTrade.mistakesPlaceholder')} value={mistakes} onChange={(e) => setMistakes(e.target.value)} className={`${FIELD} resize-y`} />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.screenshots')}</span>
          <ScreenshotInput value={screenshots} onChange={setScreenshots} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-content-muted tracking-[0.04em]">{t('logTrade.tags')}</span>
          <div
            className="flex flex-wrap gap-1.5 p-2 bg-surface-2 border border-line-2 rounded-md min-h-[40px] items-center cursor-text focus-within:border-line-control transition-all"
            onClick={() => document.getElementById('edit-tag-input')?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border bg-surface-3 border-line-2 text-content-secondary">
                {tag}
                <button onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:opacity-70 ml-0.5">×</button>
              </span>
            ))}
            <input
              id="edit-tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder={t('logTrade.tagPlaceholder')}
              className="bg-transparent border-none outline-none text-xs text-content-strong placeholder:text-content-faint flex-1 min-w-[80px] px-1"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
