import { useState } from 'react'

import ScreenshotInput from '../../components/ui/ScreenshotInput'
import { Button, Card, CardHeader, PageHeader } from '../../design-system'
import { useCreateTrade } from '../../hooks/useTrades'
import { useInstruments } from '../../hooks/useInstruments'
import { useStrategies } from '../../hooks/useStrategies'
import { t } from '../../i18n'
import { useToastStore } from '../../store/toastStore'
import type { Direction, TradeOutcome } from '../../types/trade'

import { DEFAULT_FORM, newPartial, validate, type FormErrors, type FormState, type PartialDraft } from './schema'
import Context from './sections/Context'
import ExitPlan from './sections/ExitPlan'
import Notes from './sections/Notes'
import StrategyChecklist from './sections/StrategyChecklist'
import TradeDetails from './sections/TradeDetails'

/**
 * Registrazione di un trade.
 *
 * Qui restano solo tre cose: lo stato, la convalida e la chiamata al server.
 * Il disegno delle sezioni sta in `sections/` — prima erano 733 righe in cui la
 * logica di invio e il markup dell'ultima tendina si guardavano da distanze
 * incolmabili.
 *
 * Gli errori si mostrano **sotto il campo che li causa**. Finivano tutti in un
 * toast: un messaggio in un angolo, che sparisce da solo e non dice quale dei
 * dodici campi manca. Il toast resta per il risultato della chiamata, che è
 * l'unica cosa che non appartiene a nessun campo.
 */
export default function LogTrade() {
  const { mutate: createTrade, isPending } = useCreateTrade()
  const { data: strategies = [] } = useStrategies()
  const { data: instruments = [], isLoading: instrumentsLoading } = useInstruments()
  const addToast = useToastStore(s => s.addToast)

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [direction, setDirection] = useState<Direction>('Long')
  const [tags, setTags] = useState<string[]>([])
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [strategyId, setStrategyId] = useState('')
  // Aderenza per regola: quali condizioni oggettive erano rispettate su questo trade.
  const [ruleChecks, setRuleChecks] = useState<Record<string, boolean>>({})
  // Uscita (#96): esito singolo, oppure righe parziali quando la sezione è aperta.
  const [outcome, setOutcome] = useState<TradeOutcome | ''>('')
  const [partialsOpen, setPartialsOpen] = useState(false)
  const [partials, setPartials] = useState<PartialDraft[]>([newPartial()])
  const [errors, setErrors] = useState<FormErrors>({})

  const selectedInstrument = instruments.find(i => i.instrumentId === form.instrumentId) ?? null
  const selectedStrategy = strategies.find(s => s.id === strategyId) ?? null

  // Una strategia dichiara su quali strumenti gira (#95): se ne ha, il select
  // mostra solo quelli. Elenco vuoto = nessun vincolo, si vede tutto il catalogo.
  const allowedInstrumentIds = selectedStrategy?.instrumentIds ?? []
  const visibleInstruments = allowedInstrumentIds.length > 0
    ? instruments.filter(i => allowedInstrumentIds.includes(i.instrumentId))
    : instruments

  /** Correggere un campo ne toglie l'errore: tenerlo acceso mentre si scrive la
   *  risposta giusta è la cosa più fastidiosa che un modulo possa fare. */
  const onField = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const selectStrategy = (id: string) => {
    setStrategyId(id)
    const s = strategies.find(x => x.id === id)
    setRuleChecks(s ? Object.fromEntries(s.rules.map(r => [r.id, false])) : {})

    // Lo strumento già scelto può non rientrare fra quelli della nuova strategia:
    // lasciarlo selezionato ma fuori lista significherebbe un select che mostra
    // il segnaposto e invia comunque il vecchio id.
    const allowed = s?.instrumentIds ?? []
    if (allowed.length > 0 && form.instrumentId && !allowed.includes(form.instrumentId)) {
      setForm(prev => ({ ...prev, instrumentId: '' }))
    }
  }

  const togglePartials = () => {
    // Rientrando su uscita singola le righe non servono più; entrando, si parte
    // da una riga sola così il primo parziale è già pronto da compilare.
    setPartials([newPartial()])
    setPartialsOpen(open => !open)
    setErrors(prev => ({ ...prev, outcome: undefined, partials: undefined }))
  }

  const resetForm = () => {
    setForm(DEFAULT_FORM)
    setDirection('Long')
    setTags([])
    setScreenshots([])
    setStrategyId('')
    setRuleChecks({})
    setOutcome('')
    setPartialsOpen(false)
    setPartials([newPartial()])
    setErrors({})
  }

  const handleSubmit = () => {
    const found = validate(form, { partialsOpen, outcome, partials, exitPrice: form.exitPrice })
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Il riepilogo dice solo che c'è qualcosa da correggere: il *cosa* sta
      // accanto al campo, dove serve, e non sparisce da solo dopo tre secondi.
      addToast(t('logTrade.errFixBelow'), 'error')
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
          ? selectedStrategy.rules.map(r => ({ strategyRuleId: r.id, checked: !!ruleChecks[r.id] }))
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
          addToast(t('logTrade.saved'), 'success')
          resetForm()
        },
        onError: (err: unknown) => {
          addToast(err instanceof Error ? err.message : t('logTrade.saveFailed'), 'error')
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title={t('logTrade.title')}
        subtitle={t('logTrade.subtitle')}
        actions={
          <>
            <Button onClick={resetForm} disabled={isPending}>{t('logTrade.reset')}</Button>
            <Button variant="primary" onClick={handleSubmit} loading={isPending}>
              {isPending ? t('logTrade.submitting') : t('logTrade.submit')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-3.5">
          <TradeDetails
            form={form}
            errors={errors}
            onField={onField}
            direction={direction}
            onDirection={setDirection}
            instruments={visibleInstruments}
            instrumentsLoading={instrumentsLoading}
            selectedInstrument={selectedInstrument}
            strategyName={selectedStrategy?.name}
            restricted={allowedInstrumentIds.length > 0}
          />

          <ExitPlan
            form={form}
            errors={errors}
            onField={onField}
            outcome={outcome}
            onOutcome={o => { setOutcome(o); setErrors(prev => ({ ...prev, outcome: undefined })) }}
            partialsOpen={partialsOpen}
            onTogglePartials={togglePartials}
            partials={partials}
            onPartialChange={(key, patch) => {
              setPartials(ps => ps.map(p => (p.key === key ? { ...p, ...patch } : p)))
              setErrors(prev => (prev.partials ? { ...prev, partials: undefined } : prev))
            }}
            onAddPartial={() => setPartials(ps => [...ps, newPartial()])}
            onRemovePartial={key => setPartials(ps => ps.filter(p => p.key !== key))}
          />

          <Context form={form} onField={onField} tags={tags} onTags={setTags} />
        </div>

        <div className="flex flex-col gap-3.5">
          <Card>
            <CardHeader title={t('logTrade.sectionScreenshot')} />
            <ScreenshotInput value={screenshots} onChange={setScreenshots} />
          </Card>

          <StrategyChecklist
            strategies={strategies}
            strategyId={strategyId}
            onSelect={selectStrategy}
            ruleChecks={ruleChecks}
            onToggleRule={id => setRuleChecks(prev => ({ ...prev, [id]: !prev[id] }))}
          />

          <Notes form={form} onField={onField} />
        </div>
      </div>
    </>
  )
}
